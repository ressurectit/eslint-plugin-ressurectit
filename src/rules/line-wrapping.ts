/**
 * @fileoverview Wraps arguments of calls and explodes one-line literals on over-long or overcrowded lines
 * @author kukjevov
 */

import {AST_NODE_TYPES, AST_TOKEN_TYPES} from '@typescript-eslint/utils';
import type {TSESTree} from '@typescript-eslint/utils';
import type {RuleFix, RuleFixer, SourceCode} from '@typescript-eslint/utils/ts-eslint';

import {createBreakAfterCommaFixes, createRule, followsOperator, getLineIndent, getLiteralItems} from '../utils/index.js';

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

/**
 * Call or new expression with arguments
 */
type CallNode = TSESTree.CallExpression|TSESTree.NewExpression;

/**
 * Object or array value literal
 */
type LiteralNode = TSESTree.ObjectExpression|TSESTree.ArrayExpression;

/**
 * Options of line-wrapping rule
 */
export interface LineWrappingOptions
{
    /**
     * Maximal length of physical line, longer lines trigger wrapping
     */
    maxLength?: number;

    /**
     * Maximal number of arguments/properties/elements on one line, more items trigger wrapping
     */
    maxItems?: number;
}

/**
 * Candidates found on one physical line
 */
interface LineCandidates
{
    /**
     * Multi-argument calls whose '(' is on the line
     */
    calls: CallNode[];

    /**
     * One-line literals starting on the line
     */
    literals: LiteralNode[];
}

/**
 * Number of spaces used for one level of indentation
 */
const INDENT_SIZE = 4;

/**
 * Keywords of restricted productions, line break after them triggers ASI
 */
const RESTRICTED_KEYWORDS: ReadonlySet<string> = new Set(['return', 'yield', 'throw']);

/**
 * Tests whether node is nested inside a template literal, an import declaration or an export declaration without declaration (export list, re-export)
 * @param node - Node to be tested
 * @returns True if node is in ignored context
 */
function isInIgnoredContext(node: TSESTree.Node): boolean
{
    for(let parent = node.parent; parent; parent = parent.parent)
    {
        switch(parent.type)
        {
            case AST_NODE_TYPES.TemplateLiteral:
            case AST_NODE_TYPES.ImportDeclaration:
            case AST_NODE_TYPES.ExportAllDeclaration:
            {
                return true;
            }
            case AST_NODE_TYPES.ExportNamedDeclaration:
            {
                return !parent.declaration;
            }
            default:
            {
                break;
            }
        }
    }

    return false;
}

/**
 * Tests whether node range contains other node range
 * @param outer - Possibly enclosing node
 * @param inner - Possibly enclosed node
 * @returns True if outer contains inner and they are different nodes
 */
function contains(outer: TSESTree.Node, inner: TSESTree.Node): boolean
{
    return outer !== inner && outer.range[0] <= inner.range[0] && outer.range[1] >= inner.range[1];
}

/**
 * Gets leftmost of outermost nodes, nodes nested in other node of the same list are skipped
 * @param nodes - Nodes to be searched
 * @returns Leftmost outermost node or null if list is empty
 */
function getLeftmostOutermost<TNode extends TSESTree.Node>(nodes: TNode[]): TNode|null
{
    const outermost = nodes.filter(itm => !nodes.some(other => contains(other, itm)));

    if(!outermost.length)
    {
        return null;
    }

    return outermost.reduce((first, second) => second.range[0] < first.range[0] ? second : first);
}

/**
 * Gets opening parenthesis of call arguments
 * @param sourceCode - Source code of linted file
 * @param node - Call or new expression
 * @returns Opening parenthesis token
 */
function getOpeningParen(sourceCode: Readonly<SourceCode>, node: CallNode): TSESTree.Token
{
    return sourceCode.getTokenAfter(node.typeArguments ?? node.callee, {filter: token => token.value == '(' && token.type == 'Punctuator'})!;
}

