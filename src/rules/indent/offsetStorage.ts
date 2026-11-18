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
 * @fileoverview Offset storage, token info and validation helpers of indent rule
 */

import type {TSESLint, TSESTree} from '@typescript-eslint/utils';

/**
 * Range of source code
 */
type Range = [number, number];

/**
 * Token or comment
 */
type AnyToken = TSESTree.Token;

/**
 * Sparse map from index to value, that finds last value not after given key
 */
class IndexMap
{
    //######################### private fields #########################

    /**
     * Stored values
     */
    private _values: Int32Array;

    //######################### constructor #########################
    constructor(maxKey: number)
    {
        this._values = new Int32Array(maxKey + 1);
    }

    //######################### public methods #########################

    /**
     * Inserts value for key
     * @param key - Key to be set
     * @param value - Value to be stored
     */
    public insert(key: number, value: number): void
    {
        this._values[key] = value;
    }

    /**
     * Finds last non zero value stored at key or before it
     * @param key - Key from which is search started
     * @returns Found value or 0
     */
    public findLastNotAfter(key: number): number
    {
        const values = this._values;

        for(let index = key; index >= 0; index--)
        {
            const value = values[index];

            if(value !== 0)
            {
                return value;
            }
        }

        return 0;
    }

    /**
     * Deletes values in range
     * @param start - Start of range, inclusive
     * @param end - End of range, exclusive
     */
    public deleteRange(start: number, end: number): void
    {
        this._values.fill(0, start, end);
    }
}

/**
 * Storage of offset descriptors, descriptors are addressed by index
 */
class OffsetDescriptorStorage
{
    //######################### private fields #########################

    /**
     * Offsets of descriptors
     */
    private _offsets: number[] = [0];

    /**
     * Tokens from which are descriptors offset
     */
    private _fromTokens: AnyToken[] = [null];

    /**
     * Force flags of descriptors
     */
    private _forces: boolean[] = [false];

    //######################### public methods #########################

    /**
     * Creates new descriptor
     * @param offset - Offset of descriptor
     * @param from - Token from which is offset computed
     * @param force - Indicates whether is offset applied even on same line
     * @returns Index of created descriptor
     */
    public create(offset: number, from: AnyToken | null | undefined, force: boolean): number
    {
        this._offsets.push(offset);
        this._fromTokens.push(from ?? null);
        this._forces.push(force);

        return this._offsets.length - 1;
    }

    /**
     * Gets offset of descriptor
     * @param index - Index of descriptor
     * @returns Offset
     */
    public getOffset(index: number): number
    {
        return this._offsets[index];
    }

    /**
     * Gets token from which is descriptor offset
     * @param index - Index of descriptor
     * @returns Token or null
     */
    public getFromToken(index: number): AnyToken | null
    {
        return this._fromTokens[index];
    }

    /**
     * Gets force flag of descriptor
     * @param index - Index of descriptor
     * @returns Force flag
     */
    public getForce(index: number): boolean
    {
        return this._forces[index];
    }
}

/**
 * Stores desired offsets of tokens and computes desired indentation
 */
export class OffsetStorage
{
    //######################### private fields #########################

    /**
     * Information about tokens
     */
    private _tokenInfo: TokenInfo;

    /**
     * Size of one indent
     */
    private _indentSize: number;

    /**
     * Character used for indentation
     */
    private _indentType: string;

    /**
     * Map of source code index to offset descriptor
     */
    private _indexMap: IndexMap;

    /**
     * Storage of descriptors
     */
    private _descriptors: OffsetDescriptorStorage;

    /**
     * Tokens whose indentation is locked to other token
     */
    private _lockedFirstTokens: WeakMap<AnyToken, AnyToken> = new WeakMap();

    /**
     * Tokens whose indentation is anchored at their actual column relative to first token of their line
     */
    private _anchoredTokens: WeakSet<AnyToken> = new WeakSet();

    /**
     * Cache of computed desired indents
     */
    private _desiredIndentCache: WeakMap<AnyToken, string> = new WeakMap();

    /**
     * Tokens that are ignored
     */
    private _ignoredTokens: WeakSet<AnyToken> = new WeakSet();

    //######################### constructor #########################
    constructor(tokenInfo: TokenInfo, indentSize: number, indentType: string, maxIndex: number)
    {
        this._tokenInfo = tokenInfo;
        this._indentSize = indentSize;
        this._indentType = indentType;
        this._indexMap = new IndexMap(maxIndex);
        this._descriptors = new OffsetDescriptorStorage();
        this._indexMap.insert(0, this._descriptors.create(0, null, false));
    }

