/**
 * @fileoverview Checks layout of decorators and JSDoc comments that precede declarations
 * @author kukjevov
 */

import {AST_NODE_TYPES} from '@typescript-eslint/utils';
import type {TSESTree} from '@typescript-eslint/utils';
import type {RuleContext, RuleFixer, RuleFix} from '@typescript-eslint/utils/ts-eslint';

import {createRule} from '../utils/index.js';

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

type MessageIds = 'blankLineAfterJsdoc' | 'blankLineAfterDecorator' | 'decoratorOwnLine' | 'parameterDecoratorInline';

/**
 * Node types that can have decorators on their own line(s)
 */
type DecoratedNode = TSESTree.ClassDeclaration|TSESTree.PropertyDefinition|TSESTree.MethodDefinition|TSESTree.AccessorProperty|TSESTree.TSAbstractPropertyDefinition|TSESTree.TSAbstractMethodDefinition|TSESTree.TSAbstractAccessorProperty;

/**
 * Gets leading whitespace of line
 * @param context - Rule context
 * @param line - 1 based line number
 * @returns Indentation of line
 */
function getIndent(context: Readonly<RuleContext<MessageIds, []>>, line: number): string
{
    return /^\s*/.exec(context.sourceCode.lines[line - 1])?.[0] ?? '';
}

/**
 * Gets decorators of node, including decorators of exported declaration
 * @param node - Node to be checked
 * @returns Array of decorators
 */
function getAllDecorators(node: TSESTree.Node): TSESTree.Decorator[]
{
    const result = [...((node as {decorators?: TSESTree.Decorator[]}).decorators ?? [])];
    const declaration = (node as {declaration?: TSESTree.Node|null}).declaration;

    if(declaration)
    {
        result.push(...((declaration as {decorators?: TSESTree.Decorator[]}).decorators ?? []));
    }

    return result;
}