/**
 * Creates fix which puts 2nd and following arguments on new lines aligned with the first one
 * @param sourceCode - Source code of linted file
 * @param node - Call or new expression to be wrapped
 * @returns Fix function or null if fix is not safe
 */
function createWrapArgumentsFix(sourceCode: Readonly<SourceCode>, node: CallNode): ((fixer: RuleFixer) => RuleFix[])|null
{
    const openingParen = getOpeningParen(sourceCode, node);
    const closingParen = sourceCode.getLastToken(node)!;

    if(sourceCode.commentsExistBetween(openingParen, closingParen))
    {
        return null;
    }

    const column = sourceCode.getTokenAfter(openingParen)!.loc.start.column;
    const separator = '\n' + ' '.repeat(column);

    return fixer =>
    {
        return createBreakAfterCommaFixes(fixer, sourceCode, node.arguments, separator);
    };
}

/**
 * Tests whether literal keeps its opener on the return line (B.2), `return {`, `return <T>{`, `return [`
 * @param node - Literal to be tested
 * @returns True if literal is return argument, directly or through type assertion
 */
function isReturnLiteral(node: LiteralNode): boolean
{
    const parent = node.parent;

    if(parent.type == AST_NODE_TYPES.ReturnStatement)
    {
        return true;
    }

    return parent.type == AST_NODE_TYPES.TSTypeAssertion && parent.parent.type == AST_NODE_TYPES.ReturnStatement;
}

/**
 * Tests whether token is keyword of restricted production (`return`, `yield`, `throw`), no line break is allowed after it
 * @param token - Token to be tested
 * @returns True if token is restricted production keyword
 */
function isRestrictedKeyword(token: TSESTree.Token): boolean
{
    return (token.type == AST_TOKEN_TYPES.Keyword || token.type == AST_TOKEN_TYPES.Identifier) &&
        RESTRICTED_KEYWORDS.has(token.value);
}

/**
 * Creates fix which puts each property/element of literal on its own line
 * @param sourceCode - Source code of linted file
 * @param node - Literal to be exploded
 * @returns Fix function or null if fix is not safe
 */
function createExplodeLiteralFix(sourceCode: Readonly<SourceCode>, node: LiteralNode): ((fixer: RuleFixer) => RuleFix[])|null
{
    const items = getLiteralItems(node);

    //holes in array, cannot be exploded precisely
    if(!items)
    {
        return null;
    }

    const opener = sourceCode.getFirstToken(node)!;
    const closer = sourceCode.getLastToken(node)!;
    const line = opener.loc.start.line;
    const previous = isReturnLiteral(node) ? null : sourceCode.getTokenBefore(opener);
    //never break line after restricted production keyword, ASI would change behaviour
    const moveOpener = !!previous && previous.loc.end.line == line && !isRestrictedKeyword(previous);

    if(sourceCode.commentsExistBetween(moveOpener ? previous! : opener, closer))
    {
        return null;
    }

    const indent = getLineIndent(sourceCode, line);
    const itemSeparator = '\n' + indent + ' '.repeat(INDENT_SIZE);

    return fixer =>
    {
        const result: RuleFix[] = [];

        if(moveOpener)
        {
            result.push(fixer.replaceTextRange([previous!.range[1], opener.range[0]], '\n' + indent));
        }

        result.push(fixer.replaceTextRange([opener.range[1], sourceCode.getTokenAfter(opener)!.range[0]], itemSeparator));

        result.push(...createBreakAfterCommaFixes(fixer, sourceCode, items, itemSeparator));

        const beforeCloser = sourceCode.getTokenBefore(closer)!;

        if(beforeCloser.value == ',')
        {
            result.push(fixer.replaceTextRange([beforeCloser.range[1], closer.range[0]], '\n' + indent));
        }
        else
        {
            result.push(fixer.replaceTextRange([beforeCloser.range[1], closer.range[0]], ',\n' + indent));
        }

        return result;
    };
}

