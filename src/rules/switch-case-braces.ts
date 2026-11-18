/**
 * @fileoverview Checks that body of switch case is a single block starting on the next line
 * @author kukjevov
 */

import {AST_NODE_TYPES} from '@typescript-eslint/utils';
import type {SourceCode} from '@typescript-eslint/utils/ts-eslint';
import type {TSESTree} from '@typescript-eslint/utils';

import {createRule, getLineIndent} from '../utils/index.js';

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

/**
 * Gets label of switch case used in messages
 * @param node - Switch case node
 * @param sourceCode - Source code of linted file
 * @returns Label of case, `case <test>` or `default`
 */
function getCaseLabel(node: TSESTree.SwitchCase, sourceCode: Readonly<SourceCode>): string
{
    return node.test ? `case ${sourceCode.getText(node.test)}` : 'default';
}

/**
 * Checks whether is node the first token on its line (comments are taken into account)
 * @param node - Node to be checked
 * @param sourceCode - Source code of linted file
 * @returns True when no token or comment precedes node on the same line
 */
function isFirstOnLine(node: TSESTree.Node, sourceCode: Readonly<SourceCode>): boolean
{
    const previous = sourceCode.getTokenBefore(node, {includeComments: true});

    return !previous || previous.loc.end.line < node.loc.start.line;
}

export default createRule(
{
    name: 'switch-case-braces',
    meta:
    {
        docs:
        {
            description: 'Checks that body of switch case is a single block starting on the next line',
            recommended: 'stylistic',
            requiresTypeChecking: false,
            extendsBaseRule: false,
        },
        messages:
        {
            "caseBlockRequired": "Body of '{{label}}' must be a single block statement.",
            "caseBlockOnNextLine": "Block of '{{label}}' must start on the next line.",
            "noBlankLineBetweenCases": "No blank line allowed between '}' and the next case."
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
        const newLine = sourceCode.text.includes('\r\n') ? '\r\n' : '\n';

        return {
            SwitchCase(node)
            {
                //empty consequent is allowed (fall-through)
                if(!node.consequent.length)
                {
                    return;
                }

                const label = getCaseLabel(node, sourceCode);
                const block = node.consequent[0];

                if(node.consequent.length != 1 || block.type != AST_NODE_TYPES.BlockStatement)
                {
                    //no fix, wrapping statements into block changes scoping
                    context.report(
                    {
                        messageId: 'caseBlockRequired',
                        node,
                        data: {label},
                    });

                    return;
                }

                const colon = sourceCode.getTokenBefore(block)!;
                const previous = sourceCode.getTokenBefore(block, {includeComments: true})!;

                if(previous.loc.end.line == block.loc.start.line)
                {
                    context.report(
                    {
                        messageId: 'caseBlockOnNextLine',
                        node: block,
                        data: {label},
                        fix: previous === colon && isFirstOnLine(node, sourceCode)
                            ? fixer => fixer.replaceTextRange([colon.range[1], block.range[0]], `${newLine}${getLineIndent(sourceCode, node.loc.start.line)}`)
                            : null,
                    });
                }

                const cases = (node.parent as TSESTree.SwitchStatement).cases;
                const next = cases[cases.indexOf(node) + 1];

                if(!next)
                {
                    return;
                }

                const closing = sourceCode.getLastToken(block)!;
                const nextStart = sourceCode.getFirstToken(next)!;

                if(nextStart.loc.start.line - closing.loc.end.line > 1)
                {
                    context.report(
                    {
                        messageId: 'noBlankLineBetweenCases',
                        node: next,
                        fix: sourceCode.getTokenBefore(nextStart, {includeComments: true}) === closing
                            ? fixer => fixer.replaceTextRange([closing.range[1], nextStart.range[0]], `${newLine}${getLineIndent(sourceCode, next.loc.start.line)}`)
                            : null,
                    });
                }
            }
        };
    }
});
