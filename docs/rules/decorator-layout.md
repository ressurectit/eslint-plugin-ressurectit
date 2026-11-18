# Checks layout of decorators (decorator-layout)

Checks whitespace around JSDoc comments and decorators. Fixable (whitespace only; no fix when a comment is in the affected range for parameter decorators).


## Rule Details

- No blank line between a JSDoc comment and the declaration (or its first decorator) – `blankLineAfterJsdoc`. Import declarations and a file header (first comment of the file with `@fileoverview` or `@file`) are not checked.
- No blank line after a decorator – `blankLineAfterDecorator`.
- Class and member decorators must be on their own line – `decoratorOwnLine`.
- Parameter decorators must be on the same line as the parameter – `parameterDecoratorInline`.

Examples of **incorrect** code for this rule:

```ts
/**
 * Doc
 */

export function f()
{
}

class A
{
    @Input()

    public x: string;

    @Input() public y: string;

    constructor(@Inject(X)
                x: X)
    {
    }
}
```

Examples of **correct** code for this rule:

```ts
/**
 * Doc
 */
export function f()
{
}

class A
{
    @Input()
    public x: string;

    @Input()
    public y: string;

    constructor(@Inject(X) x: X)
    {
    }
}
```

## Options

This rule has no options.
