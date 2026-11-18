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
 * @fileoverview Helper functions registering offsets for indent rule
 */

import {AST_NODE_TYPES, ASTUtils} from '@typescript-eslint/utils';
import type {TSESLint, TSESTree} from '@typescript-eslint/utils';

import type {OffsetStorage, TokenInfo} from './offsetStorage.js';
import {createGlobalLinebreakMatcher, isEqToken, isQuestionToken, isSingleLine, skipChainExpression, STATEMENT_LIST_PARENTS} from './utils.js';

/**
 * Setting of element list indentation
 */
export type ElementListOption = number | 'first' | 'off';

/**
 * Normalized options of indent rule
 */
export interface IndentOptions
{
    /**
     * Indentation of switch cases
     */
    SwitchCase?: number;

    /**
     * Indentation of variable declarators per declaration kind
     */
    VariableDeclarator?: Record<string, ElementListOption>;

    /**
     * Indentation of assignment operator
     */
    assignmentOperator?: number | 'off';

    /**
     * Indentation of body of outer IIFE
     */
    outerIIFEBody?: number | 'off';

    /**
     * Indentation of member expressions
     */
    MemberExpression?: number | 'off';

    /**
     * Indentation of function declarations
     */
    FunctionDeclaration?: {parameters?: ElementListOption, body?: number, returnType?: number};

    /**
     * Indentation of function expressions
     */
    FunctionExpression?: {parameters?: ElementListOption, body?: number, returnType?: number};

    /**
     * Indentation of static blocks
     */
    StaticBlock?: {body?: number};

    /**
     * Indentation of call expressions
     */
    CallExpression?: {arguments?: ElementListOption};

    /**
     * Indentation of array expressions
     */
    ArrayExpression?: ElementListOption;

    /**
     * Indentation of object expressions
     */
    ObjectExpression?: ElementListOption;

    /**
     * Do not offset nested flat ternary expressions
     */
    flatTernaryExpressions?: boolean;

    /**
     * Offset of ternary expressions
     */
    offsetTernaryExpressions?: boolean | {CallExpression?: boolean, AwaitExpression?: boolean, NewExpression?: boolean};

    /**
     * Selectors of ignored nodes
     */
    ignoredNodes?: string[];

    /**
     * Ignores indentation of comments
     */
    ignoreComments?: boolean;
}

/**
 * First token of aligned argument or parameter that is anchored at its column
 */
export interface ArgumentAnchor
{
    /**
     * Anchored first token of argument
     */
    token: TSESTree.Token;

    /**
     * Range of argument, including its parentheses
     */
    range: [number, number];
}

/**
 * Dot of member chain that starts its own line
 */
export interface ChainDot
{
    /**
     * Dot (or optional chaining) token that is first token of its line
     */
    dot: TSESTree.Token;

    /**
     * Nearest previous dot of same chain that is first token of its line, null for first chain line
     */
    previousDot: TSESTree.Token | null;

    /**
     * Dots of same chain located on chain head line, chain line may be aligned with any of them
     */
    headLineDots: TSESTree.Token[];
}

/**
 * Context shared by all indent helpers
 */
export interface IndentContext
{
    /**
     * Source code
     */
    sourceCode: TSESLint.SourceCode;

    /**
     * Offset storage
     */
    offsets: OffsetStorage;

    /**
     * Token info
     */
    tokenInfo: TokenInfo;

    /**
     * Parentheses that belong to parameters or arguments
     */
    parameterParens: WeakSet<TSESTree.Token>;

    /**
     * Size of indent
     */
    indentSize: number;

    /**
     * Type of indent
     */
    indentType: 'space' | 'tab';

    /**
     * Normalized options
     */
    options: IndentOptions;

    /**
     * Anchored first arguments (parameters) of aligned argument lists
     */
    argumentAnchors: ArgumentAnchor[];

    /**
     * First tokens of condition operands aligned with first operand, they must not be ignored
     */
    alignedConditionTokens: Set<TSESTree.Token>;

    /**
     * Dots of member chains that start their own line (A.4)
     */
    chainDots: ChainDot[];
}

/**
 * Checks whether function is outer IIFE
 * @param node - Node to be checked
 * @returns True if node is callee of IIFE located at top level
 */
function isOuterIIFE(node: any): boolean
{
    if(!node.parent || node.parent.type !== 'CallExpression' || node.parent.callee !== node)
    {
        return false;
    }

    let statement = node.parent && node.parent.parent;

    while(statement.type === 'UnaryExpression' && ['!', '~', '+', '-'].includes(statement.operator) ||
          statement.type === 'AssignmentExpression' ||
          statement.type === 'LogicalExpression' ||
          statement.type === 'SequenceExpression' ||
          statement.type === 'VariableDeclarator')
    {
        statement = statement.parent;
    }

    return (statement.type === 'ExpressionStatement' || statement.type === 'VariableDeclaration') && statement.parent.type === 'Program';
}

/**
 * Counts linebreaks at the end of string
 * @param string - String to be checked
 * @returns Number of trailing linebreaks
 */
function countTrailingLinebreaks(string: string): number
{
    const linebreakMatches = string.match(/\s*$/u)[0].match(createGlobalLinebreakMatcher());

    return linebreakMatches === null ? 0 : linebreakMatches.length;
}

/**
 * Gets first token of element of list, including its parentheses and decorators
 * @param ctx - Indent context
 * @param element - Element of list
 * @param startToken - Opening token of list
 * @returns First token of element
 */
