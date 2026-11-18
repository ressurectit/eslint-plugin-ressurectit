# Checks spacing around union and intersection operators in types (type-operator-spacing)

Rule which checks that union (`|`) and intersection (`&`) operators in types are not surrounded by spaces on the same line.


## Rule Details

This rule aims to keep type operators compact, `A|B` and `A&B`, the same way as is common in the codebase.

Only operators of type nodes are checked. Value operators (`a | b`, `a & b`) keep their spaces and are not reported by this rule (see `@stylistic/space-infix-ops`).

Line breaks and indentation are never touched, so multi-line unions with leading pipes are valid.

When the whitespace is adjacent to a comment, the problem is reported without an autofix.

Examples of **incorrect** code for this rule:

```ts
let a: string | number;
type T = A &B;
type X =
    | A
    | B;
```

Examples of **correct** code for this rule:

```ts
let a: string|number;
type T = A&B;
type X =
    |A
    |B;
const x = a | b & c;
```

### Options

There are no options for this rule.

## When Not To Use It

Do not use this rule if your code base prefers spaces around type operators.
