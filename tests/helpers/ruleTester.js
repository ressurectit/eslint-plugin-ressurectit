/**
 * @fileoverview Shared ESLint RuleTester setup for node:test
 */

import {describe, it} from 'node:test';

import {RuleTester} from 'eslint';
import tseslint from 'typescript-eslint';

RuleTester.describe = describe;
RuleTester.it = it;
RuleTester.itOnly = it.only;

/**
 * RuleTester configured with TypeScript parser, used by all rule tests
 */
export const ruleTester = new RuleTester(
{
    languageOptions:
    {
        parser: tseslint.parser,
        ecmaVersion: 'latest',
        sourceType: 'module',
    },
});

/**
 * Removes leading newline, trailing whitespace-only line and smallest common indentation
 * @param text - Text to be dedented
 * @returns Dedented text
 */
export function dedent(text)
{
    const lines = text.replace(/^\r?\n/, '').replace(/\r?\n[ \t]*$/, '').split('\n');
    const indents = lines.filter(line => line.trim().length).map(line => /^[ \t]*/.exec(line)[0].length);
    const indent = indents.length ? Math.min(...indents) : 0;

    return lines.map(line => line.slice(Math.min(indent, /^[ \t]*/.exec(line)[0].length))).join('\n');
}
