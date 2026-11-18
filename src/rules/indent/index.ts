/*
 * Forked from @stylistic/eslint-plugin 6.0.1 (rules/indent), ported to TypeScript.
 *
 * MIT License
 *
 * Copyright OpenJS Foundation and other contributors, <www.openjsf.org>
 * Copyright (c) 2023-PRESENT ESLint Stylistic contributors
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

/**
 * @fileoverview Enforces team indentation model (owner-line openers, aligned arguments and conditions), fork of `@stylistic/indent` 6.0.1
 */

import {ASTUtils} from '@typescript-eslint/utils';
import type {TSESTree} from '@typescript-eslint/utils';
import {createRule} from '../../utils/index.js';
import {addBlocklessNodeIndent, addElementListIndent, addFunctionCallIndent, addParensIndent, alignChainDots, alignConditionOperands, alignOpenerWithOwner, checkArrayLikeNode, checkAssignmentOperator, checkBlockLikeNode, checkClassProperty, checkConditionalNode, checkHeritages, checkMemberExpression, checkObjectLikeNode, checkOperatorToken, checkSignatureParameters, checkSpreadElement, checkTypeAssertion, ignoreNode} from './handlers.js';
import type {IndentContext, IndentOptions} from './handlers.js';
import {OffsetStorage, TokenInfo, hasBlankLinesBetween, validateTokenIndent} from './offsetStorage.js';
import {KNOWN_NODES, getCommentsBetween, isEqToken, isSingleLine} from './utils.js';

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

/**
 * Options of indent rule
 */
export interface IndentRuleOptions
{
    /**
     * Number of spaces per indentation level
     */
    size?: number;

    /**
     * Selectors of nodes whose indentation is ignored
     */
    ignoredNodes?: string[];
}

/**
 * Hard coded settings of team indentation model, used by indentation engine
 */
const TEAM_INDENT_OPTIONS: Omit<IndentOptions, 'ignoredNodes'> =
{
    SwitchCase: 1,
    VariableDeclarator:
    {
        var: 'first',
        let: 'first',
        const: 'first',
        using: 'first',
    },
    outerIIFEBody: 1,
    MemberExpression: 1,
    FunctionDeclaration:
    {
        parameters: 'first',
        body: 1,
        returnType: 1,
    },
    FunctionExpression:
    {
        parameters: 'first',
        body: 1,
        returnType: 1,
    },
    StaticBlock: {body: 1},
    CallExpression: {arguments: 'first'},
    ArrayExpression: 1,
    ObjectExpression: 1,
    flatTernaryExpressions: false,
    offsetTernaryExpressions: false,
    ignoreComments: true,
    assignmentOperator: 1,
};

