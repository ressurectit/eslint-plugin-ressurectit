/**
 * @fileoverview Wrapper of `@stylistic/lines-between-class-members` that allows getter glued to its setter with the same key
 * @author kukjevov
 */

import stylistic from '@stylistic/eslint-plugin';
import {AST_NODE_TYPES} from '@typescript-eslint/utils';
import type {TSESTree} from '@typescript-eslint/utils';
import type {RuleContext, SourceCode} from '@typescript-eslint/utils/ts-eslint';

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

/**
 * Original rule that is wrapped
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const baseRule = stylistic.rules['lines-between-class-members'] as any;

/**
 * Tests whether member is accessor method of specified kind
 * @param member - Member to be tested
 * @param kind - Kind of accessor
 * @returns True if member is method of specified kind
 */
function isAccessor(member: TSESTree.Node|undefined, kind: 'get'|'set'): member is TSESTree.MethodDefinition
{
    return member?.type == AST_NODE_TYPES.MethodDefinition && member.kind == kind;
}

/**
 * Tests whether previous member is getter and next member is setter with the same key
 * @param sourceCode - Source code of linted file
 * @param previous - Previous class member
 * @param next - Next class member
 * @returns True if members form getter/setter pair
 */
function isAccessorPair(sourceCode: Readonly<SourceCode>, previous: TSESTree.Node|undefined, next: TSESTree.Node): boolean
{
    return isAccessor(previous, 'get') &&
           isAccessor(next, 'set') &&
           previous.static == next.static &&
           previous.computed == next.computed &&
           sourceCode.getText(previous.key) == sourceCode.getText(next.key);
}

export default
{
    ...baseRule,
    /**
     * Creates rule listeners, reports of getter followed by setter with same key are dropped
     * @param context - Context of rule
     * @returns Rule listeners
     */
    create(context: RuleContext<string, unknown[]>)
    {
        const sourceCode = context.sourceCode;
        const wrapped = Object.create(context);

        const report = (descriptor: {node?: TSESTree.Node}) =>
        {
            const next = descriptor.node;
            const body = (next?.parent as TSESTree.ClassBody|undefined)?.body;
            const previous = next && body ? body[body.indexOf(next as TSESTree.ClassElement) - 1] : undefined;

            if(next && isAccessorPair(sourceCode, previous, next))
            {
                return;
            }

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            context.report(descriptor as any);
        };

        Object.defineProperty(wrapped, 'report', {value: report});

        return baseRule.create(wrapped);
    },
};