function getElementFirstToken(ctx: IndentContext, element: any, startToken: TSESTree.Token): TSESTree.Token
{
    const {sourceCode} = ctx;

    let token = sourceCode.getTokenBefore(element.decorators?.length && element.decorators[0].range[0] < element.range[0] ? element.decorators[0] : element);

    while(ASTUtils.isOpeningParenToken(token) && token !== startToken)
    {
        token = sourceCode.getTokenBefore(token);
    }

    return sourceCode.getTokenAfter(token);
}

/**
 * Aligns elements of literal starting their line with first element, if first element is on line of opening token
 * @param ctx - Indent context
 * @param elements - Elements of literal
 * @param startToken - Opening token of literal
 */
function alignElementsWithFirst(ctx: IndentContext, elements: any[], startToken: TSESTree.Token): void
{
    const {offsets, tokenInfo} = ctx;

    if(!elements.length || !elements[0])
    {
        return;
    }

    const firstElementToken = getElementFirstToken(ctx, elements[0], startToken);

    if(!ASTUtils.isTokenOnSameLine(startToken, firstElementToken))
    {
        return;
    }

    elements.forEach((element, index) =>
    {
        if(index >= 1 && element)
        {
            const elementToken = getElementFirstToken(ctx, element, startToken);

            if(tokenInfo.isFirstTokenOfLine(elementToken))
            {
                offsets.matchOffsetOf(firstElementToken, elementToken);
            }
        }
    });
}

/**
 * Sets offsets of parameters of function signature without body (abstract and overload methods, method and call signatures, function types)
 * @param ctx - Indent context
 * @param node - Signature node
 */
export function checkSignatureParameters(ctx: IndentContext, node: any): void
{
    const {sourceCode, parameterParens} = ctx;
    const params: any[] = node.params;

    if(!params?.length)
    {
        return;
    }

    const openingParen = sourceCode.getTokenBefore(params[0].decorators?.length && params[0].decorators[0].range[0] < params[0].range[0] ? params[0].decorators[0] : params[0]);
    const closingParen = sourceCode.getTokenAfter(params[params.length - 1], {filter: ASTUtils.isClosingParenToken});

    if(!ASTUtils.isOpeningParenToken(openingParen) || !closingParen)
    {
        return;
    }

    parameterParens.add(openingParen);
    parameterParens.add(closingParen);
    addElementListIndent(ctx, params, openingParen, closingParen, 'first', true);
}

/**
 * Sets offsets of list of elements (arguments, parameters, array items, ...)
 * @param ctx - Indent context
 * @param elements - Elements of list
 * @param startToken - Opening token of list
 * @param endToken - Closing token of list
 * @param offset - Offset of elements
 * @param alignArguments - Indicates whether elements are arguments or parameters that use aligned mode (first element is anchored at its column)
 */
export function addElementListIndent(ctx: IndentContext, elements: any[], startToken: TSESTree.Token, endToken: TSESTree.Token, offset: ElementListOption, alignArguments: boolean = false): void
{
    const {sourceCode, offsets, tokenInfo} = ctx;

    //Gets first token of element, including parentheses and decorators
    function getFirstToken(element: any): TSESTree.Token
    {
        return getElementFirstToken(ctx, element, startToken);
    }

    if(ASTUtils.isTokenOnSameLine(startToken, endToken))
    {
        return;
    }

    offsets.setDesiredOffsets([startToken.range[1], endToken.range[0]], startToken, typeof offset === 'number' ? offset : 1);
    offsets.setDesiredOffset(endToken, startToken, 0);

    if(offset === 'first' && elements.length && !elements[0])
    {
        return;
    }

    //Aligned mode, some 2nd or later element starts its line and first element starts on line of opening token, first element is the base for everything nested in it
    if(alignArguments &&
       offset === 'first' &&
       elements.some((element, index) => index >= 1 && element && tokenInfo.isFirstTokenOfLine(getFirstToken(element))) &&
       ASTUtils.isTokenOnSameLine(startToken, getFirstToken(elements[0])))
    {
        const anchorToken = getFirstToken(elements[0]);

        offsets.anchorAtColumn(anchorToken);
        ctx.argumentAnchors.push(
        {
            token: anchorToken,
            range: [anchorToken.range[0], sourceCode.getLastToken(elements[0]).range[1]],
        });
    }

    elements.forEach((element, index) =>
    {
        if(!element)
        {
            return;
        }

        if(offset === 'off')
        {
            offsets.ignoreToken(getFirstToken(element));
        }

        if(index === 0)
        {
            return;
        }

        if(offset === 'first' && tokenInfo.isFirstTokenOfLine(getFirstToken(element)))
        {
            offsets.matchOffsetOf(getFirstToken(elements[0]), getFirstToken(element));
        }
        else
        {
            const previousElement = elements[index - 1];
            const firstTokenOfPreviousElement = previousElement && getFirstToken(previousElement);
            const previousElementLastToken = previousElement && sourceCode.getLastToken(previousElement);

            if(previousElement && previousElementLastToken.loc.end.line - countTrailingLinebreaks(previousElementLastToken.value) > startToken.loc.end.line)
            {
                offsets.setDesiredOffsets([previousElement.range[1], element.range[1]], firstTokenOfPreviousElement, 0);
            }
        }
    });
}

