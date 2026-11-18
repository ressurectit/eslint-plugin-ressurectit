# Checks that opening brace/bracket of multi-line literals is on its own line (literal-brace-style)

Rule which requires the opening `{` / `[` of a multi-line object, array, type literal, interface body or enum body to be placed on its own line (Allman style).

## Rule Details

Checked nodes: object literals, array literals, type literals, interface bodies and enum bodies that span more than one line. One-line literals are ignored.

Exceptions:
 - a literal returned directly, `return {` or `return <T>{` (type assertion), may keep the opener on the `return` line. The same applies when the returned literal is followed by a type assertion or a `satisfies` check: `return {…} as T`, `return {…} as unknown as T`, `return […] as T[]`, `return {…} satisfies T`.
 - an opener that directly follows a spread `...` or a prefix unary operator (`!`, `-`, `+`, `~`) is not checked (`...[`, `![`). An opener after a binary operator (`+ [`) is still reported.
 - an opener that directly follows `return`, `throw` or `yield` is not checked (`return […].includes(y)`, `throw {`, `yield {`), a line break there would change the meaning by automatic semicolon insertion.
 - arrow functions returning a multi-line object must use `=> (` at the end of the line and `{` on the next line (message `arrowObjectLayout`). Only this message is reported for such literal.

`--fix` replaces whitespace before the opener with a line break and the indentation of the previous line. No fix is offered when a comment is between the opener and the preceding token.

Examples of **incorrect** code for this rule:

```ts
const x = {
    a: 1,
};

interface A {
    a: string;
}

items.map(x => ({
    kod: x,
}));
```

Examples of **correct** code for this rule:

```ts
const x =
{
    a: 1,
};

interface A
{
    a: string;
}

items.map(x => (
{
    kod: x,
}));

function a()
{
    return {
        a: 1,
    };
}
```

## When Not To Use It

If you prefer K&R style braces for literals.
