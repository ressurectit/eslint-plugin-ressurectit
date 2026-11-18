/**
 * @fileoverview Helpers shared by fixers of layout rules
 * @author kukjevov
 */

import type {TSESTree} from '@typescript-eslint/utils';
import {AST_NODE_TYPES} from '@typescript-eslint/utils';
import type {RuleFix, RuleFixer, SourceCode} from '@typescript-eslint/utils/ts-eslint';

/**
 * Gets leading whitespace (spaces and tabs) of line
 * @param sourceCode - Source code of linted file
 * @param line - 1-based line number
 * @returns Leading whitespace of line, empty string if line does not exist
 */
export function getLineIndent(sourceCode: Readonly<SourceCode>, line: number): string
{
    return /^[ \t]*/.exec(sourceCode.lines[line - 1] ?? '')![0];
}

/**
 * Gets items of literal (array elements or object properties), null if literal has holes
 * @param literal - Literal to get items of
 * @returns Items of literal or null
 */
export function getLiteralItems(literal: TSESTree.ArrayExpression|TSESTree.ObjectExpression): TSESTree.Node[]|null
{
    if(literal.type == AST_NODE_TYPES.ObjectExpression)
    {
        return literal.properties;
    }

    if(literal.elements.some(itm => !itm))
    {
        return null;
    }

    return literal.elements as TSESTree.Node[];
}

/**
 * Creates fixes that replace whitespace after comma that follows each item (except the last one) with separator
 * @param fixer - Fixer used for creating fixes
 * @param sourceCode - Source code of linted file
 * @param items - Items separated by commas
 * @param separator - Text that replaces whitespace between comma and next token
 * @returns Fixes, one per comma
 */
export function createBreakAfterCommaFixes(fixer: RuleFixer, sourceCode: Readonly<SourceCode>, items: TSESTree.Node[], separator: string): RuleFix[]
{
    const result: RuleFix[] = [];

    for(let x = 1; x < items.length; x++)
    {
        const comma = sourceCode.getTokenAfter(items[x - 1], {filter: token => token.value == ','})!;
        const next = sourceCode.getTokenAfter(comma)!;

        result.push(fixer.replaceTextRange([comma.range[1], next.range[0]], separator));
    }

    return result;
}
