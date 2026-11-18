# Enforces team indentation model (indent)

Rule which checks indentation of TypeScript code according to the RessurectIT team model: Allman braces,
"brace takes owner-line indent", aligned arguments, parameters and conditions.

The rule is a fork of `indent` rule of [`@stylistic/eslint-plugin`](https://eslint.style/rules/indent) 6.0.1
(MIT license), ported to TypeScript and changed to the team model. It replaces `@stylistic/indent`.

The rule is fixable (`--fix` changes only whitespace at the start of lines).


## Rule Details

### A.1 Four spaces per level

Block content is indented by 4 spaces from the line that owns the `{`.

Examples of **incorrect** code for this rule:

```ts
function a()
{
	b();
}
```

Examples of **correct** code for this rule:

```ts
function a()
{
    b();
}
```

### A.2 Opener on its own line takes indentation of its owner line

A `{` or `[` on its own line takes the indentation of its *owner line*, the line that ends with `=`, `key:`,
type annotation `:`, `(`, `=>` or `<T>`. It is not indented by +4. Its content is +4, its closer is aligned
with the opener. Nested single-argument calls collapse to the statement indentation. A type assertion `<T>` or
a spread `...` on its own line in front of the literal is treated as part of the opener.

Examples of **incorrect** code for this rule:

```ts
const x =
    {
        a: 1,
    };

provideSelectOptions(
    {
        placeholder: NOTHING_SELECTED,
    });
```

Examples of **correct** code for this rule:

```ts
const x =
{
    a: 1,
};

provideSelectOptions(
{
    placeholder: NOTHING_SELECTED,
});

const a = btoa(encodeURIComponent(JSON.stringify(
{
    a: 1,
})));

const SUMMARY_TEXTS: SummaryTexts =
{
    pacienti:
    {
        prvy: 'počet ošet. URČ:',
    },
};

data.indikator2 = <HodnotenieIndikator>
{
    urc: getAttr(atributy, i2.nalepkaMosia, i2.indikator ?? ''),
};

const list = Object.keys(groups)
    .map(typZs => (
    {
        typZs,
        data: groups[typZs],
    }));
```

### A.3 Wrapped arguments and parameters align with the first one

Wrapped arguments and parameters align with the first one, that column is the base for everything nested in them.
A wrapped object/array last argument and RxJS `pipe(op1(), op2())` operators also align with the first argument,
the statement-indent variant is reported.

The aligned column becomes the base **only if at least one 2nd-or-later argument starts on its own line**,
otherwise A.2 applies (owner-line indentation). So a single-argument nested call with lambda
(`.pipe(map(result =>\n{`) has its body `{` at the owner-line indent, the inner column (column of `map`) is reported.

Examples of **incorrect** code for this rule:

```ts
function f(response: Observable<number>): Observable<number>
{
    return response.pipe(catchError(error =>
    {
        return throwError(() => error);
    }),
    map(data =>
    {
        return data;
    }));
}

function g(response: Observable<number>): Observable<number>
{
    return response
        .pipe(map(result =>
              {
                  return result;
              }));
}

provideServiceWorker('ngsw-worker.js',
{
    enabled: false,
});
```

Examples of **correct** code for this rule:

```ts
function f(response: Observable<number>): Observable<number>
{
    return response.pipe(catchError(error =>
                         {
                             return throwError(() => error);
                         }),
                         map(data =>
                         {
                             return data;
                         }));
}

provideServiceWorker('ngsw-worker.js',
                     {
                         enabled: false,
                     });

function g(response: Observable<number>): Observable<number>
{
    return response
        .pipe(map(result =>
        {
            return result;
        }));
}

hotkeys.add(new Hotkey('~', () =>
{
    return false;
}, undefined, 'Show console'));

function createUtvarRows(items: MosiaUtvarDetail[]|undefined|null,
                         reorder: boolean,
                         summaryLabel: string): OverviewRow[]
{
    return [];
}
```

### A.4 Member chains

The first `.call()` on a new line is indented by +4 from the line of the chain head, the following ones are aligned
with the previous dot. A chain line may also be exactly +4 deeper than the previous dot (d3 idiom, e.g. after
`.transition()`), the following lines may align with it or return to the chain column. A chain line may also be aligned
with a dot that sits on the chain head line (e.g. `.filter(…)` under `.debugElement` of `return fixture.debugElement.queryAll(…)`). The fix of a wrong chain line
never creates the sub-indent, it moves the line to the nearer of the chain column and the previous dot column (the chain
column on tie).

Examples of **incorrect** code for this rule:

```ts
const body = new HttpParams()
      .append('a', b)
      .append('c', d);

selection
    .transition()
            .attr('y', 0)
    .remove();
```

Examples of **correct** code for this rule:

```ts
const body = new HttpParams()
    .append('a', b)
    .append('c', d);

chart.lineG.selectAll('path')
    .transition()
    .duration(DURATION)
        .attr('opacity', 0)
        .attr('r', 0)
    .remove();

return fixture.debugElement.queryAll(By.directive(Stub))
              .filter(itm => block.contains(itm.nativeElement))
              .map(itm => itm.injector.get(Stub));
```

### A.5 Multi-line conditions

Continuation lines of multi-line `&&`/`||` conditions of `if`, `while` and `do while` are aligned with the first
operand (the column after `if(`). The check is strict, a continuation starting with `!` must not hang left.
Parenthesized multi-line sub groups are aligned the same way inside their parentheses.

Examples of **incorrect** code for this rule:

```ts
if(a ||
    b)
{
}

if(!node.isFirst() ||
    ongoing ||
   !selfNode)
{
    return null;
}
```

Examples of **correct** code for this rule:

```ts
if(isPresent(idUlohy) ||
   isPresent(idProduktu) ||
   isPresent(idBenefit))
{
}

if((skipProdukty && this.prihodaDetail()) ||
   (this.prihodaDetail() && !this.inputDataSvc.produktUuid()))
{
    return true;
}
```

### A.6 Multi-line ternary

Branches of multi-line ternary are indented by +4.

Examples of **incorrect** code for this rule:

```ts
const css = cond ?
        'a' :
        'b';
```

Examples of **correct** code for this rule:

```ts
const css = cond ?
    'a' :
    'b';

this.spravyValue.update(spravy => spravy.map(sprava => sprava.uuid == uuid ?
    {
        ...sprava,
        sprava: updated,
    } :
    sprava));
```

### A.7 Switch

`case` is indented by +4 inside `switch`, the case block `{` is at the same column as `case`.

Examples of **incorrect** code for this rule:

```ts
switch(x)
{
case 1:
{
    break;
}
}
```

Examples of **correct** code for this rule:

```ts
switch(x)
{
    case 1:
    case 2:
    {
        break;
    }
}
```

### A.8 Ignored code

Not checked:

- contents of template literals (only the line where the literal starts is checked),
- a template literal that starts its own line (e.g. after `template:` or `x =`), including its first line,
- comment-only lines,
- import declarations.

Examples of **correct** code for this rule:

```ts
import {a,
        b} from 'x';

const css = `main-menu.env-override
{
    background: ${env.prostredie.bg};
}`;
const config =
{
    template:
        `
    <div></div>
    `,
};
// const old = `main-menu
// {
// }`;
```

### Options

```json
{
    "ressurectit/indent": ["warn", {"size": 4, "ignoredNodes": []}]
}
```

- `size` (integer ≥ 1, default `4`) - number of spaces per indentation level,
- `ignoredNodes` (array of AST selectors, default `[]`) - nodes whose indentation is not checked.

All other settings of the original rule are fixed by the team model (`SwitchCase: 1`, `VariableDeclarator: 'first'`,
`MemberExpression: 1`, parameters and arguments `'first'`, `ignoreComments: true`, ...).

## When Not To Use It

Do not use this rule if your code does not follow the RessurectIT formatting model.

## Credits

This rule is a fork of the `indent` rule of [`@stylistic/eslint-plugin`](https://github.com/eslint-stylistic/eslint-stylistic)
6.0.1, licensed under the MIT license:

- Copyright OpenJS Foundation and other contributors, <www.openjsf.org>
- Copyright (c) 2023-PRESENT ESLint Stylistic contributors

The full MIT notice is kept at the top of every forked source file in `src/rules/indent/`.
