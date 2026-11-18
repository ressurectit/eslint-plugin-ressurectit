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
 * @fileoverview Helper utilities of indent rule
 */

import {AST_NODE_TYPES, ASTUtils} from '@typescript-eslint/utils';
import type {TSESLint, TSESTree} from '@typescript-eslint/utils';

/**
 * Node types known to indent rule, all other nodes are ignored
 */
export const KNOWN_NODES: Set<string> = new Set(
[
        'AssignmentExpression',
        'AssignmentPattern',
        'ArrayExpression',
        'ArrayPattern',
        'ArrowFunctionExpression',
        'AwaitExpression',
        'BlockStatement',
        'BinaryExpression',
        'BreakStatement',
        'CallExpression',
        'CatchClause',
        'ChainExpression',
        'ClassBody',
        'ClassDeclaration',
        'ClassExpression',
        'ConditionalExpression',
        'ContinueStatement',
        'DoWhileStatement',
        'DebuggerStatement',
        'EmptyStatement',
        'ExpressionStatement',
        'ForStatement',
        'ForInStatement',
        'ForOfStatement',
        'FunctionDeclaration',
        'FunctionExpression',
        'Identifier',
        'IfStatement',
        'Literal',
        'LabeledStatement',
        'LogicalExpression',
        'MemberExpression',
        'MetaProperty',
        'MethodDefinition',
        'NewExpression',
        'ObjectExpression',
        'ObjectPattern',
        'PrivateIdentifier',
        'Program',
        'Property',
        'PropertyDefinition',
        AST_NODE_TYPES.AccessorProperty,
        'RestElement',
        'ReturnStatement',
        'SequenceExpression',
        'SpreadElement',
        'StaticBlock',
        'Super',
        'SwitchCase',
        'SwitchStatement',
        'TaggedTemplateExpression',
        'TemplateElement',
        'TemplateLiteral',
        'ThisExpression',
        'ThrowStatement',
        'TryStatement',
        'UnaryExpression',
        'UpdateExpression',
        'VariableDeclaration',
        'VariableDeclarator',
        'WhileStatement',
        'WithStatement',
        'YieldExpression',
        'ExportDefaultDeclaration',
        'ExportNamedDeclaration',
        'ExportAllDeclaration',
        'ExportSpecifier',
        'ImportDeclaration',
        'ImportSpecifier',
        'ImportDefaultSpecifier',
        'ImportNamespaceSpecifier',
        'ImportExpression',
        'ImportAttribute',
        AST_NODE_TYPES.TSAbstractKeyword,
        AST_NODE_TYPES.TSAnyKeyword,
        AST_NODE_TYPES.TSBooleanKeyword,
        AST_NODE_TYPES.TSNeverKeyword,
        AST_NODE_TYPES.TSNumberKeyword,
        AST_NODE_TYPES.TSStringKeyword,
        AST_NODE_TYPES.TSSymbolKeyword,
        AST_NODE_TYPES.TSUndefinedKeyword,
        AST_NODE_TYPES.TSUnknownKeyword,
        AST_NODE_TYPES.TSVoidKeyword,
        AST_NODE_TYPES.TSNullKeyword,
        AST_NODE_TYPES.TSAbstractPropertyDefinition,
        AST_NODE_TYPES.TSAbstractAccessorProperty,
        AST_NODE_TYPES.TSAbstractMethodDefinition,
        AST_NODE_TYPES.TSArrayType,
        AST_NODE_TYPES.TSAsExpression,
        AST_NODE_TYPES.TSSatisfiesExpression,
        AST_NODE_TYPES.TSCallSignatureDeclaration,
        AST_NODE_TYPES.TSConditionalType,
        AST_NODE_TYPES.TSConstructorType,
        AST_NODE_TYPES.TSConstructSignatureDeclaration,
        AST_NODE_TYPES.TSDeclareFunction,
        AST_NODE_TYPES.TSEmptyBodyFunctionExpression,
        AST_NODE_TYPES.TSEnumDeclaration,
        AST_NODE_TYPES.TSEnumBody,
        AST_NODE_TYPES.TSEnumMember,
        AST_NODE_TYPES.TSExportAssignment,
        AST_NODE_TYPES.TSExternalModuleReference,
        AST_NODE_TYPES.TSFunctionType,
        AST_NODE_TYPES.TSImportType,
        AST_NODE_TYPES.TSIndexedAccessType,
        AST_NODE_TYPES.TSIndexSignature,
        AST_NODE_TYPES.TSInferType,
        AST_NODE_TYPES.TSInterfaceBody,
        AST_NODE_TYPES.TSInterfaceDeclaration,
        AST_NODE_TYPES.TSInterfaceHeritage,
        AST_NODE_TYPES.TSImportEqualsDeclaration,
        AST_NODE_TYPES.TSLiteralType,
        AST_NODE_TYPES.TSMappedType,
        AST_NODE_TYPES.TSMethodSignature,
        AST_NODE_TYPES.TSModuleBlock,
        AST_NODE_TYPES.TSModuleDeclaration,
        AST_NODE_TYPES.TSNonNullExpression,
        AST_NODE_TYPES.TSParameterProperty,
        AST_NODE_TYPES.TSPropertySignature,
        AST_NODE_TYPES.TSQualifiedName,
        AST_NODE_TYPES.TSRestType,
        AST_NODE_TYPES.TSThisType,
        AST_NODE_TYPES.TSTupleType,
        AST_NODE_TYPES.TSTypeAliasDeclaration,
        AST_NODE_TYPES.TSTypeAnnotation,
        AST_NODE_TYPES.TSTypeAssertion,
        AST_NODE_TYPES.TSTypeLiteral,
        AST_NODE_TYPES.TSTypeOperator,
        AST_NODE_TYPES.TSTypeParameter,
        AST_NODE_TYPES.TSTypeParameterDeclaration,
        AST_NODE_TYPES.TSTypeParameterInstantiation,
        AST_NODE_TYPES.TSTypeReference,
        AST_NODE_TYPES.Decorator
]);

