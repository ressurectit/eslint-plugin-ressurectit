# Checks layout of parameters and arguments (argument-layout)

Rule which checks wrapping of parameters and trailing commas in parameter and argument lists.

## Rule Details

 - Constructor with 2 or more parameters must have each parameter on its own line, aligned with the first one.
 - Other function and method declarations (`function`, methods, `declare function`, overload signatures) with more than 2 parameters, that are on a single line longer than `maxLength` (default 120), must be wrapped, 2nd and later parameters aligned with the first one.
 - Wrapped parameter list must end with a trailing comma, except when the last parameter is a rest parameter (`...args`).
 - Trailing comma is forbidden in single-line parameter lists and in all calls (`CallExpression`, `NewExpression`).

Arrow functions and signatures without function body (types, interfaces) are not checked. When a comment is inside the affected range, the problem is reported without autofix.

Examples of **incorrect** code for this rule:

```ts
class A
{
    constructor(private _a: A, private _b: B)
    {
    }
}

function f(a: string,) {}

provideHttpClient(withInterceptorsFromDi(),);
```

Examples of **correct** code for this rule:

```ts
class A
{
    constructor(private _a: A,
                private _b: B,)
    {
    }
}

function f(a: string) {}

function g(a: string,
           ...rest: string[])
{
}

provideHttpClient(withInterceptorsFromDi());
```

## Options

```json
{
    "ressurectit/argument-layout": ["warn", {"maxLength": 120}]
}
```

 - `maxLength` (integer, default `120`) - maximal length of line that contains declaration with more than 2 parameters.

## Fix

`--fix` changes only whitespace and trailing commas. Wrapped parameters are aligned with the first parameter.
