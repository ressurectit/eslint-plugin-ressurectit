/**
 * @fileoverview Checks that opening brace/bracket of multi-line literals is on its own line
 * @author kukjevov
 */

import {AST_NODE_TYPES} from '@typescript-eslint/utils';
import type {TSESTree} from '@typescript-eslint/utils';
import type {RuleContext, RuleFixer, RuleFix} from '@typescript-eslint/utils/ts-eslint';

import {createRule, followsOperator, getLineIndent} from '../utils/index.js';

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

type MessageIds = 'openerOnOwnLine' | 'arrowObjectLayout';

/**
 * Gets human readable kind of literal
 * @param node - Node to get kind for
 * @returns Name of kind used in message
 */
function getKind(node: TSESTree.Node): string
{
    switch(node.type)
    {
        case AST_NODE_TYPES.ObjectExpression:
        {
            return 'object literal';
        }
        case AST_NODE_TYPES.ArrayExpression:
        {
            return 'array literal';
        }
        case AST_NODE_TYPES.TSTypeLiteral:
        {
            return 'type literal';
        }
        case AST_NODE_TYPES.TSInterfaceBody:
        {
            return 'interface body';
        }
        default:
        {
            return 'enum body';
        }
    }
}

/**
 * Checks whether literal is exempt (returned directly from function, B.2), type assertions (`<T>{`, `{…} as T`, `{…} satisfies T`) around literal are allowed
 * @param node - Node to check
 * @returns True if node is exempt
 */
function isReturned(node: TSESTree.Node): boolean
{
    let current: TSESTree.Node = node;

    while((current.parent?.type == AST_NODE_TYPES.TSTypeAssertion ||
           current.parent?.type == AST_NODE_TYPES.TSAsExpression ||
           current.parent?.type == AST_NODE_TYPES.TSSatisfiesExpression) &&
          current.parent.expression === current)
    {
        current = current.parent;
    }

    return current.parent?.type == AST_NODE_TYPES.ReturnStatement && current.parent.argument === current;
}

/**
 * Checks whether line break after token would change meaning of code (ASI after restricted production keywords)
 * @param token - Token after which line break would be inserted
 * @returns True if line break must not be inserted after token
 */
function isRestrictedKeyword(token: TSESTree.Token): boolean
{
    return token.type == 'Keyword' && ['return', 'throw', 'yield'].includes(token.value);
}

export default createRule<[], MessageIds>(
{
    name: 'literal-brace-style',
    meta:
    {
        type: 'layout',
        docs:
        {
            description: 'Checks that opening brace/bracket of multi-line literals is on its own line',
        },
        fixable: 'whitespace',
        schema: [],
        messages:
        {
            openerOnOwnLine: 'Opening \'{{opener}}\' of a multi-line {{kind}} must be on its own line.',
            arrowObjectLayout: 'Arrow returning a multi-line object must use \'=> (\' followed by \'{\' on the next line.',
        },
    },
    defaultOptions: [],
    create(context: RuleContext<MessageIds, []>)
    {
        const sourceCode = context.sourceCode;

        /**
         * Checks single literal
         * @param node - Literal node
         */
        function check(node: TSESTree.Node): void
        {
            if(node.loc.start.line == node.loc.end.line || isReturned(node))
            {
                return;
            }

            const opener = sourceCode.getFirstToken(node);
            const prev = opener ? sourceCode.getTokenBefore(opener) : null;

            //opener cannot leave operator or restricted production keyword (ASI), no precise report possible
            if(!opener || !prev || followsOperator(sourceCode, prev) || isRestrictedKeyword(prev))
            {
                return;
            }

            const text = sourceCode.getText();

            // B.3 arrow returning object in parentheses
            if(node.parent?.type == AST_NODE_TYPES.ArrowFunctionExpression &&
               node.parent.body === node &&
               prev.type == 'Punctuator' &&
               prev.value == '(')
            {
                const arrow = sourceCode.getTokenBefore(prev);

                if(arrow && arrow.type == 'Punctuator' && arrow.value == '=>')
                {
                    if(arrow.loc.end.line == prev.loc.start.line && prev.loc.end.line != opener.loc.start.line)
                    {
                        return;
                    }

                    const between = text.slice(arrow.range[1], opener.range[0]);

                    context.report(
                    {
                        node: opener,
                        messageId: 'arrowObjectLayout',
                        fix: (fixer: RuleFixer): RuleFix | null =>
                        {
                            if(between.replace(/\(/, '').trim() || sourceCode.getAllComments().some(c => c.range[0] >= arrow.range[1] && c.range[1] <= opener.range[0]))
                            {
                                return null;
                            }

                            return fixer.replaceTextRange([arrow.range[1], opener.range[0]], ' (\n' + getLineIndent(sourceCode, arrow.loc.end.line));
                        },
                    });

                    return;
                }
            }

            if(prev.loc.end.line != opener.loc.start.line)
            {
                return;
            }

            context.report(
            {
                node: opener,
                messageId: 'openerOnOwnLine',
                data:
                {
                    opener: opener.value,
                    kind: getKind(node),
                },
                fix: (fixer: RuleFixer): RuleFix | null =>
                {
                    if(text.slice(prev.range[1], opener.range[0]).trim() ||
                       sourceCode.getAllComments().some(c => c.range[0] >= prev.range[1] && c.range[1] <= opener.range[0]))
                    {
                        return null;
                    }

                    return fixer.replaceTextRange([prev.range[1], opener.range[0]], '\n' + getLineIndent(sourceCode, prev.loc.end.line));
                },
            });
        }

        return {
            ObjectExpression: check,
            ArrayExpression: check,
            TSTypeLiteral: check,
            TSInterfaceBody: check,
            TSEnumBody: check,
        } as Record<string, (node: TSESTree.Node) => void>;
    },
});