export default createRule<[], MessageIds>(
{
    name: 'decorator-layout',
    meta:
    {
        docs:
        {
            description: 'Checks layout of decorators and no blank line between JSDoc, decorators and declaration',
            recommended: 'stylistic',
            requiresTypeChecking: false,
            extendsBaseRule: false,
        },
        messages:
        {
            blankLineAfterJsdoc: 'No blank line allowed between JSDoc and the declaration.',
            blankLineAfterDecorator: 'No blank line allowed after a decorator.',
            decoratorOwnLine: 'Class and member decorators must be on their own line.',
            parameterDecoratorInline: 'Parameter decorators must be on the same line as the parameter.',
        },
        schema:
        [
        ],
        type: 'layout',
        fixable: 'whitespace'
    },
    defaultOptions: [],
    create(context)
    {
        const sourceCode = context.sourceCode;

        /**
         * Checks that there is no blank line between JSDoc and following declaration
         * @param node - Statement or member to be checked
         */
        function checkJsdoc(node: TSESTree.Node): void
        {
            //imports are not documented, comment before them is file header
            if(node.type == AST_NODE_TYPES.ImportDeclaration)
            {
                return;
            }

            const start = Math.min(node.range[0], ...getAllDecorators(node).map(itm => itm.range[0]));
            const first = sourceCode.getTokenByRangeStart(start);

            if(!first)
            {
                return;
            }

            const comments = sourceCode.getCommentsBefore(first);
            const comment = comments[comments.length - 1];

            if(!comment || comment.type != 'Block' || !comment.value.startsWith('*'))
            {
                return;
            }

            //file header comment is not documentation of following declaration
            if(comment == sourceCode.getAllComments()[0] && /@(fileoverview|file)\b/.test(comment.value))
            {
                return;
            }

            if(first.loc.start.line - comment.loc.end.line < 2)
            {
                return;
            }

            context.report(
            {
                loc: {start: comment.loc.end, end: first.loc.start},
                messageId: 'blankLineAfterJsdoc',
                fix: fixer => fixer.replaceTextRange([comment.range[1], first.range[0]], `\n${getIndent(context, first.loc.start.line)}`),
            });
        }

        /**
         * Checks decorators of class or member
         * @param node - Class or member to be checked
         */
        function checkDecorators(node: DecoratedNode): void
        {
            const decorators = node.decorators;

            if(!decorators?.length)
            {
                return;
            }

            const indent = getIndent(context, decorators[0].loc.start.line);

            decorators.forEach((decorator, index) =>
            {
                if(index == 0)
                {
                    const prev = sourceCode.getTokenBefore(decorator, {includeComments: true});

                    if(prev && prev.type != 'Block' && prev.type != 'Line' && prev.loc.end.line == decorator.loc.start.line && prev.value != 'export' && prev.value != 'default')
                    {
                        context.report(
                        {
                            node: decorator,
                            messageId: 'decoratorOwnLine',
                            fix: fixer => fixer.replaceTextRange([prev.range[1], decorator.range[0]], `\n${indent}`),
                        });
                    }
                }

                const next = sourceCode.getTokenAfter(decorator, {includeComments: true});

                if(!next)
                {
                    return;
                }

                const gap = next.loc.start.line - decorator.loc.end.line;

                if(gap == 0)
                {
                    //trailing comment is fine
                    if(next.type == 'Block' || next.type == 'Line')
                    {
                        return;
                    }

                    context.report(
                    {
                        node: decorator,
                        messageId: 'decoratorOwnLine',
                        fix: fixer => fixer.replaceTextRange([decorator.range[1], next.range[0]], `\n${indent}`),
                    });
                }
                else if(gap > 1)
                {
                    context.report(
                    {
                        node: decorator,
                        messageId: 'blankLineAfterDecorator',
                        fix: fixer => fixer.replaceTextRange([decorator.range[1], next.range[0]], `\n${indent}`),
                    });
                }
            });
        }

        /**
         * Checks decorators of parameters of function
         * @param node - Function to be checked
         */
        function checkParameters(node: TSESTree.FunctionDeclaration|TSESTree.FunctionExpression|TSESTree.TSEmptyBodyFunctionExpression): void
        {
            for(const param of node.params)
            {
                const decorators = [...((param as {decorators?: TSESTree.Decorator[]}).decorators ?? [])];

                if(param.type == AST_NODE_TYPES.AssignmentPattern)
                {
                    decorators.push(...((param.left as {decorators?: TSESTree.Decorator[]}).decorators ?? []));
                }

                for(const decorator of decorators)
                {
                    const next = sourceCode.getTokenAfter(decorator);

                    if(!next || next.loc.start.line == decorator.loc.end.line)
                    {
                        continue;
                    }

                    context.report(
                    {
                        node: decorator,
                        messageId: 'parameterDecoratorInline',
                        fix: sourceCode.commentsExistBetween(decorator, next) ? null : (fixer: RuleFixer): RuleFix => fixer.replaceTextRange([decorator.range[1], next.range[0]], ' '),
                    });
                }
            }
        }

        return {
            'Program > *': checkJsdoc,
            'BlockStatement > *': checkJsdoc,
            'TSModuleBlock > *': checkJsdoc,
            'ClassBody > *': checkJsdoc,
            'TSInterfaceBody > *': checkJsdoc,
            'TSTypeLiteral > *': checkJsdoc,
            ClassDeclaration: checkDecorators,
            PropertyDefinition: checkDecorators,
            MethodDefinition: checkDecorators,
            AccessorProperty: checkDecorators,
            TSAbstractPropertyDefinition: checkDecorators,
            TSAbstractMethodDefinition: checkDecorators,
            TSAbstractAccessorProperty: checkDecorators,
            FunctionDeclaration: checkParameters,
            FunctionExpression: checkParameters,
            TSEmptyBodyFunctionExpression: checkParameters,
        };
    }
});
