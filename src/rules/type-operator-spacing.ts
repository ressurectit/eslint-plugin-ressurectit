/**
 * @fileoverview Checks spacing around union (`|`) and intersection (`&`) operators in types
 * @author kukjevov
 */

import {AST_TOKEN_TYPES} from '@typescript-eslint/utils';
import type {TSESTree} from '@typescript-eslint/utils';
import type {RuleFix} from '@typescript-eslint/utils/ts-eslint';

import {createRule} from '../utils/index.js';

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

export default createRule(
{
    name: 'type-operator-spacing',
    meta:
    {
        docs:
        {
            description: 'Checks spacing around union and intersection operators in types',
            recommended: 'stylistic',
            requiresTypeChecking: false,
            extendsBaseRule: false,
        },
        messages:
        {
            "unexpectedSpace": "No spaces around '{{operator}}' in types."
        },
        schema:
        [
        ],
        type: 'layout',
        fixable: 'whitespace',
    },
    defaultOptions: [],
    create(context)
    {
        const sourceCode = context.sourceCode;

        /**
         * Gets operator tokens which belong directly to the type node, tokens of nested types are skipped
         * @param node - Union or intersection type node
         * @param operator - Operator character, `|` or `&`
         * @returns Operator tokens of the type node
         */
        function getOperatorTokens(node: TSESTree.TSUnionType | TSESTree.TSIntersectionType, operator: string): TSESTree.Token[]
        {
            return sourceCode.getTokens(node).filter(token => token.type == AST_TOKEN_TYPES.Punctuator
                                                              && token.value == operator
                                                              && !node.types.some(type => token.range[0] >= type.range[0] && token.range[1] <= type.range[1]));
        }

        /**
         * Checks same-line whitespace before and after operator token and reports it, fix removes such whitespace
         * @param node - Union or intersection type node
         * @param token - Operator token to check
         * @param operator - Operator character, `|` or `&`
         */
        function checkOperatorToken(node: TSESTree.TSUnionType | TSESTree.TSIntersectionType, token: TSESTree.Token, operator: string): void
        {
            const ranges: [number, number][] = [];
            const prev = sourceCode.getTokenBefore(token, {includeComments: true});
            const next = sourceCode.getTokenAfter(token, {includeComments: true});
            const leading = token.range[0] < node.types[0].range[0];

            //whitespace before operator, leading operator is separated from previous token by regular syntax spacing
            if(!leading && prev)
            {
                const between = sourceCode.text.slice(prev.range[1], token.range[0]);
                const match = /[ \t]+$/.exec(between);

                //line breaks and indentation are never touched
                if(match && !between.includes('\n'))
                {
                    ranges.push([token.range[0] - match[0].length, token.range[0]]);
                }
            }

            //whitespace after operator
            if(next)
            {
                const between = sourceCode.text.slice(token.range[1], next.range[0]);
                const match = /^[ \t]+/.exec(between);

                //line breaks and indentation are never touched
                if(match && !between.includes('\n'))
                {
                    ranges.push([token.range[1], token.range[1] + match[0].length]);
                }
            }

            if(!ranges.length)
            {
                return;
            }

            //fix is not provided when affected range is adjacent to comment
            const hasComment = (prev?.type == AST_TOKEN_TYPES.Line || prev?.type == AST_TOKEN_TYPES.Block)
                               || (next?.type == AST_TOKEN_TYPES.Line || next?.type == AST_TOKEN_TYPES.Block);

            context.report(
            {
                messageId: 'unexpectedSpace',
                node,
                loc: token.loc,
                data:
                {
                    operator
                },
                fix: hasComment ? null : fixer => ranges.map(range => fixer.removeRange(range)) as RuleFix[]
            });
        }

        /**
         * Checks spacing of all operators of union or intersection type node
         * @param node - Union or intersection type node
         * @param operator - Operator character, `|` or `&`
         */
        function checkTypeOperators(node: TSESTree.TSUnionType | TSESTree.TSIntersectionType, operator: string): void
        {
            getOperatorTokens(node, operator).forEach(token => checkOperatorToken(node, token, operator));
        }

        return {
            /**
             * Checks spacing around `|` operators of union type
             * @param node - Union type node
             */
            TSUnionType(node: TSESTree.TSUnionType)
            {
                checkTypeOperators(node, '|');
            },
            /**
             * Checks spacing around `&` operators of intersection type
             * @param node - Intersection type node
             */
            TSIntersectionType(node: TSESTree.TSIntersectionType)
            {
                checkTypeOperators(node, '&');
            }
        };
    }
});