/**
 * Sets offset of body of node without block, for example `if(a) b();`
 * @param ctx - Indent context
 * @param node - Body node
 */
export function addBlocklessNodeIndent(ctx: IndentContext, node: TSESTree.Node): void
{
    const {sourceCode, offsets} = ctx;

    if(node.type !== 'BlockStatement')
    {
        const lastParentToken = sourceCode.getTokenBefore(node, ASTUtils.isNotOpeningParenToken);

        let firstBodyToken = sourceCode.getFirstToken(node);
        let lastBodyToken = sourceCode.getLastToken(node);

        while(ASTUtils.isOpeningParenToken(sourceCode.getTokenBefore(firstBodyToken)) &&
              ASTUtils.isClosingParenToken(sourceCode.getTokenAfter(lastBodyToken)))
        {
            firstBodyToken = sourceCode.getTokenBefore(firstBodyToken);
            lastBodyToken = sourceCode.getTokenAfter(lastBodyToken);
        }

        offsets.setDesiredOffsets([firstBodyToken.range[0], lastBodyToken.range[1]], lastParentToken, 1);
    }
}

/**
 * Sets offsets of call expression or new expression
 * @param ctx - Indent context
 * @param node - Call or new expression
 */
export function addFunctionCallIndent(ctx: IndentContext, node: TSESTree.CallExpression | TSESTree.NewExpression): void
{
    const {sourceCode, offsets, parameterParens, options} = ctx;

    let openingParen: TSESTree.Token;

    if(node.arguments.length)
    {
        openingParen = sourceCode.getTokenAfter(node.typeArguments ?? node.callee, ASTUtils.isOpeningParenToken);
    }
    else
    {
        openingParen = sourceCode.getLastToken(node, 1);
    }

    const closingParen = sourceCode.getLastToken(node);

    parameterParens.add(openingParen);
    parameterParens.add(closingParen);

    if('optional' in node && node.optional)
    {
        const dotToken = sourceCode.getTokenAfter(node.callee, ASTUtils.isOptionalChainPunctuator);
        const calleeParenCount = sourceCode.getTokensBetween(node.callee, dotToken, {filter: ASTUtils.isClosingParenToken}).length;
        const firstTokenOfCallee = calleeParenCount ? sourceCode.getTokenBefore(node.callee, {skip: calleeParenCount - 1}) : sourceCode.getFirstToken(node.callee);
        const lastTokenOfCallee = sourceCode.getTokenBefore(dotToken);
        const offsetBase = ASTUtils.isTokenOnSameLine(lastTokenOfCallee, openingParen) ? lastTokenOfCallee : firstTokenOfCallee;

        offsets.setDesiredOffset(dotToken, offsetBase, 1);
    }

    const offsetAfterToken = node.callee.type === 'TaggedTemplateExpression' ? sourceCode.getFirstToken(node.callee.quasi) : node.typeArguments ?? openingParen;
    const offsetToken = sourceCode.getTokenBefore(offsetAfterToken);

    offsets.setDesiredOffset(openingParen, offsetToken, 0);

    addElementListIndent(ctx, node.arguments, openingParen, closingParen, options.CallExpression.arguments, true);
}

/**
 * Gets base token of owner line of token, it is innermost anchored first argument containing token on same line, otherwise first token of line of token
 * @param ctx - Indent context
 * @param token - Token whose owner base is searched
 * @returns Base token or null if line of token starts with multiline token from previous line
 */
function getOwnerBase(ctx: IndentContext, token: TSESTree.Token): TSESTree.Token | null
{
    let anchor: ArgumentAnchor | null = null;

    for(const argumentAnchor of ctx.argumentAnchors)
    {
        if(argumentAnchor.range[0] <= token.range[0] &&
           token.range[1] <= argumentAnchor.range[1] &&
           argumentAnchor.token.loc.start.line === token.loc.start.line &&
           (!anchor || argumentAnchor.range[0] > anchor.range[0]))
        {
            anchor = argumentAnchor;
        }
    }

    if(anchor)
    {
        return anchor.token;
    }

    const firstTokenOfLine = ctx.tokenInfo.getFirstTokenOfLine(token);

    return firstTokenOfLine.loc.start.line === token.loc.start.line ? firstTokenOfLine : null;
}

/**
 * Checks whether token owns opener (`{` or `[`) that starts next line, so that opener takes indentation of owner line
 * @param ctx - Indent context
 * @param token - Token before opener
 * @param opener - Opening brace or bracket
 * @param node - Node opened by opener
 * @returns True if token is `=`, `:` of property key, type annotation or index signature, `(`, `=>`, or `>` closing type assertion or type arguments
 */
function isOpenerOwnerToken(ctx: IndentContext, token: TSESTree.Token, opener: TSESTree.Token, node: TSESTree.Node): boolean
{
    if(token.type !== 'Punctuator')
    {
        return false;
    }

    //Outermost node that starts with opener, for example `{...} as const`
    let ownedNode = node;

    while(ownedNode.parent && ctx.sourceCode.getFirstToken(ownedNode.parent) === opener)
    {
        ownedNode = ownedNode.parent;
    }

    const parent = ownedNode.parent;

    switch(token.value)
    {
        case '=':
        case '(':
        case '=>':
        {
            return true;
        }
        case ':':
        {
            return parent?.type === AST_NODE_TYPES.Property && parent.value === ownedNode || parent?.type === AST_NODE_TYPES.TSTypeAnnotation;
        }
        case '>':
        {
            return parent?.type === AST_NODE_TYPES.TSTypeAssertion || ctx.sourceCode.getNodeByRangeIndex(token.range[0])?.type === AST_NODE_TYPES.TSTypeParameterInstantiation;
        }
        default:
        {
            return false;
        }
    }
}

