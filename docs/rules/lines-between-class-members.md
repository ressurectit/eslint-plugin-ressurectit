# Requires blank line between class members (lines-between-class-members)

Thin wrapper around `@stylistic/lines-between-class-members`, it accepts same options and reports same problems.


## Rule Details

Only difference is, that a getter directly followed by a setter with the same key (same `static` and `computed` modifiers) is allowed to be glued.

Examples of **correct** code for this rule:

```ts
class A
{
    get value()
    {
        return this._value;
    }
    set value(value)
    {
        this._value = value;
    }
}
```

Examples of **incorrect** code for this rule:

```ts
class A
{
    get value()
    {
        return this._value;
    }
    set other(value)
    {
        this._other = value;
    }
}
```
