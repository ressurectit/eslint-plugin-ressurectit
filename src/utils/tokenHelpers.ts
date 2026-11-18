/**
 * @fileoverview Helpers for tokens shared by layout rules
 * @author kukjevov
 */

import type {TSESTree} from '@typescript-eslint/utils';
import {AST_NODE_TYPES} from '@typescript-eslint/utils';
import type {SourceCode} from '@typescript-eslint/utils/ts-eslint';

/**
 * Checks whether opener of literal cannot be moved to its own line, opener directly follows spread or prefix unary operator
 * (`...[`, `![`, `!{`), line break would be removed by rest-spread-spacing / space-unary-ops
 * @param sourceCode - Source code of linted file
 * @param prev - Token directly before opener
 * @returns True if opener must stay next to operator
 */
export function followsOperator(sourceCode: Readonly<SourceCode>, prev: TSESTree.Token): boolean
{
    if(prev.type != 'Punctuator')
    {
        return false;
    }

    const operatorNode = sourceCode.getNodeByRangeIndex(prev.range[0]);

    return operatorNode?.type == AST_NODE_TYPES.SpreadElement ||
           (operatorNode?.type == AST_NODE_TYPES.UnaryExpression && operatorNode.range[0] == prev.range[0]);
}