/**
 * Aligns opener (`{` or `[`, or `<` and `...` in front of literal) on its own line with indentation of its owner line (A.2)
 * @param ctx - Indent context
 * @param opener - Opening token
 * @param node - Node opened by opener
 */
export function alignOpenerWithOwner(ctx: IndentContext, opener: TSESTree.Token, node: TSESTree.Node): void
{
    const {sourceCode, offsets, tokenInfo} = ctx;

    if(!tokenInfo.isFirstTokenOfLine(opener))
    {
        return;
    }

    const ownerToken = sourceCode.getTokenBefore(opener);

    if(!ownerToken || !isOpenerOwnerToken(ctx, ownerToken, opener, node))
    {
        return;
    }

    const base = getOwnerBase(ctx, ownerToken);

    if(base)
    {
        offsets.setDesiredOffset(opener, base, 0);
    }
}

/**
 * Sets offsets of parenthesized expressions
 * @param ctx - Indent context
 * @param tokens - All tokens of source code
 */
export function addParensIndent(ctx: IndentContext, tokens: TSESTree.Token[]): void
{
    const {sourceCode, offsets, parameterParens, tokenInfo} = ctx;
    const parenStack: TSESTree.Token[] = [];
    const parenPairs: {left: TSESTree.Token, right: TSESTree.Token}[] = [];

    for(let index = 0; index < tokens.length; index++)
    {
        const nextToken = tokens[index];

        if(ASTUtils.isOpeningParenToken(nextToken))
        {
            parenStack.push(nextToken);
        }
        else if(ASTUtils.isClosingParenToken(nextToken))
        {
            parenPairs.push({left: parenStack.pop(), right: nextToken});
        }
    }

    for(let index = parenPairs.length - 1; index >= 0; index--)
    {
        const leftParen = parenPairs[index].left;
        const rightParen = parenPairs[index].right;

        //Parens on same line need no indentation
        if(ASTUtils.isTokenOnSameLine(leftParen, rightParen))
        {
            continue;
        }

        //Parens of parameters and arguments are handled elsewhere
        if(!parameterParens.has(leftParen) && !parameterParens.has(rightParen))
        {
            const parenthesizedTokens = new Set<TSESTree.Token>(sourceCode.getTokensBetween(leftParen, rightParen));
            const tokenAfterLeftParen = sourceCode.getTokenAfter(leftParen);

            parenthesizedTokens.forEach(token =>
            {
                //Own line opener directly after paren takes indentation of owner line, set by alignOpenerWithOwner (B.3)
                if(token === tokenAfterLeftParen && (ASTUtils.isOpeningBraceToken(token) || ASTUtils.isOpeningBracketToken(token)) && tokenInfo.isFirstTokenOfLine(token))
                {
                    return;
                }

                const dependency = offsets.getFirstDependency(token);

                if(!dependency || !parenthesizedTokens.has(dependency))
                {
                    offsets.setDesiredOffset(token, leftParen, 1);
                }
            });
        }

        offsets.setDesiredOffset(rightParen, leftParen, 0);
    }
}

/**
 * Ignores indentation of node, first tokens of lines keep their indentation
 * @param ctx - Indent context
 * @param node - Node to be ignored
 */
export function ignoreNode(ctx: IndentContext, node: TSESTree.Node): void
{
    const {sourceCode, offsets, tokenInfo} = ctx;
    const unknownNodeTokens = new Set(sourceCode.getTokens(node, {includeComments: true}));

    unknownNodeTokens.forEach(token =>
    {
        const dependency = offsets.getFirstDependency(token);

        if(!dependency || !unknownNodeTokens.has(dependency))
        {
            const firstTokenOfLine = tokenInfo.getFirstTokenOfLine(token);

            if(token === firstTokenOfLine)
            {
                offsets.ignoreToken(token);
            }
            else
            {
                offsets.setDesiredOffset(token, firstTokenOfLine, 0);
            }
        }
    });
}

/**
 * Checks whether token is on first line of statement that contains leaf node
 * @param token - Token to be checked
 * @param leafNode - Node containing token
 * @returns True if token is on first line of statement
 */
export function isOnFirstLineOfStatement(token: TSESTree.Token, leafNode: any): boolean
{
    let node = leafNode;

    while(node.parent && !node.parent.type.endsWith('Statement') && !node.parent.type.endsWith('Declaration'))
    {
        node = node.parent;
    }

    node = node.parent;

    return !node || node.loc.start.line === token.loc.start.line;
}

/**
 * Sets offsets of assignment operator and its right side
 * @param ctx - Indent context
 * @param operator - Assignment operator token
 */
export function checkAssignmentOperator(ctx: IndentContext, operator: TSESTree.Token): void
{
    const {sourceCode, offsets, options} = ctx;
    const left = sourceCode.getTokenBefore(operator);
    const right = sourceCode.getTokenAfter(operator);

    if(typeof options.assignmentOperator === 'number')
    {
        offsets.setDesiredOffset(operator, left, options.assignmentOperator);
        offsets.setDesiredOffset(right, operator, options.assignmentOperator);
    }
    else
    {
        offsets.ignoreToken(operator);
        offsets.ignoreToken(right);
    }
}

