/**
 * @fileoverview RessurectIT specific ESlint rules and configs
 * @author kukjevov
 */
import eslint from '@eslint/js';
import stylistic from '@stylistic/eslint-plugin';
import jsdoc from 'eslint-plugin-jsdoc';
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
        stylistic.configs.recommended,
        {
            plugins:
            {
                ressurectit: plugin,
                jsdoc,
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
                '@stylistic/indent': 'off',
                'curly':
                [
                    'warn',
                    'all',
                ],
                '@stylistic/eol-last': 'warn',
                '@stylistic/comma-dangle':
                [
                    'warn',
                    {
                        arrays: 'always-multiline',
                        objects: 'always-multiline',
                        imports: 'always-multiline',
                        exports: 'always-multiline',
                        enums: 'always-multiline',
                        tuples: 'always-multiline',
                        generics: 'ignore',
                        functions: 'ignore',
                    },
                ],
                '@stylistic/space-infix-ops':
                [
                    'warn',
                    {
                        ignoreTypes: true,
                    },
                ],
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
                        asyncArrow: 'always',
                        catch: 'never',
                    },
                ],
                '@stylistic/list-style':
                [
                    'warn',
                    {
                        singleLine:
                        {
                            spacing: 'never',
                        },
                        overrides:
                        {
                            '()': 'off',
                            '<>': 'off',
                            '{}':
                            {
                                singleLine:
                                {
                                    spacing: 'never',
                                },
                            },
                            ImportDeclaration:
                            {
                                singleLine:
                                {
                                    spacing: 'never',
                                },
                                multiLine:
                                {
                                    minItems: Number.MAX_SAFE_INTEGER,
                                },
                            },
                        },
                    },
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
                                after: true,
                            },
                            satisfies:
                            {
                                before: true,
                                after: true,
                            },
                            return:
                            {
                                after: true,
                            },
                            type:
                            {
                                after: true,
                            },
                            case:
                            {
                                after: true,
                            },
                            of:
                            {
                                after: true,
                                before: true,
                            },
                            in:
                            {
                                after: true,
                                before: true,
                            },
                            const:
                            {
                                after: true,
                            },
                            let:
                            {
                                after: true,
                            },
                            new:
                            {
                                after: true,
                            },
                            typeof:
                            {
                                after: true,
                            },
                            instanceof:
                            {
                                after: true,
                                before: true,
                            },
                            await:
                            {
                                after: true,
                            },
                            yield:
                            {
                                after: true,
                            },
                            delete:
                            {
                                after: true,
                            },
                            void:
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
                'ressurectit/indent': 'warn',
                'ressurectit/literal-brace-style': 'warn',
                'ressurectit/switch-case-braces': 'warn',
                'ressurectit/type-operator-spacing': 'warn',
                'ressurectit/region-titles': 'warn',
                'ressurectit/decorator-layout': 'warn',
                'ressurectit/argument-layout': 'warn',
                'ressurectit/line-wrapping': 'warn',
                'ressurectit/angular-metadata': 'warn',
                '@stylistic/padding-line-between-statements':
                [
                    'error',
                    {
                        blankLine: 'always',
                        prev: '*',
                        next: ['if', 'for', 'while', 'do', 'switch', 'try'],
                    },
                    {
                        blankLine: 'always',
                        prev: ['if', 'for', 'while', 'do', 'switch', 'try'],
                        next: '*',
                    },
                    {
                        blankLine: 'always',
                        prev: '*',
                        next: ['return', 'throw', 'break', 'continue'],
                    },
                ],
                'ressurectit/padding-line-between-statements':
                [
                    'warn',
                    {
                        blankLine: 'always',
                        prev: ['const', 'let'],
                        next: '*',
                    },
                    {
                        blankLine: 'any',
                        prev: ['const', 'let'],
                        next: ['const', 'let', 'if', 'for', 'while', 'do', 'switch', 'try', 'return', 'throw', 'break', 'continue'],
                    },
                ],
                'ressurectit/lines-between-class-members':
                [
                    'warn',
                    'always',
                ],
                'jsdoc/multiline-blocks':
                [
                    'warn',
                    {
                        noSingleLineBlocks: true,
                    },
                ],
                'jsdoc/check-alignment': 'warn',
                'jsdoc/require-hyphen-before-param-description':
                [
                    'warn',
                    'always',
                ],
                'jsdoc/require-jsdoc':
                [
                    'warn',
                    {
                        enableFixer: false,
                        require:
                        {
                            FunctionDeclaration: false,
                            ClassDeclaration: false,
                            MethodDefinition: false,
                            ArrowFunctionExpression: false,
                            FunctionExpression: false,
                            ClassExpression: false,
                        },
                        contexts:
                        [
                            'ClassDeclaration',
                            'TSInterfaceDeclaration',
                            'TSTypeAliasDeclaration',
                            'TSEnumDeclaration',
                            'Program > FunctionDeclaration',
                            'Program > ExportNamedDeclaration > FunctionDeclaration',
                            'Program > ExportDefaultDeclaration > FunctionDeclaration',
                            'Program > ExportNamedDeclaration:has(> VariableDeclaration)',
                            "MethodDefinition:not([kind='constructor']):not([kind='set'])",
                            'TSAbstractMethodDefinition',
                            'PropertyDefinition',
                            'TSAbstractPropertyDefinition',
                            'AccessorProperty',
                            'TSInterfaceBody > TSPropertySignature',
                        ],
                    },
                ],
            },
        }
    ],
});

export default plugin;
