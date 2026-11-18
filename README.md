[![npm version](https://badge.fury.io/js/eslint-plugin-ressurectit.svg)](https://badge.fury.io/js/eslint-plugin-ressurectit)
[![Build status](https://ci.appveyor.com/api/projects/status/rte0wrgbgsbxhmjf?svg=true)](https://ci.appveyor.com/project/kukjevov/eslint-plugin-ressurectit)
# eslint-plugin-ressurectit

RessurectIT specific ESlint rules

## Installation

You'll first need to install [ESLint](http://eslint.org):

```
$ npm i eslint --save-dev
```

Next, install `eslint-plugin-ressurectit` and `typescript` (peer dependency of `typescript-eslint`):

```
$ npm install eslint-plugin-ressurectit typescript --save-dev
```


## Usage

This plugin uses *flat configuration* (`eslint.config.js`). The `recommended` config already registers the `ressurectit` and `jsdoc` plugins:

```js
import ressurectit from 'eslint-plugin-ressurectit';

export default [...ressurectit.configs.recommended];
```

Rules can be also configured individually:

```js
export default [
    ...ressurectit.configs.recommended,
    {
        rules: {
            'ressurectit/line-wrapping': 'off',
        },
    },
];
```

## Supported Rules

| Rule | Description |
| --- | --- |
| [angular-metadata](docs/rules/angular-metadata.md) | Checks layout and order of Angular decorator metadata |
| [argument-layout](docs/rules/argument-layout.md) | Checks layout of parameters and arguments (wrapping, alignment, trailing comma) |
| [decorator-layout](docs/rules/decorator-layout.md) | Checks placement of decorators and JSDoc blocks |
| [imports-order](docs/rules/imports-order.md) | Checks order of imports |
| [imports-spacing](docs/rules/imports-spacing.md) | Checks new lines between imports |
| [indent](docs/rules/indent.md) | Indentation of code (fork of `@stylistic/indent`) |
| [line-wrapping](docs/rules/line-wrapping.md) | Wraps arguments and explodes literals on over-long lines |
| [lines-between-class-members](docs/rules/lines-between-class-members.md) | Wrapper of [`@stylistic/lines-between-class-members`](https://eslint.style/rules/lines-between-class-members), blank line between class members, glued getter/setter pair is allowed |
| [literal-brace-style](docs/rules/literal-brace-style.md) | Brace style of object and array literals |
| [region-titles](docs/rules/region-titles.md) | Checks format, placement and order of region titles |
| [switch-case-braces](docs/rules/switch-case-braces.md) | Braces of `case` clauses |
| [type-operator-spacing](docs/rules/type-operator-spacing.md) | Spacing around type operators |
| padding-line-between-statements | Alias of [`@stylistic/padding-line-between-statements`](https://eslint.style/rules/padding-line-between-statements), usable under `ressurectit/` prefix with a different configuration |

## Third-party code

`ressurectit/indent` is a fork of `indent` rule from [`@stylistic/eslint-plugin`](https://github.com/eslint-stylistic/eslint-stylistic) (MIT License, Copyright OpenJS Foundation and other contributors, Copyright (c) 2023-PRESENT ESLint Stylistic contributors). Full license notice is kept in forked source files.