/**
 * Sets offsets of array like node (array expression, array pattern, tuple type)
 * @param ctx - Indent context
 * @param node - Array like node
 */
export function checkArrayLikeNode(ctx: IndentContext, node: any): void
{
    const {sourceCode, options} = ctx;
    const elementList = node.type === AST_NODE_TYPES.TSTupleType ? node.elementTypes : node.elements;
    const openingBracket = sourceCode.getFirstToken(node);

    addElementListIndent(ctx,
                         elementList,
                         openingBracket,
                         sourceCode.getTokenAfter([...elementList].reverse().find(_ => _) || openingBracket, ASTUtils.isClosingBracketToken),
                         options.ArrayExpression);

    alignElementsWithFirst(ctx, elementList, openingBracket);

    if(node.type === AST_NODE_TYPES.ArrayExpression || node.type === AST_NODE_TYPES.TSTupleType)
    {
        alignOpenerWithOwner(ctx, openingBracket, node);
    }
}

/**
 * Sets offsets of object like node (object expression, object pattern, type literal)
 * @param ctx - Indent context
 * @param node - Object like node
 * @param properties - Properties of node
 */
export function checkObjectLikeNode(ctx: IndentContext, node: TSESTree.Node, properties: TSESTree.Node[]): void
{
    const {sourceCode, options} = ctx;
    const openingCurly = sourceCode.getFirstToken(node, ASTUtils.isOpeningBraceToken);

    addElementListIndent(ctx,
                         properties,
                         openingCurly,
                         sourceCode.getTokenAfter(properties.length ? properties[properties.length - 1] : openingCurly, ASTUtils.isClosingBraceToken),
                         options.ObjectExpression);

    alignElementsWithFirst(ctx, properties, openingCurly);

    if(node.type === AST_NODE_TYPES.ObjectExpression || node.type === AST_NODE_TYPES.TSTypeLiteral)
    {
        alignOpenerWithOwner(ctx, openingCurly, node);
    }
}

/**
 * Sets offsets of conditional node (conditional expression, conditional type)
 * @param ctx - Indent context
 * @param node - Conditional node
 * @param test - Test (or extends type)
 * @param consequent - Consequent (or true type)
 * @param alternate - Alternate (or false type)
 */
export function checkConditionalNode(ctx: IndentContext, node: any, test: TSESTree.Node, consequent: TSESTree.Node, alternate: TSESTree.Node): void
{
    const {sourceCode, offsets, options} = ctx;
    const ternaryOptions: Record<string, boolean> | false = options.offsetTernaryExpressions !== false
        ? {
            CallExpression: true,
            AwaitExpression: true,
            NewExpression: true,
            ...options.offsetTernaryExpressions === true ? {} : options.offsetTernaryExpressions,
        }
        : false;
    const firstToken = sourceCode.getFirstToken(node);

    //In flat ternary mode, nested ternaries on same line are not indented
    if(options.flatTernaryExpressions && ASTUtils.isTokenOnSameLine(test as any, consequent as any) && !isOnFirstLineOfStatement(firstToken, node))
    {
        return;
    }

    const alignsWithEnclosingConditionalTypeChain = node.type === AST_NODE_TYPES.TSConditionalType &&
                                                    node.parent.type === AST_NODE_TYPES.TSConditionalType &&
                                                    node.parent.falseType === node &&
                                                    ASTUtils.isTokenOnSameLine(test as any, consequent as any);

    //Sets offset of branch
    function checkBranch(branch: TSESTree.Node, branchFirstToken: TSESTree.Token): void
    {
        let offset = alignsWithEnclosingConditionalTypeChain ? 0 : 1;

        if(!alignsWithEnclosingConditionalTypeChain && ternaryOptions)
        {
            const branchType = skipChainExpression(branch).type;

            if(branchFirstToken.type === 'Punctuator' || ternaryOptions[branchType])
            {
                offset = 2;
            }
        }

        offsets.setDesiredOffset(branchFirstToken, firstToken, offset);
    }

    const questionMarkToken = sourceCode.getFirstTokenBetween(test, consequent, isQuestionToken);
    const colonToken = sourceCode.getFirstTokenBetween(consequent, alternate, ASTUtils.isColonToken);
    const firstConsequentToken = sourceCode.getTokenAfter(questionMarkToken);
    const lastConsequentToken = sourceCode.getTokenBefore(colonToken);
    const firstAlternateToken = sourceCode.getTokenAfter(colonToken);
    const operatorOffset = alignsWithEnclosingConditionalTypeChain ? 0 : 1;

    offsets.setDesiredOffset(questionMarkToken, firstToken, operatorOffset);
    offsets.setDesiredOffset(colonToken, firstToken, operatorOffset);

    checkBranch(consequent, firstConsequentToken);

    if(ASTUtils.isTokenOnSameLine(lastConsequentToken, firstAlternateToken))
    {
        offsets.setDesiredOffset(firstAlternateToken, firstConsequentToken, 0);
    }
    else
    {
        checkBranch(alternate, firstAlternateToken);
    }
}

/**
 * Ignores operator token and token after it, used for binary, logical, `as` and `satisfies` expressions
 * @param ctx - Indent context
 * @param left - Left side
 * @param right - Right side
 * @param operator - Operator text
 */
