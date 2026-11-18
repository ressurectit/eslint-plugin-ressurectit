/**
 * @fileoverview Tests for recommended config and plugin wiring
 */

import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {describe, it} from 'node:test';

import {ESLint} from 'eslint';
import stylistic from '@stylistic/eslint-plugin';

import plugin from '../lib/index.js';

const EXPECTED_RULES =
[
    'imports-order',
    'imports-spacing',
    'indent',
    'literal-brace-style',
    'switch-case-braces',
    'type-operator-spacing',
    'region-titles',
    'decorator-layout',
    'argument-layout',
    'line-wrapping',
    'angular-metadata',
    'padding-line-between-statements',
    'lines-between-class-members',
];

const eslint = new ESLint(
{
    overrideConfigFile: true,
    overrideConfig: plugin.configs.recommended,
});

/**
 * Lints code with recommended config
 * @param {string} code - Code to be linted
 * @param {string} filePath - Virtual path of file
 * @returns {Promise<import('eslint').Linter.LintMessage[]>} Lint messages
 */
async function lint(code, filePath)
{
    const [result] = await eslint.lintText(code, {filePath});

    return result.messages;
}

/**
 * Reads fixture
 * @param {string} name - Name of fixture file
 * @returns {string} Content of fixture
 */
function fixture(name)
{
    return readFileSync(new URL(`./fixtures/${name}`, import.meta.url), 'utf8');
}

describe('recommended config', () =>
{
    it('(a) exposes all rules', () =>
    {
        assert.deepEqual(Object.keys(plugin.rules).sort(), [...EXPECTED_RULES].sort());
        assert.equal(plugin.rules['padding-line-between-statements'], stylistic.rules['padding-line-between-statements']);
    });

    it('(b) asynctask.service.ts gives no messages', async () =>
    {
        const messages = await lint(fixture('asynctask.service.ts'), 'asynctask.service.ts');

        assert.deepEqual(messages.map(msg => `${msg.line}:${msg.ruleId}`), []);
    });

    it('(c) app.component.ts reports expected problems', async () =>
    {
        const messages = await lint(fixture('app.component.ts'), 'app.component.ts');
        const has = (ruleId, line) => messages.some(msg => msg.ruleId == ruleId && msg.line == line);

        assert.ok(has('ressurectit/region-titles', 80), 'region-titles on 80');
        assert.ok(has('ressurectit/region-titles', 102), 'region-titles on 102');
        assert.ok(has('jsdoc/require-hyphen-before-param-description', 299), 'hyphen on 299');
        assert.ok(has('ressurectit/padding-line-between-statements', 237), 'padding on 237');
        assert.ok(!messages.some(msg => msg.ruleId == 'jsdoc/require-jsdoc' && /constructor/.test(msg.message)), 'no jsdoc on constructor');
    });

    it('(d) getter and setter pair of directive does not require jsdoc', async () =>
    {
        const code = [
            '/**',
            ' * Class',
            ' */',
            'class A',
            '{',
            '    /**',
            '     * @inheritdoc',
            '     */',
            '    @Input()',
            '    public override get value(): number|undefined|null',
            '    {',
            '        return this.ɵValue;',
            '    }',
            '    public override set value(value: number|undefined|null)',
            '    {',
            '        this.setInternalValue(value);',
            '    }',
            '}',
            '',
        ].join('\n');
        const messages = await lint(code, 'a.ts');

        assert.deepEqual(messages.filter(msg => msg.ruleId == 'jsdoc/require-jsdoc').map(msg => msg.line), []);
    });

    it('(e) import with closing brace on item line is reported by list-style', async () =>
    {
        const messages = await lint('import {\n    A,\n    B} from \'x\';\n', 'a.ts');
        const listStyle = messages.filter(msg => msg.ruleId == '@stylistic/list-style');

        assert.ok(listStyle.length >= 1);
        assert.ok(listStyle.length == messages.filter(msg => msg.ruleId?.startsWith('@stylistic/list-style')).length);
        assert.ok(messages.every(msg => msg.ruleId == '@stylistic/list-style' || msg.ruleId == 'no-unused-vars' || msg.ruleId == '@typescript-eslint/no-unused-vars'));
    });

    it('(f) switch with braced case gives no padding-line message', async () =>
    {
        const messages = await lint('switch(a)\n{\n    case 1:\n    {\n        foo();\n\n        break;\n    }\n}\n', 'a.ts');

        assert.deepEqual(messages.filter(msg => /padding-line-between-statements/.test(msg.ruleId)), []);
    });

    it('(g) lines-between-class-members allows glued getter and setter with the same key', async () =>
    {
        const glued = await lint('class A\n{\n    get a()\n    {\n        return 1;\n    }\n    set a(v)\n    {\n    }\n}\n', 'a.ts');
        const different = await lint('class A\n{\n    get a()\n    {\n        return 1;\n    }\n    set b(v)\n    {\n    }\n}\n', 'a.ts');

        assert.equal(glued.filter(msg => msg.ruleId == 'ressurectit/lines-between-class-members').length, 0);
        assert.equal(different.filter(msg => msg.ruleId == 'ressurectit/lines-between-class-members').length, 1);
    });

    it('(h) documented export const does not require jsdoc, undocumented does', async () =>
    {
        const documented = await lint('/**\n * Value\n */\nexport const A = 1;\n', 'a.ts');
        const undocumented = await lint('export const A = 1;\n', 'a.ts');

        assert.equal(documented.filter(msg => msg.ruleId == 'jsdoc/require-jsdoc').length, 0);
        assert.equal(undocumented.filter(msg => msg.ruleId == 'jsdoc/require-jsdoc').length, 1);
    });
});
