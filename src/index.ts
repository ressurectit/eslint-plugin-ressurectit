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
                '@typescript-eslint/no-empty-function': 'off',
                '@typescript-eslint/no-unused-vars': 'off',
                '@typescript-eslint/no-inferrable-types': 'off',
                '@typescript-eslint/ban-ts-comment': 'off',
                'ressurectit/imports-order': 'error',
                'ressurectit/imports-spacing': 'warn',
            },
        }
    ],
});

export default plugin;