export function checkOperatorToken(ctx: IndentContext, left: TSESTree.Node, right: TSESTree.Node, operator: string): void
{
    const {sourceCode, offsets} = ctx;
    const operatorToken = sourceCode.getFirstTokenBetween(left, right, token => token.value === operator);
    const tokenAfterOperator = sourceCode.getTokenAfter(operatorToken);

    offsets.ignoreToken(operatorToken);

    //Aligned condition operands are checked (A.5)
    if(!ctx.alignedConditionTokens.has(tokenAfterOperator))
    {
        offsets.ignoreToken(tokenAfterOperator);
    }

    offsets.setDesiredOffset(tokenAfterOperator, operatorToken, 0);
}

/**
 * Gets first token of node including its own wrapping parentheses
 * @param ctx - Indent context
 * @param node - Node whose first token is returned
 * @returns First token
 */
function getFirstTokenWithParens(ctx: IndentContext, node: TSESTree.Node): TSESTree.Token
{
    const {sourceCode} = ctx;

    let firstToken = sourceCode.getFirstToken(node);
    let lastToken = sourceCode.getLastToken(node);

    while(ASTUtils.isOpeningParenToken(sourceCode.getTokenBefore(firstToken)) && ASTUtils.isClosingParenToken(sourceCode.getTokenAfter(lastToken)))
    {
        firstToken = sourceCode.getTokenBefore(firstToken);
        lastToken = sourceCode.getTokenAfter(lastToken);
    }

    return firstToken;
}

/**
 * Collects operands of logical expression chain, without crossing parentheses
 * @param ctx - Indent context
 * @param node - Node of chain
 * @param operands - Array that receives operands
 */
function collectLogicalOperands(ctx: IndentContext, node: TSESTree.Node, operands: TSESTree.Node[]): void
{
    if(node.type === AST_NODE_TYPES.LogicalExpression && !ASTUtils.isParenthesized(node, ctx.sourceCode))
    {
        collectLogicalOperands(ctx, node.left, operands);
        collectLogicalOperands(ctx, node.right, operands);
    }
    else
    {
        operands.push(node);
    }
}

/**
 * Aligns operands of logical expression chain that start their line with first operand, recursively also inside parenthesized logical sub groups spanning lines
 * @param ctx - Indent context
 * @param node - Logical expression
 */
function alignLogicalOperands(ctx: IndentContext, node: TSESTree.LogicalExpression): void
{
    const {offsets, tokenInfo} = ctx;
    const operands: TSESTree.Node[] = [];

    collectLogicalOperands(ctx, node.left, operands);
    collectLogicalOperands(ctx, node.right, operands);

    const baseToken = getFirstTokenWithParens(ctx, operands[0]);

    operands.forEach((operand, index) =>
    {
        if(index >= 1)
        {
            const operandToken = getFirstTokenWithParens(ctx, operand);

            if(tokenInfo.isFirstTokenOfLine(operandToken))
            {
                offsets.matchOffsetOf(baseToken, operandToken);
                ctx.alignedConditionTokens.add(operandToken);
            }
        }

        if(operand.type === AST_NODE_TYPES.LogicalExpression && !isSingleLine(operand))
        {
            alignLogicalOperands(ctx, operand);
        }
    });
}

/**
 * Aligns continuation lines of multi-line `&&`/`||` condition with its first operand (A.5)
 * @param ctx - Indent context
 * @param test - Test of `if`, `while` or `do while` statement
 */
export function alignConditionOperands(ctx: IndentContext, test: TSESTree.Node): void
{
    if(test.type === AST_NODE_TYPES.LogicalExpression && !ASTUtils.isParenthesized(test, ctx.sourceCode) && !isSingleLine(test))
    {
        alignLogicalOperands(ctx, test);
    }
}

/**
 * Sets offsets of type assertion `<T>expression`, type tokens are offset from `<`
 * @param ctx - Indent context
 * @param node - Type assertion
 */
export function checkTypeAssertion(ctx: IndentContext, node: TSESTree.TSTypeAssertion): void
{
    const {sourceCode, offsets} = ctx;
    const openingToken = sourceCode.getFirstToken(node);
    const closingToken = sourceCode.getTokenAfter(node.typeAnnotation, token => token.value === '>');

    offsets.setDesiredOffsets([openingToken.range[0], closingToken.range[1]], openingToken, 0);

    //Type assertion of literal on its own line is part of opener, `fn(\n<T>\n{`
    if(node.expression.type === AST_NODE_TYPES.ObjectExpression || node.expression.type === AST_NODE_TYPES.ArrayExpression)
    {
        alignOpenerWithOwner(ctx, openingToken, node);
    }
}

/**
 * Sets offsets of spread element, spread of literal on its own line is part of opener, `fn(\n...[`
 * @param ctx - Indent context
 * @param node - Spread element
 */
export function checkSpreadElement(ctx: IndentContext, node: TSESTree.SpreadElement): void
{
    if(node.argument.type === AST_NODE_TYPES.ObjectExpression || node.argument.type === AST_NODE_TYPES.ArrayExpression)
    {
        alignOpenerWithOwner(ctx, ctx.sourceCode.getFirstToken(node), node);
    }
}

/**
 * Gets nearest dot of member chain that starts its own line, walking from object of member expression towards chain head
 * @param ctx - Indent context
 * @param object - Object of member expression
 * @returns Dot token that is first token of its line, or null if there is none
 */