export default createRule<[LineWrappingOptions], 'wrapArguments'|'explodeLiteral'>(
{
    name: 'line-wrapping',
    meta:
    {
        docs:
        {
            description: 'Wraps arguments of calls and explodes one-line literals on over-long or overcrowded lines',
            recommended: 'stylistic',
            requiresTypeChecking: false,
            extendsBaseRule: false,
        },
        messages:
        {
            wrapArguments: 'Wrap arguments of this call: put 2nd and following arguments on new lines aligned with the first.',
            explodeLiteral: 'Put each {{kind}} of this literal on its own line.',
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
                    maxItems:
                    {
                        type: 'integer',
                        minimum: 0,
                    },
                },
                additionalProperties: false,
            },
        ],
        type: 'layout',
        fixable: 'code',
    },
    defaultOptions: [{maxLength: 120, maxItems: 5}],
    create(context, [options])
    {
        const sourceCode = context.sourceCode;
        const maxLength = options.maxLength ?? 120;
        const maxItems = options.maxItems ?? 5;
        const lines = new Map<number, LineCandidates>();

        /**
         * Gets candidates of line, creates them if missing
         * @param line - 1-based line number
         * @returns Candidates of line
         */
        function getLine(line: number): LineCandidates
        {
            let candidates = lines.get(line);

            if(!candidates)
            {
                candidates = {calls: [], literals: []};
                lines.set(line, candidates);
            }

            return candidates;
        }

        /**
         * Collects call candidate, call with 2 or more arguments all starting on the line of '('
         * @param node - Call or new expression
         */
        function collectCall(node: CallNode): void
        {
            if(node.arguments.length < 2 || isInIgnoredContext(node))
            {
                return;
            }

            const line = getOpeningParen(sourceCode, node).loc.start.line;

            if(node.arguments.every(arg => arg.loc.start.line == line))
            {
                getLine(line).calls.push(node);
            }
        }

        /**
         * Collects literal candidate, non empty literal starting and ending on the same line, literal whose opener directly follows spread or prefix unary operator is skipped
         * @param node - Object or array literal
         */
        function collectLiteral(node: LiteralNode): void
        {
            const items = node.type == AST_NODE_TYPES.ObjectExpression ? node.properties : node.elements;

            if(!items.length || node.loc.start.line != node.loc.end.line || isInIgnoredContext(node))
            {
                return;
            }

            const previous = sourceCode.getTokenBefore(node);

            //opener cannot be moved away from operator, explode would be partial
            if(previous && followsOperator(sourceCode, previous))
            {
                return;
            }

            getLine(node.loc.start.line).literals.push(node);
        }

        return {
            CallExpression: collectCall,
            NewExpression: collectCall,
            ObjectExpression: collectLiteral,
            ArrayExpression: collectLiteral,
            'Program:exit'()
            {
                for(const [line, candidates] of lines)
                {
                    const long = sourceCode.lines[line - 1].length > maxLength;
                    const call = getLeftmostOutermost(candidates.calls.filter(itm => long || itm.arguments.length > maxItems));

                    if(call)
                    {
                        context.report(
                        {
                            messageId: 'wrapArguments',
                            node: call,
                            fix: createWrapArgumentsFix(sourceCode, call),
                        });

                        continue;
                    }

                    const literal = getLeftmostOutermost(candidates.literals.filter(itm => long || (itm.type == AST_NODE_TYPES.ObjectExpression ? itm.properties : itm.elements).length > maxItems));

                    if(literal)
                    {
                        context.report(
                        {
                            messageId: 'explodeLiteral',
                            node: literal,
                            data:
                            {
                                kind: literal.type == AST_NODE_TYPES.ObjectExpression ? 'property' : 'element',
                            },
                            fix: createExplodeLiteralFix(sourceCode, literal),
                        });
                    }
                }
            },
        };
    }
});
