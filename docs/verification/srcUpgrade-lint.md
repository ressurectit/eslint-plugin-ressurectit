# srcUpgrade lint baseline and 1.0.0 verification

Snapshot: commit `b742834` of `chiroptera-trachops` (`srcUpgrade/app`, extracted read-only via `git archive` to `/tmp/srcUpgrade-b742834/srcUpgrade/app`).
661 files, 109 of them `*.spec.ts`.

Harness: `/tmp/lint-check/eslint.config.js` spreads `configs.recommended` of the built plugin (`lib/`) for `**/*.ts`,
run through the `ESLint` API (`lintFiles(['app/**/*.ts'])`) from the snapshot directory. Nothing is written into `chiroptera-trachops`.

- Baseline: plugin lib build of commit 1d911d6 (0.x config on eslint 10 / @stylistic 6).
- 1.0.0: plugin lib build of branch `1.0` after the final review fix wave (commits up to `INT: line-wrapping skips literals after spread or prefix unary operator`).

Historical spec baseline: 3681 messages, 3413 `@stylistic/indent` (measured with plugin 0.4.0, @stylistic 5.10, eslint 9).

## Per-rule counts

| rule | baseline src | baseline spec | baseline total | 1.0.0 src | 1.0.0 spec | 1.0.0 total |
|---|---|---|---|---|---|---|
| jsdoc/require-jsdoc | 0 | 0 | 0 | 1787 | 457 | 2244 |
| ressurectit/indent | 0 | 0 | 0 | 667 | 779 | 1446 |
| ressurectit/line-wrapping | 0 | 0 | 0 | 111 | 536 | 647 |
| @stylistic/keyword-spacing | 61 | 410 | 471 | 2 | 208 | 210 |
| @stylistic/list-style | 776 | 526 | 1302 | 8 | 129 | 137 |
| ressurectit/argument-layout | 0 | 0 | 0 | 107 | 9 | 116 |
| @typescript-eslint/no-explicit-any | 40 | 74 | 114 | 40 | 74 | 114 |
| jsdoc/require-hyphen-before-param-description | 0 | 0 | 0 | 83 | 1 | 84 |
| ressurectit/region-titles | 0 | 0 | 0 | 79 | 0 | 79 |
| @stylistic/member-delimiter-style | 6 | 64 | 70 | 6 | 64 | 70 |
| ressurectit/padding-line-between-statements | 0 | 0 | 0 | 15 | 35 | 50 |
| @stylistic/eol-last | 44 | 0 | 44 | 44 | 0 | 44 |
| ressurectit/angular-metadata | 0 | 0 | 0 | 23 | 19 | 42 |
| ressurectit/literal-brace-style | 0 | 0 | 0 | 18 | 23 | 41 |
| @stylistic/comma-dangle | 77 | 0 | 77 | 32 | 0 | 32 |
| ressurectit/type-operator-spacing | 0 | 0 | 0 | 22 | 8 | 30 |
| ressurectit/lines-between-class-members | 0 | 0 | 0 | 24 | 2 | 26 |
| @stylistic/no-trailing-spaces | 21 | 0 | 21 | 21 | 0 | 21 |
| @stylistic/block-spacing | 0 | 8 | 8 | 0 | 8 | 8 |
| @stylistic/space-before-blocks | 4 | 0 | 4 | 4 | 0 | 4 |
| @stylistic/padding-line-between-statements | 0 | 0 | 0 | 4 | 0 | 4 |
| ressurectit/imports-spacing | 1 | 2 | 3 | 1 | 2 | 3 |
| @typescript-eslint/no-unsafe-function-type | 3 | 0 | 3 | 3 | 0 | 3 |
| @stylistic/space-before-function-paren | 6 | 0 | 6 | 1 | 1 | 2 |
| @stylistic/operator-linebreak | 0 | 2 | 2 | 0 | 2 | 2 |
| (null: unused eslint-disable directive) | 2 | 0 | 2 | 2 | 0 | 2 |
| ressurectit/decorator-layout | 0 | 0 | 0 | 2 | 0 | 2 |
| @typescript-eslint/no-unused-expressions | 1 | 0 | 1 | 1 | 0 | 1 |
| no-useless-assignment | 1 | 0 | 1 | 1 | 0 | 1 |
| @stylistic/no-multi-spaces | 1 | 0 | 1 | 1 | 0 | 1 |
| ressurectit/imports-order | 0 | 0 | 0 | 0 | 1 | 1 |
| curly | 0 | 0 | 0 | 1 | 0 | 1 |
| jsdoc/check-alignment | 0 | 0 | 0 | 1 | 0 | 1 |
| @stylistic/indent | 5298 | 3454 | 8752 | 0 | 0 | 0 |
| **total** | 6342 | 4540 | 10882 | 3111 | 2358 | 5469 |