function getPreviousChainDot(ctx: IndentContext, object: TSESTree.Node): TSESTree.Token | null
{
    let current: TSESTree.Node | null = object;

    while(current)
    {
        switch(current.type)
        {
            case 'CallExpression':
            {
                current = current.callee;

                break;
            }
            case 'TSNonNullExpression':
            case 'ChainExpression':
            {
                current = current.expression;

                break;
            }
            case 'MemberExpression':
            {
                if(!current.computed)
                {
                    const dot = ctx.sourceCode.getTokenBefore(current.property);

                    if(ctx.tokenInfo.isFirstTokenOfLine(dot))
                    {
                        return dot;
                    }
                }

                current = current.object;

                break;
            }
            default:
            {
                current = null;

                break;
            }
        }
    }

    return null;
}

/**
 * Gets dots of member chain located on line of chain head, walking from object of member expression towards chain head
 * @param ctx - Indent context
 * @param object - Object of member expression
 * @returns Dot tokens located on line of first token of chain head
 */
function getHeadLineChainDots(ctx: IndentContext, object: TSESTree.Node): TSESTree.Token[]
{
    const dots: TSESTree.Token[] = [];
    let current: TSESTree.Node = object;

    for(;;)
    {
        if(current.type === AST_NODE_TYPES.CallExpression)
        {
            current = current.callee;
        }
        else if(current.type === AST_NODE_TYPES.TSNonNullExpression || current.type === AST_NODE_TYPES.ChainExpression)
        {
            current = current.expression;
        }
        else if(current.type === AST_NODE_TYPES.MemberExpression)
        {
            if(!current.computed)
            {
                dots.push(ctx.sourceCode.getTokenBefore(current.property));
            }

            current = current.object;
        }
        else
        {
            break;
        }
    }

    const headLine = ctx.sourceCode.getFirstToken(current).loc.start.line;

    return dots.filter(dot => dot.loc.start.line === headLine);
}

/**
 * Sets desired indent of member chain dots that start their own line (A.4), chain line is aligned with chain (+4 from chain head line),
 * or aligned with previous dot, or exactly +4 deeper than previous dot (d3 sub-indent), or aligned with a dot located on chain head line, wrong line is fixed to nearest of chain column and previous dot column
 * (chain column on tie), fix never creates sub-indent, must be called once all offsets are set and before any desired indent is computed
 * @param ctx - Indent context
 */
export function alignChainDots(ctx: IndentContext): void
{
    const {offsets, indentSize} = ctx;
    const chainDots = [...ctx.chainDots].sort((first, second) => first.dot.range[0] - second.dot.range[0]);

    for(const {dot, previousDot, headLineDots} of chainDots)
    {
        const chainColumn = offsets.getDesiredIndent(dot).length;
        const previousColumn = previousDot ? offsets.getDesiredIndent(previousDot).length : chainColumn;
        const actualColumn = dot.loc.start.column;
        let column = Math.abs(previousColumn - actualColumn) < Math.abs(chainColumn - actualColumn) ? previousColumn : chainColumn;

        if(actualColumn === chainColumn ||
           actualColumn === previousColumn ||
           (previousDot && actualColumn === previousColumn + indentSize) ||
           headLineDots.some(headLineDot => headLineDot.loc.start.column === actualColumn))
        {
            column = actualColumn;
        }

        offsets.setDesiredIndent(dot, ' '.repeat(column));
    }
}

/**
 * Sets offsets of member expression like node
 * @param ctx - Indent context
 * @param node - Member expression like node
 * @param object - Object of member expression
 * @param property - Property of member expression
 * @param computed - Indicates whether is access computed
 */
export function checkMemberExpression(ctx: IndentContext, node: TSESTree.Node, object: TSESTree.Node, property: TSESTree.Node, computed: boolean = false): void
{
    const {sourceCode, offsets, options} = ctx;
    const firstNonObjectToken = sourceCode.getFirstTokenBetween(object, property, ASTUtils.isNotClosingParenToken);
    const secondNonObjectToken = sourceCode.getTokenAfter(firstNonObjectToken);
    const objectParenCount = sourceCode.getTokensBetween(object, property, {filter: ASTUtils.isClosingParenToken}).length;
    const firstObjectToken = objectParenCount ? sourceCode.getTokenBefore(object, {skip: objectParenCount - 1}) : sourceCode.getFirstToken(object);
    const lastObjectToken = sourceCode.getTokenBefore(firstNonObjectToken);
    const firstPropertyToken = computed ? firstNonObjectToken : secondNonObjectToken;

    if(computed)
    {
        //For computed MemberExpression, match the closing bracket with the opening bracket
        offsets.setDesiredOffset(sourceCode.getLastToken(node), firstNonObjectToken, 0);
        offsets.setDesiredOffsets(property.range, firstNonObjectToken, 1);
    }

    //If the object ends on the same line that the property starts, match against the last token of the object, to ensure that the MemberExpression is not indented.
    //Otherwise, match against the first token of the object, e.g. `foo`
    const offsetBase = ASTUtils.isTokenOnSameLine(lastObjectToken, firstPropertyToken) ? lastObjectToken : firstObjectToken;

    if(typeof options.MemberExpression === 'number')
    {
        //Match the dot (for non-computed properties) or the opening bracket (for computed properties) against the object.
        offsets.setDesiredOffset(firstNonObjectToken, offsetBase, options.MemberExpression);

        //For computed MemberExpressions, match the first token of the property against the opening bracket.
        //Otherwise, match the first token of the property against the dot when they share line, so it follows the dot even if the dot is sub-indented (A.4), else against the object.
        if(computed)
        {
            offsets.setDesiredOffset(secondNonObjectToken, firstNonObjectToken, options.MemberExpression);
        }
        else if(ASTUtils.isTokenOnSameLine(firstNonObjectToken, secondNonObjectToken))
        {
            offsets.setDesiredOffset(secondNonObjectToken, firstNonObjectToken, 0);
        }
        else
        {
            offsets.setDesiredOffset(secondNonObjectToken, offsetBase, options.MemberExpression);
        }

        if(!computed && ctx.tokenInfo.isFirstTokenOfLine(firstNonObjectToken))
        {
            ctx.chainDots.push(
            {
                dot: firstNonObjectToken,
                previousDot: getPreviousChainDot(ctx, object),
                headLineDots: getHeadLineChainDots(ctx, object),
            });
        }
    }
    else
    {
        //If the MemberExpression option is off, ignore the dot and the first token of the property.
        offsets.ignoreToken(firstNonObjectToken);
        offsets.ignoreToken(secondNonObjectToken);

        //To ignore the property indentation, ensure that the property tokens depend on the ignored tokens.
        offsets.setDesiredOffset(firstNonObjectToken, offsetBase, 0);
        offsets.setDesiredOffset(secondNonObjectToken, firstNonObjectToken, 0);
    }
}