/**
 * Node types that contain list of statements
 */
export const STATEMENT_LIST_PARENTS: Set<string> = new Set(
[
    'Program',
    'BlockStatement',
    'StaticBlock',
    'SwitchCase',
]);

/**
 * Creates global matcher of linebreaks
 * @returns Global regular expression matching linebreaks
 */
export function createGlobalLinebreakMatcher(): RegExp
{
    return new RegExp(ASTUtils.LINEBREAK_MATCHER.source, 'gu');
}

/**
 * Skips chain expression wrapper
 * @param node - Node to be unwrapped
 * @returns Inner expression of chain expression, or same node
 */
export function skipChainExpression(node: TSESTree.Node): TSESTree.Node
{
    return node && node.type === 'ChainExpression' ? node.expression : node;
}

/**
 * Checks whether token is `=` punctuator
 * @param token - Token to be checked
 * @returns True if token is `=`
 */
export function isEqToken(token: TSESTree.Token): boolean
{
    return token.value === '=' && token.type === 'Punctuator';
}

/**
 * Checks whether token is `?` punctuator
 * @param token - Token to be checked
 * @returns True if token is `?`
 */
export function isQuestionToken(token: TSESTree.Token): boolean
{
    return token.value === '?' && token.type === 'Punctuator';
}

/**
 * Checks whether node or token is located on single line
 * @param node - Node or token to be checked
 * @returns True if starts and ends on same line
 */
export function isSingleLine(node: TSESTree.Node | TSESTree.Token): boolean
{
    return node.loc.start.line === node.loc.end.line;
}

/**
 * Gets comments between two nodes or tokens
 * @param sourceCode - Source code object
 * @param left - Left node or token
 * @param right - Right node or token
 * @returns Comments located between left and right
 */
export function getCommentsBetween(sourceCode: TSESLint.SourceCode, left: TSESTree.Node | TSESTree.Token, right: TSESTree.Node | TSESTree.Token): TSESTree.Comment[]
{
    return sourceCode.getTokensBetween(left, right,
    {
        includeComments: true,
        filter: ASTUtils.isCommentToken,
    }) as TSESTree.Comment[];
}
