/**
 * @fileoverview Checks layout of parameters and arguments (wrapping, alignment and trailing comma)
 * @author kukjevov
 */

import {AST_NODE_TYPES} from '@typescript-eslint/utils';
import type {TSESTree} from '@typescript-eslint/utils';
import type {RuleFixer} from '@typescript-eslint/utils/ts-eslint';

import {createBreakAfterCommaFixes, createRule} from '../utils/index.js';

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

/**
 * Options of rule
 */
export interface ArgumentLayoutOptions
{
    /**
     * Maximal length of line, longer line with more than 2 parameters is wrapped
     */
    maxLength?: number;
}

/**
 * Type of function like node that is checked by this rule
 */
type FunctionLikeNode = TSESTree.FunctionDeclaration | TSESTree.FunctionExpression | TSESTree.TSDeclareFunction | TSESTree.TSEmptyBodyFunctionExpression;

/**
 * Gets start position of parameter, including its decorators
 * @param param - Parameter which start is requested
 * @returns Start offset in source text and location
 */
function getParamStart(param: TSESTree.Parameter): {range: number, loc: TSESTree.Position}
{
    const decorators = (param as {decorators?: TSESTree.Decorator[]}).decorators;

    if(decorators?.length && decorators[0].range[0] < param.range[0])
    {
        return {range: decorators[0].range[0], loc: decorators[0].loc.start};
    }

    return {range: param.range[0], loc: param.loc.start};
}

export default createRule<[ArgumentLayoutOptions?], 'constructorParamsWrap'|'paramsWrap'|'trailingCommaRequired'|'trailingCommaForbidden'>(
{
    name: 'argument-layout',
    meta:
    {
        docs:
        {
            description: 'Checks wrapping of parameters and trailing commas in parameter and argument lists',
            recommended: 'stylistic',
            requiresTypeChecking: false,
            extendsBaseRule: false,
        },
        messages:
        {
            constructorParamsWrap: 'Constructor with 2 or more parameters must have each parameter on its own line, aligned with the first.',
            paramsWrap: 'Line exceeds {{maxLength}} characters: wrap parameters, aligned with the first.',
            trailingCommaRequired: 'Wrapped parameter list must end with a trailing comma.',
            trailingCommaForbidden: 'Trailing comma not allowed here.',
        },
        schema:
        [
            {
                type: 'object',
                properties:
                {
                    maxLength:
                    {
                        type: 'integer',
                        minimum: 1,
                    },
                },
                additionalProperties: false,
            },
        ],
        type: 'layout',
        fixable: 'code',
    },
    defaultOptions: [{maxLength: 120}],
    create(context, [options])
    {
        const sourceCode = context.sourceCode;
        const maxLength = options?.maxLength ?? 120;

        /**
         * Reports trailing comma that is not allowed, removes it if there are no comments around
         * @param comma - Trailing comma token
         * @param closing - Closing parenthesis token
         */
        function reportForbidden(comma: TSESTree.Token, closing: TSESTree.Token): void
        {
            context.report(
            {
                messageId: 'trailingCommaForbidden',
                loc: comma.loc,
                fix: sourceCode.commentsExistBetween(comma, closing) ? null : (fixer: RuleFixer) => fixer.remove(comma),
            });
        }

        /**
         * Checks declaration of function like node
         * @param node - Node to be checked
         */
        function checkDeclaration(node: FunctionLikeNode): void
        {
            const params = node.params;

            if(!params.length)
            {
                return;
            }

            const first = getParamStart(params[0]);
            const openParen = sourceCode.getTokenBefore({range: [first.range, first.range]} as TSESTree.Node);
            const last = params[params.length - 1];
            let closing = sourceCode.getTokenAfter(last);

            if(!openParen || openParen.value != '(' || !closing)
            {
                return;
            }

            let trailingComma: TSESTree.Token|null = null;

            if(closing.value == ',')
            {
                trailingComma = closing;
                closing = sourceCode.getTokenAfter(closing);
            }

            if(!closing || closing.value != ')')
            {
                return;
            }

            const isRest = last.type == AST_NODE_TYPES.RestElement;
            const parent = node.parent;
            const isConstructor = !!parent &&
                                  (parent.type == AST_NODE_TYPES.MethodDefinition || parent.type == AST_NODE_TYPES.TSAbstractMethodDefinition) &&
                                  parent.kind == 'constructor' &&
                                  parent.value == node;
            const starts = params.map(getParamStart);
            const wrapped = starts.some(itm => itm.loc.line != openParen.loc.start.line);
            const hasComments = sourceCode.commentsExistBetween(openParen, closing);
            let wrapMessage: 'constructorParamsWrap'|'paramsWrap'|null = null;

            if(isConstructor && params.length >= 2)
            {
                const column = starts[0].loc.column;

                if(starts.some((itm, index) => index > 0 && (itm.loc.line == params[index - 1].loc.end.line || itm.loc.column != column)))
                {
                    wrapMessage = 'constructorParamsWrap';
                }
            }
            else if(params.length > 2 && !wrapped && sourceCode.lines[openParen.loc.start.line - 1].length > maxLength)
            {
                wrapMessage = 'paramsWrap';
            }

            if(wrapMessage)
            {
                context.report(
                {
                    messageId: wrapMessage,
                    data: {maxLength},
                    loc: {start: openParen.loc.start, end: closing.loc.end},
                    fix: hasComments ? null : (fixer: RuleFixer) =>
                    {
                        const result = createBreakAfterCommaFixes(fixer, sourceCode, params, '\n' + ' '.repeat(starts[0].loc.column));

                        if(!trailingComma && !isRest)
                        {
                            result.push(fixer.insertTextAfter(last, ','));
                        }

                        return result;
                    },
                });

                if(!hasComments)
                {
                    return;
                }
            }

            if(wrapped && !trailingComma && !isRest)
            {
                context.report(
                {
                    messageId: 'trailingCommaRequired',
                    loc: {start: last.loc.end, end: closing.loc.end},
                    fix: fixer => fixer.insertTextAfter(last, ','),
                });
            }
            else if(!wrapped && trailingComma)
            {
                reportForbidden(trailingComma, closing);
            }
        }

        /**
         * Checks trailing comma of call or new expression
         * @param node - Node to be checked
         */
        function checkCall(node: TSESTree.CallExpression|TSESTree.NewExpression): void
        {
            if(!node.arguments.length)
            {
                return;
            }

            const closing = sourceCode.getLastToken(node);

            if(!closing || closing.value != ')')
            {
                return;
            }

            const comma = sourceCode.getTokenBefore(closing);

            if(comma && comma.value == ',' && comma.range[0] >= node.arguments[node.arguments.length - 1].range[1])
            {
                reportForbidden(comma, closing);
            }
        }

        return {
            FunctionDeclaration: checkDeclaration,
            FunctionExpression: checkDeclaration,
            TSDeclareFunction: checkDeclaration,
            TSEmptyBodyFunctionExpression: checkDeclaration,
            CallExpression: checkCall,
            NewExpression: checkCall,
        };
    }
});