/**
 * Sets offsets of block like node (block, class body, interface body, enum body, module block)
 * @param ctx - Indent context
 * @param node - Block like node
 */
export function checkBlockLikeNode(ctx: IndentContext, node: any): void
{
    const {sourceCode, offsets, options} = ctx;

    let blockIndentLevel: number | 'off';

    if(node.parent && isOuterIIFE(node.parent))
    {
        blockIndentLevel = options.outerIIFEBody;
    }
    else if(node.parent && (node.parent.type === 'FunctionExpression' || node.parent.type === 'ArrowFunctionExpression'))
    {
        blockIndentLevel = options.FunctionExpression.body;
    }
    else if(node.parent && node.parent.type === 'FunctionDeclaration')
    {
        blockIndentLevel = options.FunctionDeclaration.body;
    }
    else
    {
        blockIndentLevel = 1;
    }

    //For blocks that aren't lists of statements, they can appear in places that don't normally allow indentation, so the opening curly is offset against the parent
    if(!STATEMENT_LIST_PARENTS.has(node.parent.type))
    {
        offsets.setDesiredOffset(sourceCode.getFirstToken(node), sourceCode.getFirstToken(node.parent), 0);
    }

    addElementListIndent(ctx, node.type === AST_NODE_TYPES.TSEnumBody ? node.members : node.body, sourceCode.getFirstToken(node), sourceCode.getLastToken(node), blockIndentLevel);
}

/**
 * Sets offsets of heritage clauses (`extends`, `implements`)
 * @param ctx - Indent context
 * @param node - Class or interface node
 * @param heritages - Heritage nodes
 */
export function checkHeritages(ctx: IndentContext, node: any, heritages: TSESTree.Node[]): void
{
    const {sourceCode, offsets} = ctx;
    const classToken = sourceCode.getFirstToken(node);
    const extendsToken = sourceCode.getTokenBefore(heritages[0], ASTUtils.isNotOpeningParenToken);

    offsets.setDesiredOffsets([extendsToken.range[0], node.body.range[0]], classToken, 1);
}

/**
 * Sets offsets of class property like node
 * @param ctx - Indent context
 * @param node - Class property node
 */
export function checkClassProperty(ctx: IndentContext, node: any): void
{
    const {sourceCode, offsets} = ctx;
    const firstToken = sourceCode.getFirstToken(node);
    const lastToken = sourceCode.getLastToken(node);

    let keyLastToken: TSESTree.Token;

    //Indent key
    if(node.computed)
    {
        //Indent computed key
        const bracketTokenL = sourceCode.getTokenBefore(node.key, ASTUtils.isOpeningBracketToken);
        const bracketTokenR = keyLastToken = sourceCode.getTokenAfter(node.key, ASTUtils.isClosingBracketToken);
        const keyRange: [number, number] = [bracketTokenL.range[1], bracketTokenR.range[0]];

        if(bracketTokenL !== firstToken)
        {
            offsets.setDesiredOffset(bracketTokenL, firstToken, 0);
        }

        offsets.setDesiredOffsets(keyRange, bracketTokenL, 1);
        offsets.setDesiredOffset(bracketTokenR, bracketTokenL, 0);
    }
    else
    {
        const idToken = keyLastToken = sourceCode.getFirstToken(node.key);

        if(!node.decorators?.length && idToken !== firstToken)
        {
            offsets.setDesiredOffset(idToken, firstToken, 1);
        }
    }

    //Indent initializer
    if(node.value)
    {
        const operator = sourceCode.getTokenBefore(node.value, isEqToken);

        checkAssignmentOperator(ctx, operator);

        if(ASTUtils.isSemicolonToken(lastToken))
        {
            offsets.setDesiredOffset(lastToken, operator, 1);
        }
    }
    else if(ASTUtils.isSemicolonToken(lastToken))
    {
        offsets.setDesiredOffset(lastToken, keyLastToken, 1);
    }
}