    //######################### public methods #########################

    /**
     * Matches offset of token to offset of base token
     * @param baseToken - Token whose offset is matched
     * @param offsetToken - Token that gets same offset
     */
    public matchOffsetOf(baseToken: AnyToken, offsetToken: AnyToken): void
    {
        this._lockedFirstTokens.set(offsetToken, baseToken);
    }

    /**
     * Anchors token at its column, its desired indent becomes desired indent of first token of its line plus distance between them,
     * does nothing for token that is first token of its line or whose line starts with multiline token from previous line
     * @param token - Token to be anchored
     */
    public anchorAtColumn(token: AnyToken): void
    {
        const firstTokenOfLine = this._tokenInfo.getFirstTokenOfLine(token);

        if(firstTokenOfLine !== token && firstTokenOfLine.loc.start.line === token.loc.start.line)
        {
            this._anchoredTokens.add(token);
        }
    }

    /**
     * Sets desired indent of token directly, overrides its offset descriptor, must be called before desired indent of token or of any token depending on it is computed
     * @param token - Token whose desired indent is set
     * @param indent - Desired indentation string
     */
    public setDesiredIndent(token: AnyToken, indent: string): void
    {
        this._desiredIndentCache.set(token, indent);
    }

    /**
     * Sets desired offset of token
     * @param token - Token to be set
     * @param fromToken - Token from which is offset computed
     * @param offset - Offset in indents
     */
    public setDesiredOffset(token: AnyToken | null | undefined, fromToken: AnyToken | null | undefined, offset: number): void
    {
        if(token)
        {
            this.setDesiredOffsets(token.range, fromToken, offset);
        }
    }

    /**
     * Sets desired offset of all tokens in range
     * @param range - Range of tokens
     * @param fromToken - Token from which is offset computed
     * @param offset - Offset in indents
     * @param force - Indicates whether is offset applied even on same line
     */
    public setDesiredOffsets(range: Range, fromToken: AnyToken | null | undefined, offset: number, force: boolean = false): void
    {
        const descriptorToInsert = this._descriptors.create(offset, fromToken, force);
        const descriptorAfterRange = this._indexMap.findLastNotAfter(range[1]);
        const fromTokenIsInRange = fromToken && fromToken.range[0] >= range[0] && fromToken.range[1] <= range[1];
        const fromTokenDescriptor = fromTokenIsInRange ? this._getOffsetDescriptorIndex(fromToken) : 0;

        this._indexMap.deleteRange(range[0] + 1, range[1]);
        this._indexMap.insert(range[0], descriptorToInsert);

        if(fromTokenIsInRange)
        {
            this._indexMap.insert(fromToken.range[0], fromTokenDescriptor);
            this._indexMap.insert(fromToken.range[1], descriptorToInsert);
        }

        this._indexMap.insert(range[1], descriptorAfterRange);
    }

    /**
     * Gets desired indent of token
     * @param token - Token whose indent is computed
     * @returns Desired indentation string
     */
    public getDesiredIndent(token: AnyToken): string
    {
        if(!this._desiredIndentCache.has(token))
        {
            if(this._ignoredTokens.has(token))
            {
                this._desiredIndentCache.set(token, this._tokenInfo.getTokenIndent(token));
            }
            else if(this._lockedFirstTokens.has(token))
            {
                const firstToken = this._lockedFirstTokens.get(token);
                const firstTokenOfLine = this._tokenInfo.getFirstTokenOfLine(firstToken);

                this._desiredIndentCache.set(token, this.getDesiredIndent(firstTokenOfLine) + this._indentType.repeat(firstToken.loc.start.column - firstTokenOfLine.loc.start.column));
            }
            else if(this._anchoredTokens.has(token))
            {
                const firstTokenOfLine = this._tokenInfo.getFirstTokenOfLine(token);

                this._desiredIndentCache.set(token, this.getDesiredIndent(firstTokenOfLine) + this._indentType.repeat(token.loc.start.column - firstTokenOfLine.loc.start.column));
            }
            else
            {
                const offsetDescriptorIndex = this._getOffsetDescriptorIndex(token);
                const offsetInfo =
                {
                    from: this._descriptors.getFromToken(offsetDescriptorIndex),
                    force: this._descriptors.getForce(offsetDescriptorIndex),
                    offset: this._descriptors.getOffset(offsetDescriptorIndex),
                };
                const offset = offsetInfo.from && offsetInfo.from.loc.start.line === token.loc.start.line && !/^\s*?\n/u.test(token.value) && !offsetInfo.force ? 0 : offsetInfo.offset * this._indentSize;

                this._desiredIndentCache.set(token, (offsetInfo.from ? this.getDesiredIndent(offsetInfo.from) : '') + this._indentType.repeat(Math.round(offset)));
            }
        }

        return this._desiredIndentCache.get(token);
    }