1.0.0: 5469 messages in 340 files, no fatal / parsing messages, no rule crashes.

## What the remaining hits are

Triage: every hit was reviewed for rules with 30 or fewer hits; for larger rules a random sample of 30 plus every file with
more than 20 hits. `ressurectit/indent` was reviewed per *run* (consecutive misaligned lines with the same offset = one
construct): all 199 runs were classified.

- **jsdoc/require-jsdoc: 2244**, all genuine (§I): missing JSDoc on interface members and types (1701 in `*.interface.ts` files, 1613 of them in `services/api/`,
  684 alone in `jubulaWs.interface.ts`), class members of spec stubs, exported type aliases, undocumented exported consts (23), classes and interfaces
  declared inside `describe`/`it` (§I exempts only nested *functions*). The previous run (2301) also contained 57 false positives on
  *documented* `export const` (the JSDoc sits before `export`, the context matched the inner `VariableDeclaration`); fixed in the final review.
- **ressurectit/indent: 1446** (195 constructs), all genuine:
  - 80 constructs / 642 hits: wrapped last object argument at statement indent (`open(Cmp,\n{`, `overrideComponent(X,\n{`, `toHaveBeenCalledWith(X,\n{`), owner decision A.3;
  - 8 / 262: RxJS `pipe(op1(x =>\n{ … }),\nop2(…))` operators at statement indent (`services/api/*.service.ts` response transforms), A.3 "statement-indent variant is reported";
  - 65 / 335: `{`/`[` on its own line indented +4 instead of owner-line indent, after `=` or `(` (`const stub =\n    {`, `configureTestingModule(\n    {`, `@Component(\n    {`), A.2;
  - 4 / 22: `key:\n{` opener at a wrong column, A.2; 14 / 33: wrapped arguments / parameters / closers not aligned with the first one, A.3 / F.1;
  - 4 / 24: `=>\n({` (also reported by `literal-brace-style`, B.3; the fix converges to `=> (\n{`);
  - rest: single-argument nested lambdas `form(linkedSignal(() =>\n{` at the inner column (owner decision A.8), `&&`/`||` continuations off by one (A.5),
    3-space / 1-space misalignments, a nested braceless `for`, a `TestBed.overrideComponent` at column 0, `rxResource({` objects at a deep column.
- **ressurectit/line-wrapping: 647**, genuine (§B.4, §F.3): one-line literals with more than 5 properties/elements (mostly spec data),
  lines over 120 characters (outermost multi-argument call wrapped first). A literal whose opener follows a spread or prefix unary
  operator is no longer a candidate (the explode was partial, `hospArg.component.ts:229` `![…].includes(…)` is now silent). Note: for a call that is a member of a chain the report
  sits on the line where the chain starts (`statConfig.component.spec.ts:32`), the over-long line is the next one.
- **@stylistic/keyword-spacing: 210**, genuine (§K): `const{cmp} =` (200, spec files), `as{…}`, `of[…]`, `]of`, `for (`.
- **@stylistic/list-style: 137**, genuine (§B.4 "all or nothing"): partially exploded value arrays/objects with several items per line
  (`ALL_PERMISSIONS` lists, `imports: [A, B, C,\n D, E]` of spec testing modules, `forkJoin([of(data),\n …])`). No hit on imports.
- **ressurectit/argument-layout: 116**, genuine (§F): missing trailing comma of wrapped declarations (70, incl. REST methods with
  parameter decorators), forbidden trailing comma in single-line constructors / calls (18), declarations over 120 characters (26), one-line constructors with ≥ 2 parameters (2).
- **@typescript-eslint/no-explicit-any: 114**, unchanged from baseline (not a formatting rule).
- **ressurectit/region-titles: 79**, genuine (§E): order violations (`models` before `inputs`, `protected properties - overrides` before `template bindings`, …),
  unknown names (`constructors`, `private properties`, typos), legacy names, missing blank line after a title.
- **jsdoc/require-hyphen-before-param-description: 84**, genuine (§I): `@param name description` without hyphen.
- **@stylistic/member-delimiter-style: 70**, unchanged: `,` delimiters in type literals (`{a: X, b: Y}`).
- **ressurectit/padding-line-between-statements: 50**, genuine (§H.3): statement directly after a `const`/`let` group.
- **@stylistic/eol-last: 44**, **@stylistic/no-trailing-spaces: 21**, unchanged, genuine.
- **ressurectit/angular-metadata: 42**, genuine (§G): arrays not sorted ascending by length (80 of 97 arrays in the project are ascending),
  one-line `imports`/`providers`, one-line `@Component({…})` stubs, property order (`exportAs` before `providers`, `host` after `imports`).
