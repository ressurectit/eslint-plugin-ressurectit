# Checks switch case bodies are blocks on the next line (switch-case-braces)

Rule which checks the layout of `case` and `default` clauses of `switch` statements.


## Rule Details

This rule aims to keep the body of every `case` / `default` clause a single block, placed on the line after the colon,
and to keep the clauses separated without blank lines.

Rules applied:
 - an empty body is allowed (fall-through of several `case` labels sharing one block);
 - otherwise the body must be exactly one block statement, reported without a fix (wrapping statements into a block changes scoping);
 - the `{` of the block must be the first token on a line after the colon (fixed by moving the block to the next line with the indentation of `case`);
 - for a non-last clause with a block body, the `}` and the next `case` / `default` must not be separated by a blank line (fixed by removing the blank lines).

When the affected range contains a comment, the problem is reported without a fix.

Examples of **incorrect** code for this rule:

```js
switch(value)
{
    case 1:
        foo();
        break;

    case 2: {
        break;
    }
    case 3:
    {
        break;
    }

    default:
    {
    }
}
```

Examples of **correct** code for this rule:

```js
switch(value)
{
    case 'X':
    case 'NEHODNOTENE':
    {
        return 'weight-x';
    }
    case '-1':
    {
        return 'weight-down';
    }
    case 3:
    {
        break;
    }
    default:
    {
    }
}
```

### Options

There are no options for this rule.

## When Not To Use It

Do not use this rule if you prefer `case` bodies without blocks or with blank lines between clauses.