    /**
     * Ignores token, its indentation is not checked, applies only to first token of line
     * @param token - Token to be ignored
     */
    public ignoreToken(token: AnyToken): void
    {
        if(this._tokenInfo.isFirstTokenOfLine(token))
        {
            this._ignoredTokens.add(token);
        }
    }

    /**
     * Gets token from which is offset of token computed
     * @param token - Token whose dependency is returned
     * @returns Token or null
     */
    public getFirstDependency(token: AnyToken): AnyToken | null
    {
        return this._descriptors.getFromToken(this._getOffsetDescriptorIndex(token));
    }

    //######################### private methods #########################

    /**
     * Gets index of offset descriptor for token
     * @param token - Token whose descriptor is searched
     * @returns Index of descriptor
     */
    private _getOffsetDescriptorIndex(token: AnyToken): number
    {
        return this._indexMap.findLastNotAfter(token.range[0]);
    }
}

/**
 * Provides information about tokens and lines of source code
 */
export class TokenInfo
{
    //######################### public properties #########################

    /**
     * First token (or comment) of each line, by line number
     */
    public firstTokensByLineNumber: Map<number, AnyToken>;

    //######################### constructor #########################
    constructor(public sourceCode: TSESLint.SourceCode)
    {
        this.firstTokensByLineNumber = new Map();

        const tokens = sourceCode.tokensAndComments;

        for(let index = 0; index < tokens.length; index++)
        {
            const token = tokens[index];

            if(!this.firstTokensByLineNumber.has(token.loc.start.line))
            {
                this.firstTokensByLineNumber.set(token.loc.start.line, token);
            }

            if(!this.firstTokensByLineNumber.has(token.loc.end.line) && sourceCode.text.slice(token.range[1] - token.loc.end.column, token.range[1]).trim())
            {
                this.firstTokensByLineNumber.set(token.loc.end.line, token);
            }
        }
    }

    //######################### public methods #########################

    /**
     * Gets first token of line on which token starts
     * @param token - Token whose line is used
     * @returns First token of line
     */
    public getFirstTokenOfLine(token: AnyToken): AnyToken
    {
        return this.firstTokensByLineNumber.get(token.loc.start.line);
    }

    /**
     * Checks whether token is first token of its line
     * @param token - Token to be checked
     * @returns True if token is first on line
     */
    public isFirstTokenOfLine(token: AnyToken): boolean
    {
        return this.getFirstTokenOfLine(token) === token;
    }

    /**
     * Gets actual indentation of line of token
     * @param token - Token whose indent is returned
     * @returns Whitespace before token
     */
    public getTokenIndent(token: AnyToken): string
    {
        return this.sourceCode.text.slice(token.range[0] - token.loc.start.column, token.range[0]);
    }
}

/**
 * Checks whether token has desired indent
 * @param tokenInfo - Token info
 * @param token - Token to be validated
 * @param desiredIndent - Desired indentation
 * @returns True if indentation matches
 */
export function validateTokenIndent(tokenInfo: TokenInfo, token: AnyToken, desiredIndent: string): boolean
{
    return tokenInfo.getTokenIndent(token) === desiredIndent;
}

/**
 * Checks whether there are blank lines between two tokens
 * @param tokenInfo - Token info
 * @param firstToken - First token
 * @param secondToken - Second token
 * @returns True if there is at least one blank line
 */
export function hasBlankLinesBetween(tokenInfo: TokenInfo, firstToken: AnyToken, secondToken: AnyToken): boolean
{
    const firstTokenLine = firstToken.loc.end.line;
    const secondTokenLine = secondToken.loc.start.line;

    if(firstTokenLine === secondTokenLine || firstTokenLine === secondTokenLine - 1)
    {
        return false;
    }

    for(let line = firstTokenLine + 1; line < secondTokenLine; ++line)
    {
        if(!tokenInfo.firstTokensByLineNumber.has(line))
        {
            return true;
        }
    }

    return false;
}