- **ressurectit/literal-brace-style: 41**, genuine (§B.1, §B.3): `expect(x).toEqual({`, `it.each([`, `const value: T = {`, `useFactory: () => ({`, `=>\n({`.
- **@stylistic/comma-dangle: 32**, genuine: missing trailing comma in multi-line literals.
- **ressurectit/type-operator-spacing: 30**, genuine (§D): `A | null`, `A & {…}`, `A &\n B |` in decorator signatures.
- **ressurectit/lines-between-class-members: 26**, genuine (§H): property lists without blank lines (`barbastella.model.ts`, `nczi.interface.ts` class, spec stub).
- **@stylistic/block-spacing: 8**, `{ return {permissions}; }` getters in spec files; **@stylistic/space-before-blocks: 4**, `function(){}` in `server.pollyfils.ts`.
- **@stylistic/padding-line-between-statements: 4**, genuine (§H.1–2), including a stray `;` after an `if` block (`drgEdit.component.ts:286`).
- **small rest**, all genuine: `imports-spacing` 3 (blank line inside import block), `space-before-function-paren` 2 (`catch (e)`),
  `operator-linebreak` 2 (`?`/`:` at line start), `decorator-layout` 2 (blank line between JSDoc and function), `imports-order` 1,
  `curly` 1 (nested braceless `for`), `jsdoc/check-alignment` 1, `no-multi-spaces` 1; 2 unused `eslint-disable` directives (code is now valid); 
  `no-unsafe-function-type` 3, `no-unused-expressions` 1, `no-useless-assignment` 1 are not formatting rules.

`@stylistic/indent` no longer appears. `@stylistic/list-style` still appears (137), only on partially exploded value literals, see above.

## Owner decisions (Task 14)

1. A.4: a chain line may also be aligned with a dot that sits on the chain head line. Resolved 7 indent hits:
   `app/boot/app.providers.ts:213,215` (`.writeTo(cfg => cfg.writeTo(ConsoleComponentSink)` ⏎ `.minimumLevel(…)` under the inner `.writeTo`),
   `drgEdit.component.spec.ts:346-347`, `drgVariant.component.spec.ts:239-240`, `hospTitle.component.spec.ts:140`
   (`return fixture.debugElement.queryAll(…)` ⏎ `.filter(…)` under `.debugElement`). The fix of a wrong chain line is unchanged.
2. E.2: any title (known or unknown) directly followed by a constructor skips the "blank line after" check, so `constructors` ⏎ `constructor(`
   reports only the unknown name. Resolved 6 region-titles hits: `userSettings.component.ts:98`, `vahaTag.component.ts:108`,
   `neschvaleneRozhodnutie.component.ts:80`, `staticDateTimeInput.directive.ts:93`, `basePrehladComponent.ts:84`, `baseSignalsPrehladComponent.ts:112`.

## Fixes made during verification (Task 14)

- `literal-brace-style` reported `return {…} as T;` / `return […] as T[];` / `as unknown as T` (33 hits): exempt like `return <T>{` (B.2).
  Its fix would also have put a line break after `return` (ASI, parse error); the fix now never breaks a line after `return`/`throw`/`yield`.
- `literal-brace-style` reported an opener directly after a spread or prefix unary operator (`...[`, `![`); the fix fought with
  `rest-spread-spacing` / `space-unary-ops` (circular fixes in 2 files). The rule is now silent there.

## Fixes made during final review

- `jsdoc/require-jsdoc` context for exported consts is `Program > ExportNamedDeclaration:has(> VariableDeclaration)`, so the JSDoc before
  `export const` is found (57 false positives removed).
- `decorator-layout` ignores import declarations and a `@fileoverview` / `@file` header comment followed by a blank line (no hit in the snapshot).
- `literal-brace-style` is silent on an opener directly after `return`, `throw` or `yield` when the literal is not the direct return
  argument (no fix possible, e.g. `return […].includes(y)` after a `line-wrapping` explode). No change in the snapshot count.
- `line-wrapping` skips literals after a spread or prefix unary operator (shared `followsOperator` helper in `src/utils`), 1 hit less.

## Fix safety

`--fix` run in memory (`ESLint` API, `fix: true`) on all 661 snapshot files: 286 files changed (re-run after the final review fixes, identical results).

- Every output parses with the typescript-eslint parser; re-lint has no fatal messages and no fixable message left; a second
  `--fix` pass changes nothing (converged); no circular-fix warning.
- AST (without locations) is identical before and after for all files except 17. With `angular-metadata`, `imports-order` and `curly`
  disabled, all 280 changed files keep an identical AST. The 17 differences are: 15 decorator-array sorts (G.3, token multiset identical),
  1 import reorder by `imports-order` (pre-existing fixer, token multiset identical), 1 `curly` brace insertion around a nested `for` (`misc/utils.ts`).
- Comments: changed only by `jsdoc/require-hyphen-before-param-description` (inserted `- `) and by removal of the 2 unused `eslint-disable` directives.