export default createRule<[IndentRuleOptions], 'wrongIndentation'>(
{
    name: 'indent',
    meta:
    {
        type: 'layout',
        docs:
        {
            description: 'Enforce team indentation model (owner-line braces, aligned arguments and conditions), fork of @stylistic/indent',
        },
        fixable: 'whitespace',
        schema:
        [
            {
                type: 'object',
                properties:
                {
                    size:
                    {
                        type: 'integer',
                        minimum: 1,
                    },
                    ignoredNodes:
                    {
                        type: 'array',
                        items:
                        {
                            type: 'string',
                            not:
                            {
                                type: 'string',
                                pattern: ':exit$',
                            },
                        },
                    },
                },
                additionalProperties: false,
            },
        ],
        messages:
        {
            wrongIndentation: 'Expected indentation of {{expected}} but found {{actual}}.',
        },
    },
    defaultOptions:
    [
        {
            size: 4,
            ignoredNodes: [],
        },
    ],
    create(context, [userOptions])
    {
        const indentSize = userOptions.size;
        const options: IndentOptions =
        {
            ...TEAM_INDENT_OPTIONS,
            ignoredNodes: userOptions.ignoredNodes,
        };
        const sourceCode = context.sourceCode;
        const tokenInfo = new TokenInfo(sourceCode);
        const offsets = new OffsetStorage(tokenInfo, indentSize, ' ', sourceCode.text.length);
        const parameterParens = new WeakSet<TSESTree.Token>();
        const ctx: IndentContext =
        {
            sourceCode,
            offsets,
            tokenInfo,
            parameterParens,
            indentSize,
            indentType: 'space',
            options,
            argumentAnchors: [],
            alignedConditionTokens: new Set(),
            chainDots: [],
        };

        /**
         * Creates error message data
         * @param expectedAmount - Expected amount of indentation characters
         * @param actualSpaces - Actual amount of spaces
         * @param actualTabs - Actual amount of tabs
         * @returns Data for message
         */
        function createErrorMessageData(expectedAmount: number, actualSpaces: number, actualTabs: number): {expected: string, actual: string | number}
        {
            const expectedStatement = `${expectedAmount} space${expectedAmount === 1 ? '' : 's'}`;
            const foundTabsWord = `tab${actualTabs === 1 ? '' : 's'}`;

            let foundStatement: string | number;

            if(actualSpaces > 0)
            {
                //Abbreviate the message, the expected indentation is also spaces
                foundStatement = actualSpaces;
            }
            else if(actualTabs > 0)
            {
                foundStatement = `${actualTabs} ${foundTabsWord}`;
            }
            else
            {
                foundStatement = '0';
            }

            return {
                expected: expectedStatement,
                actual: foundStatement as string,
            };
        }

        /**
         * Reports wrong indentation of token
         * @param token - Token with wrong indentation
         * @param neededIndent - Needed indentation
         */
        function report(token: TSESTree.Token, neededIndent: string): void
        {
            const actualIndent = Array.from(tokenInfo.getTokenIndent(token));
            const numSpaces = actualIndent.filter(char => char === ' ').length;
            const numTabs = actualIndent.filter(char => char === '\t').length;

            context.report(
            {
                node: token as any,
                messageId: 'wrongIndentation',
                data: createErrorMessageData(neededIndent.length, numSpaces, numTabs) as any,
                loc:
                {
                    start:
                    {
                        line: token.loc.start.line,
                        column: 0,
                    },
                    end:
                    {
                        line: token.loc.start.line,
                        column: token.loc.start.column,
                    },
                },
                fix(fixer)
                {
                    const range: [number, number] = [token.range[0] - token.loc.start.column, token.range[0]];
                    const newText = neededIndent;

                    return fixer.replaceTextRange(range, newText);
                },
            });
        }

        /**
         * Set of ignored node first tokens
         */
        const ignoredNodeFirstTokens = new Set<TSESTree.Token>();

        /**
         * Listeners registering offsets
         */
        const baseOffsetListeners: Record<string, (node: any) => void> =
        {
            ArrayExpression: node => checkArrayLikeNode(ctx, node),
            ArrayPattern: node => checkArrayLikeNode(ctx, node),
            ObjectExpression: node => checkObjectLikeNode(ctx, node, node.properties),
            ObjectPattern: node => checkObjectLikeNode(ctx, node, node.properties),
            ArrowFunctionExpression(node: TSESTree.ArrowFunctionExpression)
            {
                const maybeOpeningParen = sourceCode.getFirstToken(node, {skip: node.async ? 1 : 0});

                if(ASTUtils.isOpeningParenToken(maybeOpeningParen))
                {
                    const openingParen = maybeOpeningParen;
                    const closingParen = sourceCode.getTokenBefore(node.returnType ?? node.body, {filter: ASTUtils.isClosingParenToken});

                    parameterParens.add(openingParen);
                    parameterParens.add(closingParen);
                    addElementListIndent(ctx, node.params, openingParen, closingParen, options.FunctionExpression.parameters, true);
                }

                addBlocklessNodeIndent(ctx, node.body);
            },
            AssignmentExpression(node: TSESTree.AssignmentExpression)
            {
                const operator = sourceCode.getFirstTokenBetween(node.left, node.right, token => token.value === node.operator);

                checkAssignmentOperator(ctx, operator);
            },
            AssignmentPattern(node: TSESTree.AssignmentPattern)
            {
                const operator = sourceCode.getFirstTokenBetween(node.left, node.right, isEqToken);

                checkAssignmentOperator(ctx, operator);
            },
            BinaryExpression: node => checkOperatorToken(ctx, node.left, node.right, node.operator),
            LogicalExpression: node => checkOperatorToken(ctx, node.left, node.right, node.operator),
            BlockStatement: node => checkBlockLikeNode(ctx, node),
            ClassBody: node => checkBlockLikeNode(ctx, node),
            CallExpression: node => addFunctionCallIndent(ctx, node),
            ClassDeclaration(node: TSESTree.ClassDeclaration)
            {
                if(!node.superClass)
                {
                    return;
                }

                checkHeritages(ctx, node, [node.superClass]);
            },
            ClassExpression(node: TSESTree.ClassExpression)
            {
                if(!node.superClass)
                {
                    return;
                }

                checkHeritages(ctx, node, [node.superClass]);
            },
            ConditionalExpression: node => checkConditionalNode(ctx, node, node.test, node.consequent, node.alternate),
            'DoWhileStatement, WhileStatement, ForInStatement, ForOfStatement, WithStatement': function(node: TSESTree.DoWhileStatement | TSESTree.WhileStatement | TSESTree.ForInStatement | TSESTree.ForOfStatement | TSESTree.WithStatement)
            {
                addBlocklessNodeIndent(ctx, node.body);

                if(node.type === 'DoWhileStatement' || node.type === 'WhileStatement')
                {
                    alignConditionOperands(ctx, node.test);
                }
            },
            ExportNamedDeclaration(node: TSESTree.ExportNamedDeclaration)
            {
                if(node.declaration === null)
                {
                    const closingCurly = node.source
                        ? sourceCode.getTokenBefore(node.source, ASTUtils.isClosingBraceToken)
                        : sourceCode.getLastToken(node, ASTUtils.isClosingBraceToken);

                    //Indent the specifiers in `export {foo, bar, baz}`
                    addElementListIndent(ctx, node.specifiers, sourceCode.getFirstToken(node, {skip: 1}), closingCurly, 1);

                    if(node.source)
                    {
                        //Indent everything after and including the `from` token in `export {foo, bar, baz} from 'qux'`
                        const fromToken = sourceCode.getTokenAfter(closingCurly, token => token.type === 'Identifier' && token.value === 'from');
                        const lastToken = sourceCode.getLastToken(node, ASTUtils.isNotSemicolonToken);

                        offsets.setDesiredOffsets([fromToken.range[0], lastToken.range[1]], sourceCode.getFirstToken(node), 1);

                        //Indent the attributes in `export {foo} from 'qux' with {type: 'json'}`
                        const lastClosingCurly = sourceCode.getLastToken(node, ASTUtils.isClosingBraceToken);

                        if(lastClosingCurly && node.source.range[1] < lastClosingCurly.range[0])
                        {
                            const openingCurly = sourceCode.getTokenAfter(node.source, ASTUtils.isOpeningBraceToken);
                            const closingCurly = lastClosingCurly;

                            addElementListIndent(ctx, node.attributes, openingCurly, closingCurly, 1);
                        }
                    }
                }
            },
            ExportAllDeclaration(node: TSESTree.ExportAllDeclaration)
            {
                //Indent everything after and including the `from` token in `export * as foo from 'qux'`
                const fromToken = sourceCode.getTokenAfter(node.exported || sourceCode.getFirstToken(node), token => token.type === 'Identifier' && token.value === 'from');
                const lastToken = sourceCode.getLastToken(node, ASTUtils.isNotSemicolonToken);

                offsets.setDesiredOffsets([fromToken.range[0], lastToken.range[1]], sourceCode.getFirstToken(node), 1);

                //Indent the attributes in `export * from 'qux' with {type: 'json'}`
                const lastClosingCurly = sourceCode.getLastToken(node, ASTUtils.isClosingBraceToken);

                if(lastClosingCurly && node.source.range[1] < lastClosingCurly.range[0])
                {
                    const openingCurly = sourceCode.getTokenAfter(node.source, ASTUtils.isOpeningBraceToken);
                    const closingCurly = lastClosingCurly;

                    addElementListIndent(ctx, node.attributes, openingCurly, closingCurly, 1);
                }
            },
            ForStatement(node: TSESTree.ForStatement)
            {
                const forOpeningParen = sourceCode.getFirstToken(node, 1);

                if(node.init)
                {
                    offsets.setDesiredOffsets(node.init.range, forOpeningParen, 1);
                }

                if(node.test)
                {
                    offsets.setDesiredOffsets(node.test.range, forOpeningParen, 1);
                }

                if(node.update)
                {
                    offsets.setDesiredOffsets(node.update.range, forOpeningParen, 1);
                }

                addBlocklessNodeIndent(ctx, node.body);
            },
            'FunctionDeclaration, FunctionExpression': function(node: TSESTree.FunctionDeclaration | TSESTree.FunctionExpression)
            {
                const paramsClosingParen = sourceCode.getTokenBefore(node.returnType ?? node.body, {filter: ASTUtils.isClosingParenToken});
                const paramsOpeningParen = sourceCode.getTokenBefore(node.params.length ? node.params[0].decorators?.[0] ?? node.params[0] : paramsClosingParen, {filter: ASTUtils.isOpeningParenToken});

                parameterParens.add(paramsOpeningParen);
                parameterParens.add(paramsClosingParen);
                addElementListIndent(ctx, node.params, paramsOpeningParen, paramsClosingParen, options[node.type].parameters, true);

                if(node.returnType)
                {
                    offsets.setDesiredOffsets(node.returnType.range, paramsClosingParen, options[node.type].returnType);
                }
            },
            IfStatement(node: TSESTree.IfStatement)
            {
                alignConditionOperands(ctx, node.test);
                addBlocklessNodeIndent(ctx, node.consequent);

                if(node.alternate)
                {
                    addBlocklessNodeIndent(ctx, node.alternate);
                }
            },
            ':matches(DoWhileStatement, ForStatement, ForInStatement, ForOfStatement, IfStatement, WhileStatement, WithStatement):exit': function(node: any)
            {
                let nodesToCheck: TSESTree.Node[];

                if(node.type === 'IfStatement')
                {
                    nodesToCheck = [node.consequent];

                    if(node.alternate)
                    {
                        nodesToCheck.push(node.alternate);
                    }
                }
                else
                {
                    nodesToCheck = [node.body];
                }

                for(const nodeToCheck of nodesToCheck)
                {
                    const lastToken = sourceCode.getLastToken(nodeToCheck);

                    if(ASTUtils.isSemicolonToken(lastToken))
                    {
                        const tokenBeforeLast = sourceCode.getTokenBefore(lastToken);
                        const tokenAfterLast = sourceCode.getTokenAfter(lastToken);

                        //Semicolon in the body of statements may be on separate line, indent it as the statement itself
                        if(!ASTUtils.isTokenOnSameLine(tokenBeforeLast, lastToken) && tokenAfterLast && ASTUtils.isTokenOnSameLine(lastToken, tokenAfterLast))
                        {
                            offsets.setDesiredOffset(lastToken, sourceCode.getFirstToken(node), 0);
                        }
                    }
                }
            },
            ImportExpression(node: TSESTree.ImportExpression)
            {
                const openingParen = sourceCode.getFirstToken(node, 1);
                const closingParen = sourceCode.getLastToken(node);

                parameterParens.add(openingParen);
                parameterParens.add(closingParen);
                offsets.setDesiredOffset(openingParen, sourceCode.getTokenBefore(openingParen), 0);

                addElementListIndent(ctx, [node.source], openingParen, closingParen, options.CallExpression.arguments);
            },
            MemberExpression: node => checkMemberExpression(ctx, node, node.object, node.property, node.computed),
            MetaProperty: node => checkMemberExpression(ctx, node, node.meta, node.property),
            NewExpression(node: TSESTree.NewExpression)
            {
                //Only indent if there are arguments or parentheses, otherwise the node is `new Foo`
                if(node.arguments.length > 0 || ASTUtils.isClosingParenToken(sourceCode.getLastToken(node)) && ASTUtils.isOpeningParenToken(sourceCode.getLastToken(node, 1)))
                {
                    addFunctionCallIndent(ctx, node);
                }
            },
            Property(node: TSESTree.Property)
            {
                if(!node.shorthand && !node.method && node.kind === 'init')
                {
                    const colon = sourceCode.getFirstTokenBetween(node.key, node.value, ASTUtils.isColonToken);
                    const valueToken = sourceCode.getTokenAfter(colon);

                    offsets.setDesiredOffset(valueToken, colon, 1);
                }
            },
            PropertyDefinition: node => checkClassProperty(ctx, node),
            SpreadElement: node => checkSpreadElement(ctx, node),
            AccessorProperty: node => checkClassProperty(ctx, node),
            TSAbstractPropertyDefinition: node => checkClassProperty(ctx, node),
            TSAbstractAccessorProperty: node => checkClassProperty(ctx, node),
            StaticBlock(node: TSESTree.StaticBlock)
            {
                const openingCurly = sourceCode.getFirstToken(node, {skip: 1});
                const closingCurly = sourceCode.getLastToken(node);

                addElementListIndent(ctx, node.body, openingCurly, closingCurly, options.StaticBlock.body);
            },
            SwitchStatement(node: TSESTree.SwitchStatement)
            {
                const openingCurly = sourceCode.getTokenAfter(node.discriminant, ASTUtils.isOpeningBraceToken);
                const closingCurly = sourceCode.getLastToken(node);

                offsets.setDesiredOffsets([openingCurly.range[1], closingCurly.range[0]], openingCurly, options.SwitchCase);

                if(node.cases.length)
                {
                    getCommentsBetween(sourceCode, node.cases[node.cases.length - 1], closingCurly).forEach(token => offsets.ignoreToken(token));
                }
            },
            SwitchCase(node: TSESTree.SwitchCase)
            {
                if(!(node.consequent.length === 1 && node.consequent[0].type === 'BlockStatement'))
                {
                    const caseKeyword = sourceCode.getFirstToken(node);
                    const tokenAfterCurrentCase = sourceCode.getTokenAfter(node);

                    offsets.setDesiredOffsets([caseKeyword.range[1], tokenAfterCurrentCase.range[0]], caseKeyword, 1);
                }
            },
            TemplateLiteral(node: TSESTree.TemplateLiteral)
            {
                //Contents of template literal are not checked (A.8), neither is template literal that starts its own line (only first token of line is ignored)
                sourceCode.getTokens(node, {includeComments: true}).forEach(token => offsets.ignoreToken(token));
            },
            VariableDeclaration(node: TSESTree.VariableDeclaration)
            {
                if(node.declarations.length === 0)
                {
                    return;
                }

                const kind = (node.kind as string) === 'await using' ? 'using' : node.kind;
                const variableIndent = options.VariableDeclarator[kind] ?? 1;
                const alignFirstVariable = variableIndent === 'first';

                let numericVariableIndent = typeof variableIndent === 'number' ? variableIndent : 1;

                const firstToken = sourceCode.getFirstToken(node);
                const lastToken = sourceCode.getLastToken(node);

                if(node.declarations.at(-1).loc.start.line > node.loc.start.line)
                {
                    //For node.declarations.at(-1).loc.start.line > node.loc.start.line, the indentation of first declarator is always forced to the first one
                    if(alignFirstVariable)
                    {
                        addElementListIndent(ctx, node.declarations, firstToken, lastToken, variableIndent);

                        const firstTokenOfFirstElement = sourceCode.getFirstToken(node.declarations[0]);
                        const firstTokenOfFirstTokenLine = tokenInfo.getFirstTokenOfLine(firstToken);
                        const firstVariableIndentWidth = tokenInfo.getTokenIndent(firstTokenOfFirstElement).length - tokenInfo.getTokenIndent(firstTokenOfFirstTokenLine).length;

                        numericVariableIndent = indentSize === 0 ? 0 : firstVariableIndentWidth / indentSize;
                    }

                    offsets.setDesiredOffsets(node.range, firstToken, numericVariableIndent, true);
                }
                else
                {
                    offsets.setDesiredOffsets(node.range, firstToken, numericVariableIndent);
                }

                if(ASTUtils.isSemicolonToken(lastToken))
                {
                    offsets.ignoreToken(lastToken);
                }
            },
            VariableDeclarator(node: TSESTree.VariableDeclarator)
            {
                if(node.init)
                {
                    const operator = sourceCode.getTokenBefore(node.init, ASTUtils.isNotOpeningParenToken);

                    checkAssignmentOperator(ctx, operator);
                }

                const lastToken = sourceCode.getLastToken(node);

                if(ASTUtils.isSemicolonToken(lastToken))
                {
                    offsets.ignoreToken(lastToken);
                }
            },
            TSTypeAssertion: node => checkTypeAssertion(ctx, node),
            TSTypeAnnotation(node: TSESTree.TSTypeAnnotation)
            {
                if(node.parent.type === 'FunctionDeclaration' || node.parent.type === 'FunctionExpression')
                {
                    return;
                }

                const colon = sourceCode.getFirstToken(node);
                const right = sourceCode.getTokenAfter(colon);

                offsets.setDesiredOffset(right, colon, 1);
            },
            TSTypeAliasDeclaration(node: TSESTree.TSTypeAliasDeclaration)
            {
                const operator = sourceCode.getTokenBefore(node.typeAnnotation, ASTUtils.isNotOpeningParenToken);

                checkAssignmentOperator(ctx, operator);

                const lastToken = sourceCode.getLastToken(node);

                if(ASTUtils.isSemicolonToken(lastToken))
                {
                    offsets.ignoreToken(lastToken);
                }
            },
            TSTupleType: node => checkArrayLikeNode(ctx, node),
            TSEnumBody: node => checkBlockLikeNode(ctx, node),
            TSEnumMember(node: TSESTree.TSEnumMember)
            {
                if(!node.initializer)
                {
                    return;
                }

                const operator = sourceCode.getTokenBefore(node.initializer, isEqToken);

                checkAssignmentOperator(ctx, operator);
            },
            TSTypeLiteral: node => checkObjectLikeNode(ctx, node, node.members),
            TSMappedType(node: TSESTree.TSMappedType)
            {
                const startToken = sourceCode.getFirstToken(node, ASTUtils.isOpeningBraceToken);
                const endToken = sourceCode.getLastToken(node, ASTUtils.isClosingBraceToken);

                offsets.setDesiredOffsets([startToken.range[1], endToken.range[0]], startToken, 1);
                offsets.setDesiredOffset(endToken, startToken, 0);
                alignOpenerWithOwner(ctx, startToken, node);
            },
            'TSEmptyBodyFunctionExpression, TSDeclareFunction, TSMethodSignature, TSCallSignatureDeclaration, TSConstructSignatureDeclaration, TSFunctionType, TSConstructorType': (node: TSESTree.Node) => checkSignatureParameters(ctx, node),
            TSAsExpression: node => checkOperatorToken(ctx, node.expression, node.typeAnnotation, 'as'),
            TSSatisfiesExpression: node => checkOperatorToken(ctx, node.expression, node.typeAnnotation, 'satisfies'),
            TSConditionalType: node => checkConditionalNode(ctx, node, node.extendsType, node.trueType, node.falseType),
            TSImportEqualsDeclaration(node: TSESTree.TSImportEqualsDeclaration)
            {
                if(node.moduleReference)
                {
                    const operator = sourceCode.getTokenBefore(node.moduleReference, isEqToken);

                    checkAssignmentOperator(ctx, operator);
                }

                const lastToken = sourceCode.getLastToken(node);

                if(ASTUtils.isSemicolonToken(lastToken))
                {
                    offsets.ignoreToken(lastToken);
                }
            },
            TSIndexedAccessType: node => checkMemberExpression(ctx, node, node.objectType, node.indexType, true),
            TSInterfaceBody: node => checkBlockLikeNode(ctx, node),
            TSInterfaceDeclaration(node: TSESTree.TSInterfaceDeclaration)
            {
                if(node.extends.length === 0)
                {
                    return;
                }

                checkHeritages(ctx, node, node.extends);
            },
            TSQualifiedName: node => checkMemberExpression(ctx, node, node.left, node.right),
            TSTypeParameter(node: TSESTree.TSTypeParameter)
            {
                if(!node.default)
                {
                    return;
                }

                const operator = sourceCode.getTokenBefore(node.default, isEqToken);

                checkAssignmentOperator(ctx, operator);
            },
            TSTypeParameterDeclaration(node: TSESTree.TSTypeParameterDeclaration)
            {
                if(!node.params.length)
                {
                    return;
                }

                const firstToken = sourceCode.getFirstToken(node);
                const closingToken = sourceCode.getLastToken(node);

                addElementListIndent(ctx, node.params, firstToken, closingToken, 1);
            },
            TSTypeParameterInstantiation(node: TSESTree.TSTypeParameterInstantiation)
            {
                if(!node.params.length)
                {
                    return;
                }

                const firstToken = sourceCode.getFirstToken(node);
                const closingToken = sourceCode.getLastToken(node);

                addElementListIndent(ctx, node.params, firstToken, closingToken, 1);
            },
            TSModuleBlock: node => checkBlockLikeNode(ctx, node),
            '*': function(node: TSESTree.Node)
            {
                const firstToken = sourceCode.getFirstToken(node);

                //Ensure that the children of every node are indented at least as much as the first token
                if(firstToken && !ignoredNodeFirstTokens.has(firstToken) && !isSingleLine(node))
                {
                    offsets.setDesiredOffsets(node.range, firstToken, 0);
                }
            },
        };

        //Offset listeners are called in the order of appearance of nodes, so that offsets of outer nodes are set before offsets of inner nodes.
        //Their calls are queued and executed on `Program:exit`, once all ignored nodes are known.
        const listenerCallQueue: {listener: (node: any) => void, node: TSESTree.Node}[] = [];
        const offsetListeners: Record<string, (node: any) => void> = {};

        for(const [selector, listener] of Object.entries(baseOffsetListeners))
        {
            offsetListeners[selector] = (node: TSESTree.Node) => listenerCallQueue.push({listener, node});
        }

        /**
         * Nodes whose indentation is ignored
         */
        const ignoredNodes = new Set<TSESTree.Node>();

        /**
         * Adds node to ignored nodes
         * @param node - Node to be ignored
         */
        function addToIgnoredNodes(node: TSESTree.Node): void
        {
            ignoredNodes.add(node);
            ignoredNodeFirstTokens.add(sourceCode.getFirstToken(node));
        }

        //Import declarations are always ignored (A.8)
        const ignoredNodeListeners = ['ImportDeclaration', ...options.ignoredNodes].reduce((listeners, ignoredSelector) => Object.assign(listeners, {[ignoredSelector]: addToIgnoredNodes}), {} as Record<string, (node: TSESTree.Node) => void>);

        //Using `Program:exit` to check the indentation of all tokens, once all offsets are known
        return {
            ...offsetListeners,
            ...ignoredNodeListeners,

            //Unknown nodes are ignored, their indentation is not checked
            '*:exit': function(node: TSESTree.Node)
            {
                if(!KNOWN_NODES.has(node.type))
                {
                    addToIgnoredNodes(node);
                }
            },
            'Program:exit': function()
            {
                if(options.ignoreComments)
                {
                    //Ignore all comments
                    sourceCode.getAllComments().forEach(comment => offsets.ignoreToken(comment));
                }

                //Invoke the queued offset listeners for the nodes that aren't ignored
                for(let index = 0; index < listenerCallQueue.length; index++)
                {
                    const nodeInfo = listenerCallQueue[index];

                    if(!ignoredNodes.has(nodeInfo.node))
                    {
                        nodeInfo.listener?.(nodeInfo.node);
                    }
                }

                //Update the offsets for ignored nodes to prevent their child tokens from being reported
                ignoredNodes.forEach(node => ignoreNode(ctx, node));

                addParensIndent(ctx, sourceCode.ast.tokens);

                //Member chain lines may be sub-indented (A.4), their desired indents must be known before any other desired indent is computed
                alignChainDots(ctx);

                //Create a Map from (tokenOrComment) => (precedingToken).
                //This is necessary because sourceCode.getTokenBefore does not handle a comment as an argument correctly.
                const precedingTokens = new WeakMap<TSESTree.Token, TSESTree.Token>();

                for(let index = 0; index < sourceCode.ast.comments.length; index++)
                {
                    const comment = sourceCode.ast.comments[index];
                    const tokenOrCommentBefore = sourceCode.getTokenBefore(comment, {includeComments: true});
                    const hasToken = precedingTokens.has(tokenOrCommentBefore) ? precedingTokens.get(tokenOrCommentBefore) : tokenOrCommentBefore;

                    precedingTokens.set(comment, hasToken);
                }

                for(let index = 1; index < sourceCode.lines.length + 1; index++)
                {
                    if(!tokenInfo.firstTokensByLineNumber.has(index))
                    {
                        //Don't check indentation on blank lines
                        continue;
                    }

                    const firstTokenOfLine = tokenInfo.firstTokensByLineNumber.get(index);

                    if(firstTokenOfLine.loc.start.line !== index)
                    {
                        //Don't check the indentation of multi-line tokens (e.g. template literals or block comments) twice.
                        continue;
                    }

                    if(ASTUtils.isCommentToken(firstTokenOfLine))
                    {
                        const tokenBefore = precedingTokens.get(firstTokenOfLine);
                        const tokenAfter = tokenBefore ? sourceCode.getTokenAfter(tokenBefore) : sourceCode.ast.tokens[0];
                        const mayAlignWithBefore = tokenBefore && !hasBlankLinesBetween(tokenInfo, tokenBefore, firstTokenOfLine);
                        const mayAlignWithAfter = tokenAfter && !hasBlankLinesBetween(tokenInfo, firstTokenOfLine, tokenAfter);

                        //If a comment precedes a line that begins with a semicolon token, align to that token, i.e.
                        //
                        //let foo
                        //// comment
                        //;(async () => {})()
                        if(tokenAfter && ASTUtils.isSemicolonToken(tokenAfter) && !ASTUtils.isTokenOnSameLine(firstTokenOfLine, tokenAfter))
                        {
                            offsets.setDesiredOffset(firstTokenOfLine, tokenAfter, 0);
                        }

                        //If a comment matches the expected indentation of the token immediately before or after, don't report it.
                        if(mayAlignWithBefore && validateTokenIndent(tokenInfo, firstTokenOfLine, offsets.getDesiredIndent(tokenBefore)) ||
                           mayAlignWithAfter && validateTokenIndent(tokenInfo, firstTokenOfLine, offsets.getDesiredIndent(tokenAfter)))
                        {
                            continue;
                        }
                    }

                    //If the token matches the expected indentation, don't report it.
                    if(validateTokenIndent(tokenInfo, firstTokenOfLine, offsets.getDesiredIndent(firstTokenOfLine)))
                    {
                        continue;
                    }

                    //Otherwise, report the token/comment.
                    report(firstTokenOfLine, offsets.getDesiredIndent(firstTokenOfLine));
                }
            },
        };
    },
});
