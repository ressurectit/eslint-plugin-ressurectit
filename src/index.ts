/**
 * @fileoverview RessurectIT specific ESlint rules and configs
 * @author kukjevov
 */
import eslint from '@eslint/js';
import stylistic from '@stylistic/eslint-plugin'
import tseslint from 'typescript-eslint';

import meta from './meta/index.js';
import rules from './rules/index.js';

const plugin =
{
    meta,
    rules,
    configs: {},
};

Object.assign(plugin.configs,
{
    recommended:
    [
        eslint.configs.recommended,
        ...tseslint.configs.recommended,
        stylistic.configs['recommended-flat'],
        {
            plugins:
            {
                ressurectit: plugin,
            },
            rules:
            {
                'indent': 'off',
                'semi': 'off',
                'brace-style': 'off',
                'linebreak-style': 'off',
                'quotes': 'off',
                '@stylistic/semi':
                [
                    'error',
                    'always',
                ],
                '@stylistic/brace-style':
                [
                    'error',
                    'allman',
                    {
                        'allowSingleLine': true,
                    },
                ],
                '@stylistic/linebreak-style':
                [
                    'error',
                    'unix',
                ],
                '@stylistic/quotes':
                [
                    'error',
                    'single',
                ],
                '@stylistic/indent': 
                [
                    'warn',
                    4,
                    {
                        'VariableDeclarator': 'first',
                        'FunctionDeclaration':
                        {
                            'parameters': 'first'
                        },
                        'FunctionExpression':
                        {
                            'parameters': 'first'
                        },
                        'CallExpression':
                        {
                            'arguments': 'first'
                        },
                        'ArrayExpression': 'first',
                        'ImportDeclaration': 'first'
                    }
                ],
                '@stylistic/eol-last': 'warn',
                '@stylistic/comma-dangle': 'warn',
                '@stylistic/space-infix-ops': 'off',
                '@stylistic/spaced-comment': 'off',
                '@stylistic/lines-between-class-members': 'off',
                '@stylistic/indent-binary-ops': 'off',
                '@stylistic/no-floating-decimal': 'off',
                '@stylistic/arrow-parens':
                [
                    'warn',
                    'as-needed',
                ],
                '@stylistic/space-before-function-paren':
                [
                    'warn',
                    {
                        anonymous: 'never',
                        named: 'never',
                    },
                ],
                '@stylistic/object-curly-spacing':
                [
                    'warn',
                    'never',
                ],
                '@stylistic/block-spacing':
                [
                    'warn',
                    'never',
                ],
                '@stylistic/keyword-spacing':
                [
                    'warn',
                    {
                        before: false,
                        after: false,
                        overrides:
                        {
                            import:
                            {
                                after: true,
                            },
                            export:
                            {
                                after: true,
                            },
                            from:
                            {
                                before: true,
                                after: true,
                            },
                            extends:
                            {
                                before: true,
                            },
                            as:
                            {
                                before: true,
                            },
                            return:
                            {
                                after: true,
                            },
                            type:
                            {
                                after: true,
                            },
                        },
                    },
                ],
                '@stylistic/member-delimiter-style':
                [
                    'warn',
                    {
                        multiline:
                        {
                            delimiter: 'semi',
                            requireLast: true,
                        },
                        singleline:
                        {
                            delimiter: 'semi',
                            requireLast: false,
                        },
                    },
                ],
                '@stylistic/operator-linebreak':
                [
                    'warn',
                    'after',
                ],
                '@typescript-eslint/no-unsafe-function-type': 'warn',
                '@typescript-eslint/no-explicit-any': 'warn',
                '@typescript-eslint/no-empty-function': 'off',
                '@typescript-eslint/no-unused-vars': 'off',
                '@typescript-eslint/no-inferrable-types': 'off',
                '@typescript-eslint/ban-ts-comment': 'off',
                '@typescript-eslint/no-empty-object-type': 'off',
                'ressurectit/imports-order': 'error',
                'ressurectit/imports-spacing': 'warn',
            },
        }
    ],
});

export default plugin;
