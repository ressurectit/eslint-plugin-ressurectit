# Changelog

## Version 1.0.0 (2026-11-19)

### Features

- new rule `ressurectit/indent` (fork of `@stylistic/indent` with RessurectIT specifics)
- new rule `ressurectit/literal-brace-style`
- `ressurectit/literal-brace-style` allows `return {…} as T` / `satisfies T`, ignores an opener after spread, a prefix unary operator, `return`, `throw` or `yield`
- new rule `ressurectit/switch-case-braces`
- new rule `ressurectit/type-operator-spacing`
- new rule `ressurectit/region-titles`
- new rule `ressurectit/decorator-layout`
- new rule `ressurectit/argument-layout`
- new rule `ressurectit/line-wrapping`
- new rule `ressurectit/angular-metadata`
- new rule `ressurectit/lines-between-class-members`, wrapper of `@stylistic/lines-between-class-members` allowing glued getter and setter with same key
- new rule alias `ressurectit/padding-line-between-statements`
- `recommended` config now includes `eslint-plugin-jsdoc` rules (`multiline-blocks`, `check-alignment`, `require-hyphen-before-param-description`, `require-jsdoc`)
- `recommended` config now enforces blank lines around blocks and before `return`, `throw`, `break`, `continue` and after variable declarations (`padding-line-between-statements`)
- `recommended` config has stricter `@stylistic/keyword-spacing`, `@stylistic/list-style`, `@stylistic/comma-dangle`, `@stylistic/space-infix-ops`, `@stylistic/space-before-function-paren` and `curly`

### BREAKING CHANGES

- minimal supported version of `eslint` is `10.15.0`
- minimal supported version of `@stylistic/eslint-plugin` is `6.0.1`
- minimal supported version of `typescript-eslint` is `8.72.2`
- minimal supported version of `TypeScript` is `6.0.3`
- minimal supported version of `node` is `^22.22.2 || >=24.15.0`
- `@stylistic/indent` is replaced by `ressurectit/indent` in `recommended` config
- `ressurectit/imports-order` uses new import groups
- new dependencies `@eslint/js`, `@typescript-eslint/utils` and `eslint-plugin-jsdoc`
- `recommended` config registers the `jsdoc` plugin (`eslint-plugin-jsdoc`), do not register it again in your configuration

## Version 0.4.0 (2025-06-26)

### Features

- added more rules to `recommended` config

## Version 0.3.0 (2025-01-23)

### Features

- added more rules to `recommended` config

## Version 0.2.1 (2025-01-23)

- fixed github release `0.2.0`

### Features

- now usinig new *flat configuration*
- recommended configuration contains also configuration for `eslint`, `@typescript-eslint` and `@stylistic`

### BREAKING CHANGES

- minimal supported version of `eslint` is `9.18.0`
- minimal supported version of `@typescript-eslint` is `8.21.0`

## Version 0.2.0 (2025-01-23)

### Features

- now usinig new *flat configuration*
- recommended configuration contains also configuration for `eslint`, `@typescript-eslint` and `@stylistic`

### BREAKING CHANGES

- minimal supported version of `eslint` is `9.18.0`
- minimal supported version of `@typescript-eslint` is `8.21.0`

## Version 0.1.0 (2021-06-25)

### Features

- **Rules**
   - added rule `imports-order` which checks whether are imports in correct order
   - added rule `imports-spacing` which checks new lines between imports
- **Configs**
   - added *recommended* config, with recommended set of rules