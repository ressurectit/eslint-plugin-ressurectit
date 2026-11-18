# Wraps call arguments and explodes one-line literals (line-wrapping)

Rule which wraps arguments of calls and explodes one-line object/array literals when a physical line is too long
or contains too many arguments/properties/elements.


## Rule Details

The rule never reports "line too long" by itself. The length limit only triggers wrapping.

Each physical line is checked independently and gets **at most one report**:

1. **Calls** – a `CallExpression`/`NewExpression` with 2 or more arguments, all of them starting on the line of `(`,
   is a candidate when the line is longer than `maxLength` **or** the call has more than `maxItems` arguments.
   The leftmost **outermost** candidate call on the line is reported (`wrapArguments`).
2. **Literals** – only if no call qualifies: a non-empty object/array value literal that starts and ends on the line
   is a candidate when the line is longer than `maxLength` **or** the literal has more than `maxItems`
   properties/elements. The leftmost **outermost** candidate literal on the line is reported (`explodeLiteral`).
3. Otherwise (e.g. a long string) nothing is reported.

Ignored:

- calls with a single argument (`fn(x =>` stays as is),
- type literals (`let x: {a: string; …}`) and destructuring patterns (`const {a, b} = obj;`),
- literals whose opener directly follows a spread `...` or a prefix unary operator (`...[`, `![`), the opener cannot be moved off the operator,
- anything inside template literals, `import` declarations and `export … from` / `export {…}` lists.

### Autofix

- `wrapArguments` – 2nd and following arguments are put on new lines aligned with the first argument, no trailing comma is added.
- `explodeLiteral` – the opener is put on its own line at the indentation of the line, each property/element on its own
  line indented by 4 spaces, a trailing comma is added and the closer is put at the indentation of the line.
  - `return {`, `return [` and `return <T>{` keep the opener on the `return` line.
  - The opener is never moved off a `return`, `yield` or `throw` line (e.g. `return [...].map(...)`, `return {...} as T`), because ASI would change the behaviour.
  - arrow body `=> ({…})` becomes `=> (\n{`.
- No fix is provided when the affected range contains a comment.

Examples of **incorrect** code for this rule:

```ts
fn(a, b, c, d, e, f);

const o = {a: 1, b: 2, c: 3, d: 4, e: 5, f: 6};

const filter = createMosiaProduktyFilter(mosiaId, data, nalepka, this._dateApi, this._settingsService, {stav: ['AKCEPTOVANE'], povod: ['ZPIS']});

const restRows: OverviewRow[] = items.filter(itm => !itm.sumarny).map(data => ({data, i1, i2, label: null, indent: true}));
```

Examples of **correct** code for this rule:

```ts
fn(a,
   b,
   c,
   d,
   e,
   f);

const o =
{
    a: 1,
    b: 2,
    c: 3,
    d: 4,
    e: 5,
    f: 6,
};

const filter = createMosiaProduktyFilter(mosiaId,
                                         data,
                                         nalepka,
                                         this._dateApi,
                                         this._settingsService,
                                         {stav: ['AKCEPTOVANE'], povod: ['ZPIS']});

const restRows: OverviewRow[] = items.filter(itm => !itm.sumarny).map(data => (
{
    data,
    i1,
    i2,
    label: null,
    indent: true,
}));
```

### Options

```json
{
    "ressurectit/line-wrapping": ["warn", {"maxLength": 120, "maxItems": 5}]
}
```

- `maxLength` (integer, default `120`) – lines longer than this (measured on the physical line) trigger wrapping.
- `maxItems` (integer, default `5`) – calls with more arguments and literals with more properties/elements trigger wrapping regardless of line length.

## When Not To Use It

Do not use this rule if you do not want long lines or crowded calls/literals to be wrapped.
