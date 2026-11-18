# eslint-plugin-ressurectit 1.0.0 – Team Formatting Rules Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the `recommended` config of `eslint-plugin-ressurectit` enforce the team's TypeScript formatting style (spec §5 A–K) precisely enough that `chiroptera-trachops/srcUpgrade/app` only shows real deviations, and release it as 1.0.0.

**Architecture:** Nine new custom rules plus a fixed `imports-order` live in `src/rules/` (one file per rule, the indent fork in `src/rules/indent/`). Each rule task owns its rule file, its test file and its docs page. A late wiring task registers all rules and builds the `recommended` flat config. A final task lints a frozen snapshot of `srcUpgrade/app` read-only and tunes away false positives.

**Tech Stack:** TypeScript 6.0.3 (ESM, `tsc` → `lib/`), ESLint 10.15 + `RuleTester`, `@typescript-eslint/utils` 8.72.2 (`ESLintUtils.RuleCreator`, `ASTUtils`, `TSESTree`), `@stylistic/eslint-plugin` 6.0.1, `typescript-eslint` parser, `eslint-plugin-jsdoc` (latest), `node:test`.

**Spec:** `docs/superpowers/specs/2026-11-18-formatting-rules-design.md`. Executors read it together with this plan. Section references below, for example "A.3", point into spec §5.

## Global Constraints

- Dependencies are already upgraded and committed in Task 1: eslint `10.15.0`, `@stylistic/eslint-plugin` `6.0.1`, `typescript-eslint` / `@typescript-eslint/types` `8.72.2`, typescript `6.0.3` (7.x is unsupported by typescript-eslint), `@eslint/js` `10.0.1`. `engines.node` is `^22.22.2 || >=24.15.0` (owner decision: Node 20 dropped, it is EOL; required by latest `eslint-plugin-jsdoc` 65.x).
- New dependency: `eslint-plugin-jsdoc` (latest). Pin it exactly in devDependencies and as `>=` in dependencies. Do not add any other runtime dependency except `@typescript-eslint/utils` (Task 13).
- ESM, TypeScript sources in `src/`, built by `tsc` to `lib/`. Imports use `.js` suffixes. Code style of the plugin itself:
  - Allman braces, 4 spaces, single quotes, semicolons;
  - JSDoc on every function and member;
  - files start with a `@fileoverview` header like `src/rules/imports-order.ts`.
- Release is **1.0.0** (breaking). Update `changelog.md`, `docs/rules/*.md` and `README.md`.
- Code copied from `@stylistic/eslint-plugin` (MIT) keeps its full MIT notice at the top of every forked file:
  - "Copyright OpenJS Foundation and other contributors, <www.openjsf.org>"
  - "Copyright (c) 2023-PRESENT ESLint Stylistic contributors"
  - the MIT permission text from `node_modules/@stylistic/eslint-plugin/LICENSE`.
- `~/git/chiroptera-trachops` is **read-only**. Its working tree is being edited concurrently, so all line references point to commit **`b742834`**. Read a snippet with `git -C ~/git/chiroptera-trachops show b742834:srcUpgrade/app/<path> | sed -n 'A,Bp'`. Lint only the frozen snapshot `/tmp/srcUpgrade-b742834/srcUpgrade/app` (created in Task 1).
- Not in scope:
  - no check of `//` comment spacing (`spaced-comment` stays off);
  - no alphabetical import sorting;
  - no `max-len`. The 120-character limit only triggers wrapping (B.4, F.2, F.3) and is measured on the physical line.
- Anti-goals:
  - A rule that cannot be precise on a construct must stay silent on it.
  - `--fix` may change only whitespace, punctuation (commas, parentheses placement) and the order of Angular decorator arrays (G.3).
  - When the affected range contains a comment, report the problem without a fix.
- Severities in `recommended`:
  - `error`: blank-line rules H.1 and H.2, and `ressurectit/imports-order`.
  - `warn`: H.3, all JSDoc rules, the 120-char wrapping rules (`ressurectit/line-wrapping`, `ressurectit/argument-layout`), and every other formatting rule added or changed here.
  - Existing `error` entries (`semi`, `brace-style`, `linebreak-style`, `quotes`) stay `error`.
- Rule names, file paths, message ids and option schemas in this plan are fixed. Neighbouring tasks rely on them.
- House rules:
  - no python (use node or bash);
  - no destructive commands (`rm`, `git reset --hard`, …) without the owner's confirmation;
  - no secrets in code.

## Review Focus

1. **Fall-through `case` labels** (`case 'X':` directly followed by `case 'Y':` and then `{`, as in `pipes/vahaHodnotaCss/vahaHodnotaCss.pipe.ts:23-27`). Neither `switch-case-braces` nor `indent` may report them. Tests: Task 6 and Task 4.
2. **Rest parameter last in a wrapped declaration.** A trailing comma after `...rest` is a syntax error, so `argument-layout` must not require one, and its wrap fix must not add one. Test: Task 10.
3. **Getter/setter pair.** A setter right after its documented getter (`directives/staticDateTimeInput/staticDateTimeInput.directive.ts:37-62`) must not get a missing-JSDoc warning. Test: Task 13.
4. **A decorator named `Component`/`Directive`/`Injectable` that is not imported from `@angular/core`** (another library, or a local function). `angular-metadata` must stay silent on it. Test: Task 12.
5. **Comments inside the range a fix rewrites.** This covers literal explode, argument wrap, decorator-array sort and brace move. The rule still reports but returns no fix (`output: null`). Tests: Tasks 5, 11, 12.

---

## File Structure

| Path | Responsibility | Task |
|---|---|---|
| `docs/verification/srcUpgrade-lint.md` | per-rule message counts: baseline (T1), final (T14), classification notes | 1, 14 |
| `package.json` | `test` script (T2); deps/engines (T13) | 2, 13 |
| `tests/helpers/ruleTester.js` | shared `RuleTester` wired to `node:test` + `dedent()` | 2 |
| `tests/rules/<rule>.test.js` | one test file per rule (ESM JS, imports `../../lib/rules/<rule>.js`) | 2–12 |
| `src/rules/imports-order.ts` (+ `docs/rules/imports-order.md`) | J: new group order, package-segment matching | 2 |
| `src/rules/indent/{index,handlers,offsetStorage,utils}.ts` | A: fork of `@stylistic/indent` | 3, 4 |
| `src/rules/literal-brace-style.ts` | B.1–B.3 | 5 |
| `src/rules/switch-case-braces.ts` | C | 6 |
| `src/rules/type-operator-spacing.ts` | D | 7 |
| `src/rules/region-titles.ts` | E | 8 |
| `src/rules/decorator-layout.ts` | G.5 + "no blank line between JSDoc / decorators / member" (H) | 9 |
| `src/rules/argument-layout.ts` | F.1, F.2, F.4 | 10 |
| `src/rules/line-wrapping.ts` | F.3, B.4, the one-report-per-line arbitration | 11 |
| `src/rules/angular-metadata.ts` | G.1–G.4 | 12 |
| `src/rules/linesBetweenClassMembers.ts` | wrapper of stylistic `lines-between-class-members` allowing glued getter/setter pair (H) | 13 |
| `docs/rules/<rule>.md` | rule documentation, same layout as `docs/rules/imports-order.md` | with each rule |
| `src/rules/index.ts`, `src/index.ts`, `README.md`, `changelog.md`, `tests/config.test.js`, `tests/fixtures/*.ts` | registry, `ressurectit/padding-line-between-statements` alias, `recommended` config (I, K, H), docs | 13 |

**Execution order and parallelism**

- Task 1 → Task 2 run sequentially.
- **Parallel group P** starts after Task 2: Tasks 3→4 (one chain, same files), 5, 6, 7, 8, 9, 10, 11 and 12. Their file sets do not overlap. None of them touches `src/rules/index.ts`, `src/index.ts` or `package.json`.
  - Run each P task in its own git worktree branched from the Task 2 commit (superpowers:using-git-worktrees). Symlink `node_modules` from the main checkout.
  - Merge order does not matter.
  - A compile error in one parallel task must not block the others. That is why the tasks use separate worktrees.
- Task 13 starts after all P tasks are merged. Task 14 runs last.

---

### Task 1: Commit the dependency upgrade and record the lint baseline

**Files:**
- Commit (as-is): `package.json`, `package-lock.json`, `tsconfig.json`, `src/index.ts`, `src/rules/imports-order.ts`, `src/rules/imports-spacing.ts`, `src/utils/createRule.ts`
- Create: `docs/verification/srcUpgrade-lint.md`

**Interfaces:**
- Produces:
  - the snapshot directory `/tmp/srcUpgrade-b742834/srcUpgrade/app`;
  - the lint harness `/tmp/lint-check/eslint.config.js`. Its content is `import p from '/home/kukko/git/eslint-plugin-ressurectit/lib/index.js'; export default [...p.configs.recommended];`. It is used again in Tasks 3 and 14.
  - the baseline table in `docs/verification/srcUpgrade-lint.md`.

- [ ] **Step 1: Verify the build.** Run `npm run build`. Expected: exit 0, no output from `tsc`.
- [ ] **Step 2: Commit the upgrade.**
  ```bash
  git add package.json package-lock.json tsconfig.json src/index.ts src/rules/imports-order.ts src/rules/imports-spacing.ts src/utils/createRule.ts
  git commit -m "INT: upgraded eslint 10, @stylistic 6, typescript-eslint 8.72, typescript 6"
  ```
- [ ] **Step 3: Create the snapshot (read-only for the reference repo).**
  ```bash
  mkdir -p /tmp/srcUpgrade-b742834 && git -C ~/git/chiroptera-trachops archive b742834 srcUpgrade/app | tar -x -C /tmp/srcUpgrade-b742834
  ```
- [ ] **Step 4: Run the baseline lint.**
  - Write `/tmp/lint-check/eslint.config.js` as described in Interfaces.
  - From `/tmp/srcUpgrade-b742834/srcUpgrade`, run `/home/kukko/git/eslint-plugin-ressurectit/node_modules/.bin/eslint --config /tmp/lint-check/eslint.config.js --format json "app/**/*.ts" > /tmp/lint-check/baseline.json`.
  - Count the messages per `ruleId` with a short `node -e` script, separately for `*.spec.ts` and other files.
  - Expected: roughly 10.9k messages in 663 files. On the live tree on 2026-11-18 the counts were `@stylistic/indent` 8752, `@stylistic/list-style` 1303, `@stylistic/keyword-spacing` 471, `no-explicit-any` 114, `comma-dangle` 77.
- [ ] **Step 5: Write the table.** Write `docs/verification/srcUpgrade-lint.md` with:
  - a header that names the snapshot commit `b742834`;
  - the spec's historical baseline (3681 messages, 3413 `@stylistic/indent`, measured with plugin 0.4.0, stylistic 5.10 and eslint 9);
  - the per-rule table from Step 4 (columns `rule | src | spec | total`).
- [ ] **Step 6: Commit.** `git add docs/verification/srcUpgrade-lint.md && git commit -m "INT: recorded lint baseline of srcUpgrade"`

---

### Task 2: Test harness, `imports-order` fix (J), real tests for `imports-spacing`

**Files:**
- Move and rewrite: `git mv tests/lib/rules/imports-order.js tests/rules/imports-order.test.js` and `git mv tests/lib/rules/imports-spacing.js tests/rules/imports-spacing.test.js`. This replaces the CJS stubs and is not destructive.
- Create: `tests/helpers/ruleTester.js`
- Modify: `package.json` (`scripts.test` only), `src/rules/imports-order.ts`, `docs/rules/imports-order.md`

**Interfaces:**
- Produces, for every later task:
  - `tests/helpers/ruleTester.js` exports `ruleTester` and `dedent(text: string): string`.
    - `ruleTester` is an ESLint `RuleTester` with `languageOptions: {parser: tseslint.parser, ecmaVersion: 'latest', sourceType: 'module'}`. `tseslint` comes from `typescript-eslint`. `RuleTester.describe`, `RuleTester.it` and `RuleTester.itOnly` are set from `node:test`.
    - `dedent` removes a leading newline, a trailing whitespace-only line, and the smallest common indentation of the non-empty lines.
  - Test files import rules as `import rule from '../../lib/rules/<name>.js';` and call `ruleTester.run('<name>', rule, {valid, invalid})`.
  - `npm test` runs `npm run build && node --test "tests/**/*.test.js"`. Use this exact script.
- `imports-order` keeps `schema: []` and the message id `msg`. The message text changes to: `Imports are not in recommended order: '@angular/core', '@angular/core/*', '@angular/*', '@anglr/*', '@jscrpt/common', '@jscrpt/*', other scoped, other absolute, relative`.

- [ ] **Step 1: Write the failing tests** in `tests/rules/imports-order.test.js`.
  - Valid cases:
    - the import block of `boot/app.providers.ts:1-45`;
    - the import block of `pages/+mosia/hodnotenie/hodnotenie.component.ts:1-21`, which has `@angular/core` → `@angular/core/rxjs-interop` → `@angular/router`;
    - `import {a} from '@angular/router';\nimport {b} from '@angularx-foo/bar';`. Here `@angularx-foo` is "other scoped".
  - Invalid cases (1 error `msg` each; `output` is the stable regrouped order):
    - `@angular/core/rxjs-interop` before `@angular/core`;
    - `@jscrpt/other` before `@jscrpt/common`;
    - `@angularx-foo/bar` before `@angular/router`. The old `startsWith` check missed this one.
    - `rxjs` before `@ngx-translate/core`;
    - a relative import before `rxjs`.
  - `tests/rules/imports-spacing.test.js`:
    - valid: `services/api/asynctask/asynctask.service.ts:1-10`;
    - invalid: `pages/+mosia/hodnotenie/hodnotenie.component.ts:13-17`, which has an empty line between two relative imports. Expect 1 error `emptyLineForbidden`, with output = the same block minus that blank line.
- [ ] **Step 2: Run the tests and confirm they fail.** `npm test`. Expected: `imports-order` cases with `@angularx-foo`, `@angular/core/*` and `@jscrpt/common` FAIL; the harness itself loads.
- [ ] **Step 3: Implement `getImportGroup(source: string): number` in `src/rules/imports-order.ts`.**
  - It returns: 0 for `@angular/core`, 1 for `@angular/core/*`, 2 for `@angular/*`, 3 for `@anglr/*`, 4 for `@jscrpt/common` and `@jscrpt/common/*`, 5 for other `@jscrpt/*`, 6 for other scoped, 7 for other absolute, 8 for relative (starting with `.`).
  - Match on the scope segment (text before the first `/`) and the package name, never on a raw prefix.
  - Faulty = the group index ever decreases. Fix = stable sort by group, replacing each import's text in place (the existing approach).
  - Update `docs/rules/imports-order.md` to list the new order.
- [ ] **Step 4: Run the tests and confirm they pass.** `npm test`. Expected: all PASS.
- [ ] **Step 5: Commit.** `git add -A tests package.json src/rules/imports-order.ts docs/rules/imports-order.md && git commit -m "INT: node:test harness, imports-order groups by package segment"`

---

### Task 3: Port `@stylistic/indent` 6.0.1 to TypeScript (behaviour parity)  ·  parallel group P (chain 3→4)

**Files:**
- Create: `src/rules/indent/index.ts`, `src/rules/indent/handlers.ts`, `src/rules/indent/offsetStorage.ts`, `src/rules/indent/utils.ts`, `tests/rules/indent.test.js`
- Source: `node_modules/@stylistic/eslint-plugin/dist/rules/indent.js` (1179 lines) and the helpers it imports from `dist/utils.js`

**Interfaces:**
- Consumes: `createRule` from `src/utils/index.js`, `ruleTester` from Task 2.
- Produces for Task 4:
  - `src/rules/indent/index.ts` default-exports `createRule({name: 'indent', …})`. It has message id `wrongIndentation` and the upstream text `Expected indentation of {{expected}} but found {{actual}}.`
  - `offsetStorage.ts` exports `class OffsetStorage`, `class TokenInfo`, `validateTokenIndent(tokenInfo, token, desiredIndent): boolean` and `hasBlankLinesBetween(tokenInfo, first, second): boolean`.
  - `handlers.ts` exports `interface IndentContext {sourceCode; offsets: OffsetStorage; tokenInfo: TokenInfo; parameterParens: WeakSet<TSESTree.Token>; indentSize: number; indentType: 'space'|'tab'; options: IndentOptions}` and the upstream helper functions: `addElementListIndent`, `addBlocklessNodeIndent`, `addFunctionCallIndent`, `addParensIndent`, `ignoreNode`, `isOnFirstLineOfStatement`, `checkAssignmentOperator`, `checkArrayLikeNode`, `checkObjectLikeNode`, `checkConditionalNode`, `checkOperatorToken`, `checkMemberExpression`, `checkBlockLikeNode`, `checkHeritages`, `checkClassProperty`. Each takes `(ctx: IndentContext, …)` exactly as upstream.
  - `utils.ts` holds `KNOWN_NODES`, `STATEMENT_LIST_PARENTS`, `createGlobalLinebreakMatcher`, `skipChainExpression`, `isEqToken`, `isQuestionToken`, `isSingleLine` and `getCommentsBetween`.

- [ ] **Step 1: Write the failing tests** in `tests/rules/indent.test.js`. Use the upstream options `[4, {SwitchCase: 1}]` and a handful of upstream-semantics cases:
  - valid: `if(a)\n{\n    b();\n}`
  - invalid: `if(a)\n{\nb();\n}` → 1 error, with the line fixed to 4 spaces
  - invalid: a wrong `case` indent → upstream errors
- [ ] **Step 2: Run the tests and confirm they fail.** `npm test`. Expected: FAIL, `lib/rules/indent/index.js` is missing.
- [ ] **Step 3: Port the code.**
  - Translate the upstream file 1:1 into the four TS files, with the MIT header described in Global Constraints.
  - Replace `import_ast_utils.X` with `ASTUtils.X`, and `AST_NODE_TYPES` with the export from `@typescript-eslint/utils` (all needed predicates exist there, including `isOptionalChainPunctuator` and `LINEBREAK_MATCHER`).
  - Drop all JSX listeners, the JSX `KNOWN_NODES` entries, the `jsx` option and the `isESTreeSourceCode` guard.
  - Keep the rest of the schema and defaults identical to upstream, so that a parity check is possible.
  - Use `TSESTree` types and `any` only where upstream relies on duck typing (`strictNullChecks` is off).
- [ ] **Step 4: Run the tests and confirm they pass.** `npm test`. Expected: PASS.
- [ ] **Step 5: Check parity against upstream on the snapshot.**
  - Write a throwaway script `/tmp/lint-check/indent-parity.mjs`. Do not commit it.
  - The script uses the `ESLint` class twice on `/tmp/srcUpgrade-b742834/srcUpgrade/app/**/*.ts`:
    - (a) `@stylistic/indent` with the exact options from `src/index.ts` (`4, {VariableDeclarator: 'first', FunctionDeclaration: {parameters: 'first'}, FunctionExpression: {parameters: 'first'}, CallExpression: {arguments: 'first'}, ArrayExpression: 'first', ImportDeclaration: 'first'}`);
    - (b) the forked `lib/rules/indent/index.js` with the same options.
  - It compares the sorted `file:line:column:message` lists.
  - Expected output: `identical: N messages`, where N equals the `@stylistic/indent` baseline in `docs/verification/srcUpgrade-lint.md`.
- [ ] **Step 6: Commit.** `git add src/rules/indent tests/rules/indent.test.js && git commit -m "INT: forked @stylistic/indent 6.0.1 into ressurectit/indent (MIT)"`

---

### Task 4: `ressurectit/indent` – team indentation model (A.1–A.9)  ·  parallel group P (after Task 3)

**Files:**
- Modify: `src/rules/indent/index.ts`, `src/rules/indent/handlers.ts`, `src/rules/indent/offsetStorage.ts`, `tests/rules/indent.test.js`
- Create: `docs/rules/indent.md` (must mention the fork and the MIT origin)

**Interfaces:**
- Consumes: Task 3 internals.
- Produces:
  - The rule `indent` with message id `wrongIndentation`, fixable `whitespace`, and options `[{size?: integer ≥1 (default 4), ignoredNodes?: string[] (default [])}]`. This replaces the upstream schema.
  - Hard-coded internal settings: `SwitchCase: 1`, `VariableDeclarator: 'first'`, `outerIIFEBody: 1`, `MemberExpression: 1`, `FunctionDeclaration/FunctionExpression: {parameters: 'first', body: 1, returnType: 1}`, `CallExpression: {arguments: 'first'}`, `ArrayExpression: 1`, `ObjectExpression: 1`, `flatTernaryExpressions: false`, `offsetTernaryExpressions: false`, `ignoreComments: true`, `assignmentOperator: 1`.
  - `OffsetStorage.anchorAtColumn(token: TSESTree.Token): void`. When the token is **not** the first token of its line, its desired indent becomes the desired indent of its line's first token plus `(token.column − firstTokenOfLine.column)` spaces. When it is the first token of its line, the call is a no-op.

- [ ] **Step 1: Write the failing tests.** Replace the Task 3 cases. Options: none (the defaults). Embed the real snippets at `b742834` verbatim. Wrap class members in `class X\n{ … }` where needed. Snippets taken from deeper nesting are first dedented, then re-indented to the wrapper's body level, so they keep their relative layout. Inline code is written below with `\n`; use `dedent` for longer cases.

  **Valid cases:**

  | # | Case | Source (b742834) |
  |---|---|---|
  | v1 | A.3 aligned pipe: lambda `{` at the first-argument column, `forkJoin(\n[` collapses inside it | `services/api/asynctask/asynctask.service.ts:15-39` |
  | v2 | A.3 owner-line: `new Hotkey('~', () =>\n{ … }, undefined, 'Show console'))` | `boot/app.component.ts:200-217` (inside a class) |
  | v3 | A.2: `=\n[`, `fn(\n{`, `<FactoryProvider>\n{`, `fn(\n[`, `provideRouter(routes,\n withComponentInputBinding())` | `boot/app.providers.ts:47-115` (comment-only title lines included) |
  | v4 | A.2: `= \n{` with nested `key:\n{` | `pages/+mosia/hodnotenie/hodnotenie.component.ts:117-143` |
  | v5 | A.3 aligned params and function body | `pages/+mosia/hodnotenie/hodnotenie.component.ts:166-194` |
  | v6 | Constructor with aligned params and trailing comma; chain `.subscribe(itm =>\n{` (A.4) | `boot/app.component.ts:110-160` (inside a class) |
  | v7 | A.4 chain: `new HttpParams()\n    .append(…)` | `services/api/account/account.service.ts:97-105` (inside a class) |
  | v8 | A.4 chain with lambda and `=\n{` and `= <T>\n{` inside | `pages/+mosia/hodnotenie/hodnotenie.component.ts:391-431` (inside a class) |
  | v9 | A.3 deep aligned args after `computed(() => createUtvarRows(` | `pages/+mosia/hodnotenie/hodnotenie.component.ts:436-440` (inside a class) |
  | v10 | A.5 `if(… \|\|\n   …)` | `services/api/jubulaWs/jubulaWs.service.ts:421-429` and `pages/+poistenec/history/misc/components/prihoda/prihoda.component.ts:408-412` |
  | v11 | A.6 ternary branches +4, including an object branch `?\n{` | `components/conditionIcon/conditionIcon.component.ts:23-25` and `features/hlasenia/components/hlasenia/hlasenia.component.ts:146-151` |
  | v12 | A.7 `case` blocks, including fall-through | `services/api/account/account.service.ts:36-56` and `pipes/vahaHodnotaCss/vahaHodnotaCss.pipe.ts:21-56` |
  | v13 | A.8 template literal body and a commented-out block | `boot/app.component.ts:236-290` |
  | v14 | B.3 layout `=> (\n{` | `services/api/hodnotenie/hodnotenie.service.ts:120-126` and `pages/+mosia/hodnotenie/misc/components/okno/okno.component.ts:101-110` |
  | v15 | `useValue: <T>\n{` | `boot/app.providers.ts:178-188` |
  | v16 | A.2 collapse of nested single-argument calls (synthetic): `const a = btoa(encodeURIComponent(JSON.stringify(\n{\n    a: 1,\n})));` | — |
  | v17 | A.8 import declarations are ignored (synthetic): `import {a,\n        b} from 'x';` | — |

  **Invalid cases** (exact `output`; one error per listed line):

  - i1 (A.3, statement-indent variant of pipe operators, reduced from `services/api/account/account.service.ts:14-80`):
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
    ```
    - Errors: 7 (lines 4–10).
    - Output: lines 4, 6, 7, 8 and 10 at column 25; lines 5 and 9 at column 29.
  - i2 (A.3, wrapped last object argument, `boot/app.config.ts:22-26` reduced):
    - Input: `provideServiceWorker('ngsw-worker.js',\n{\n    enabled: false,\n});`
    - Errors: 3.
    - Output: `{` and `});` at column 21, `enabled` at column 25.
  - i3 (A.2, upstream +4 layout): `const x =\n    {\n        a: 1,\n    };` → 3 errors → `const x =\n{\n    a: 1,\n};`
  - i4 (A.2): `provideSelectOptions(\n    {\n        placeholder: NOTHING_SELECTED,\n    });` → 3 errors → `{` and `});` at column 0, the property at column 4.
  - i5 (A.5): `if(a ||\n    b)\n{\n}` → 1 error → `b)` at column 3.
  - i6 (A.5, hanging negation, from `features/podmienky/components/podmienkyRenderer/podmienkyRenderer.component.ts:241-246` moved to top level): `if(!node.isFirst() ||\n    ongoing ||\n   !selfNode)\n{\n    return null;\n}` → 1 error (line 2) → `ongoing` at column 3. Owner decision: strict A.5, hanging `!` is NOT allowed.
  - i7 (A.7): `switch(x)\n{\ncase 1:\n{\n    break;\n}\n}` → 4 errors → `case` and `{` at column 4, `break` at column 8, `}` at column 4.
  - i8 (A.4): `const body = new HttpParams()\n        .append('a', b)\n        .append('c', d);` → 2 errors → column 4.
  - i9 (A.6): `const css = cond ?\n        'a' :\n        'b';` → 2 errors → column 4.
- [ ] **Step 2: Run the tests and confirm they fail.** `npm test`. Expected: v1, v3, v4, v14 and i1–i6 FAIL with the upstream engine.
- [ ] **Step 3: Change the engine.** Exact decisions:
  1. **Options.** Replace the schema and the defaults as listed in Interfaces. The hard-coded settings build the internal `IndentOptions`.
  2. **`anchorAtColumn`.** Implement it in `OffsetStorage` (lookup order in `getDesiredIndent`: ignored → locked/anchored → descriptor).
  3. **Aligned mode (A.3)** in `addElementListIndent`, for call/new arguments and function parameters.
     - Aligned mode applies when some element with index ≥ 1 has its first token as the first token of its line.
     - In aligned mode, when the first element starts on the `(` line, call `anchorAtColumn(firstTokenOf(elements[0]))`. Keep the upstream `matchOffsetOf` for each element that starts a line.
     - In non-aligned mode, nothing else changes. Openers are handled by item 4.
  4. **Owner-line openers (A.2).** Add a helper `alignOpenerWithOwner(ctx, opener)`.
     - It applies when `opener` (`{` or `[`) is the first token of its line and the token before it is one of:
       - `=`;
       - `:` of a property key, type annotation or index signature (not of a `ConditionalExpression`);
       - `(`;
       - `=>`;
       - `>` that closes a type assertion or type arguments.
     - It sets `offsets.setDesiredOffset(opener, ownerBase(prevToken), 0)`. `ownerBase(t)` is the anchored first-argument token whose argument contains `t` on the same line, or else `tokenInfo.getFirstTokenOfLine(t)`.
     - Call it from `checkObjectLikeNode` (ObjectExpression, TSTypeLiteral), `checkArrayLikeNode` (ArrayExpression, TSTupleType) and the new `TSTypeAssertion` handler (item 6).
     - `?` and ternary `:` are **not** owners. A.6 applies there.
  5. **Parentheses (B.3).** In `addParensIndent`, do not set the `+1 from (` offset on an own-line `{`/`[` that directly follows a non-parameter `(`. Leave it to item 4.
  6. **`TSTypeAssertion`.** Add it to `KNOWN_NODES` with a handler: the tokens `<`…`>` get offset 0 from `<`, and the expression's opener goes through item 4.
  7. **A.5 conditions.** In the handler for `IfStatement, WhileStatement, DoWhileStatement`:
     - Flatten the top-level `LogicalExpression` chain of `node.test` without crossing parentheses. An operand's first token includes its own leading `(`.
     - Call `matchOffsetOf(firstTokenOf(operand0), firstTokenOf(operandN))` for every operand that starts its line.
     - Apply the same recursively inside parenthesised logical sub-groups that span lines.
     - Record those tokens in a `Set` on `ctx`, and make `checkOperatorToken` skip `ignoreToken` for them.
     - Logical expressions outside `if`/`while`/`do` tests keep the upstream behaviour (lenient).
  8. **A.8.**
     - `ignoreComments: true`.
     - The `TemplateLiteral` handler ignores every token strictly inside the literal; this replaces the upstream logic.
     - `ImportDeclaration` goes into the ignored-node set.
  9. A.4, A.6 and A.7 keep the upstream semantics with the hard-coded settings above. The tests prove it.
- [ ] **Step 4: Run the tests and confirm they pass.** `npm test`. Expected: all PASS.
- [ ] **Step 5: Write the docs.** Write `docs/rules/indent.md`: rules A.1–A.8 with correct/incorrect examples from the tests, the options, and a "Credits" section naming `@stylistic/eslint-plugin` 6.0.1 (MIT).
- [ ] **Step 6: Commit.** `git add src/rules/indent tests/rules/indent.test.js docs/rules/indent.md && git commit -m "INT: ressurectit/indent implements owner-line, aligned-argument and condition alignment model"`

---

### Task 5: `ressurectit/literal-brace-style` (B.1–B.3)  ·  parallel group P

**Files:**
- Create: `src/rules/literal-brace-style.ts`, `tests/rules/literal-brace-style.test.js`, `docs/rules/literal-brace-style.md`

**Interfaces:**
- Produces: the default export `createRule({name: 'literal-brace-style'})`.
  - `type: 'layout'`, `fixable: 'whitespace'`, `schema: []`.
  - Message ids:
    - `openerOnOwnLine`: `Opening '{{opener}}' of a multi-line {{kind}} must be on its own line.`
    - `arrowObjectLayout`: `Arrow returning a multi-line object must use '=> (' followed by '{' on the next line.`

- [ ] **Step 1: Write the failing tests.**
  - **Valid cases:**
    - `boot/app.providers.ts:47-115`;
    - `return {` from `services/api/account/account.service.ts:62-74` (inside a function);
    - `return <FormatProvider>{` from `boot/app.providers.ts:266-288`, wrapped in `const p =\n[ … ];`;
    - `=> (\n{` from `services/api/hodnotenie/hodnotenie.service.ts:120-126`;
    - an interface with a type literal on its own line, from `pages/+mosia/hodnotenie/hodnotenie.component.ts:23-50`;
    - the enum `pages/+poistenec/history/misc/enums/editDirection/editDirection.enum.ts:1-9`;
    - one-line literals: `@Injectable({providedIn: 'root'})` from `account.service.ts:85`, and `const a = [1, 2];`.
  - **Invalid cases:**
    - `const x = {\n    a: 1,\n};` → `openerOnOwnLine` → `const x =\n{\n    a: 1,\n};`
    - `this.router.navigate([\n    'a',\n]);` (pattern from `pages/+poistenec/history/history.component.ts:703`) → `openerOnOwnLine` → `this.router.navigate(\n[\n    'a',\n]);`
    - `interface A {\n    a: string;\n}` → `interface A\n{\n    a: string;\n}`. Do the same for `enum E {` and for `let x: {\n    a: string;\n};`, which becomes `let x:\n{`.
    - `modules/selectExtensions/directives/cisSuvisiaciKod/cisSuvisiaciKod.directive.ts:169-173` (`=> ({`, inside a function) → `arrowObjectLayout`. Output: `=> (` at the end of the line, then `{` on the next line at the line's own indent (8).
    - `const s = items.map(x =>\n    ({\n        kod: x,\n    }));` → `arrowObjectLayout` → `const s = items.map(x => (\n{\n        kod: x,\n    }));`. The content indentation belongs to `indent`, not to this rule.
    - Comment between the opener and its owner: `const x = /* c */ {\n    a: 1,\n};` → `openerOnOwnLine`, `output: null`.
- [ ] **Step 2: Run the tests and confirm they fail.** `npm test`. Expected: FAIL (module missing).
- [ ] **Step 3: Implement the listener.**
  - It covers `ObjectExpression, ArrayExpression, TSTypeLiteral, TSInterfaceBody, TSEnumBody`. Only literals that span more than one line are checked.
  - Exempt (B.2): the literal is `ReturnStatement.argument`, or it is the expression of a `TSTypeAssertion` that is `ReturnStatement.argument`.
  - Detect B.3: the parent is an `ArrowFunctionExpression` body wrapped in parentheses.
  - Fix:
    - Replace the whitespace between the previous token and the opener with `\n` + the leading whitespace of the previous token's line.
    - For `=>\n(`, also join `(` back onto the `=>` line with one space.
    - No fix when comments are in between.
- [ ] **Step 4: Run the tests and confirm they pass.** `npm test`. Expected: PASS.
- [ ] **Step 5: Docs.** Write `docs/rules/literal-brace-style.md`.
- [ ] **Step 6: Commit.** `git add src/rules/literal-brace-style.ts tests/rules/literal-brace-style.test.js docs/rules/literal-brace-style.md && git commit -m "INT: added rule literal-brace-style"`

---

### Task 6: `ressurectit/switch-case-braces` (C)  ·  parallel group P

**Files:**
- Create: `src/rules/switch-case-braces.ts`, `tests/rules/switch-case-braces.test.js`, `docs/rules/switch-case-braces.md`

**Interfaces:**
- Produces: the default export `createRule({name: 'switch-case-braces'})`.
  - `fixable: 'whitespace'`, `schema: []`.
  - Message ids:
    - `caseBlockRequired`: `Body of '{{label}}' must be a single block statement.` No fix, because wrapping statements changes scoping.
    - `caseBlockOnNextLine`: `Block of '{{label}}' must start on the next line.`
    - `noBlankLineBetweenCases`: `No blank line allowed between '}' and the next case.`

- [ ] **Step 1: Write the failing tests.**
  - Valid:
    - `services/api/account/account.service.ts:36-56`;
    - `pipes/vahaHodnotaCss/vahaHodnotaCss.pipe.ts:21-56` (fall-through `case 'X':\ncase 'NEHODNOTENE':\n{`, Review Focus 1);
    - `default:\n{\n}`.
  - Invalid:
    - `case 1:\n    foo();\n    break;` → `caseBlockRequired`, `output: null`;
    - `case 1: {\n    break;\n}` (inside a `switch` at column 0, `case` at column 4) → `caseBlockOnNextLine` → `case 1:\n    {` (indent = the `case` indent);
    - a blank line between `}` and the next `case` → `noBlankLineBetweenCases` → blank line removed.
- [ ] **Step 2: Run the tests and confirm they fail.** `npm test`. Expected: FAIL.
- [ ] **Step 3: Implement a `SwitchCase` listener.** Rules:
  - An empty `consequent` is allowed (fall-through).
  - Otherwise `consequent` must be exactly one `BlockStatement`, whose `{` is the first token on the line after the colon.
  - For a non-last case, the tokens `}` and the next `case` must be on adjacent lines.
- [ ] **Step 4: Run the tests and confirm they pass.** `npm test`. Expected: PASS.
- [ ] **Step 5: Docs and commit.** Write `docs/rules/switch-case-braces.md`. Then `git add …; git commit -m "INT: added rule switch-case-braces"`

---

### Task 7: `ressurectit/type-operator-spacing` (D)  ·  parallel group P

**Files:**
- Create: `src/rules/type-operator-spacing.ts`, `tests/rules/type-operator-spacing.test.js`, `docs/rules/type-operator-spacing.md`

**Interfaces:**
- Produces: the default export `createRule({name: 'type-operator-spacing'})`.
  - `fixable: 'whitespace'`, `schema: []`.
  - Message id `unexpectedSpace`: `No spaces around '{{operator}}' in types.`

- [ ] **Step 1: Write the failing tests.**
  - Valid:
    - `private _style: HTMLStyleElement|undefined|null;` (`boot/app.component.ts:53`, inside a class);
    - `Signal<Array<Hlasenie&Sprava>>` (`features/hlasenia/components/hlasenia/hlasenia.component.ts:52`, inside a class);
    - the value operators `const x = a | b & c;`;
    - a multi-line union with leading pipes `type X =\n    |A\n    |B;`.
  - Invalid:
    - `let a: string | number;` → 1 error → `let a: string|number;`
    - `type T = A &B;` → 1 error → `type T = A&B;`
    - `type X =\n    | A\n    | B;` → 2 errors → `|A`, `|B`.
- [ ] **Step 2: Run the tests and confirm they fail.** `npm test`. Expected: FAIL.
- [ ] **Step 3: Implement.**
  - For `TSUnionType` and `TSIntersectionType`, find each `|`/`&` punctuator between the types (including a leading one).
  - Report it once if there is same-line whitespace before or after it. Line breaks are never touched.
  - Fix: remove the same-line whitespace on both sides.
- [ ] **Step 4: Run the tests and confirm they pass.** `npm test`. Expected: PASS.
- [ ] **Step 5: Docs and commit.** Write `docs/rules/type-operator-spacing.md`. Then `git commit -m "INT: added rule type-operator-spacing"`

---

### Task 8: `ressurectit/region-titles` (E)  ·  parallel group P

**Files:**
- Create: `src/rules/region-titles.ts`, `tests/rules/region-titles.test.js`, `docs/rules/region-titles.md`

**Interfaces:**
- Produces: the default export `createRule({name: 'region-titles'})`. It has no `fixable` and no `hasSuggestions`.
  - Options: `[{names?: string[]; additionalNames?: string[]}]`. `names` replaces the built-in list, and its array order is the required order. `additionalNames` are allowed anywhere and are not order-checked.
  - Message ids:

    | Id | Text |
    |---|---|
    | `invalidFormat` | `Region title must be '//######################### <name> #########################'.` |
    | `unknownName` | `Unknown region title '{{name}}'.` |
    | `legacyName` | `Legacy region title '{{name}}': use a protected member and a 'protected …' title.` |
    | `wrongOrder` | `Region '{{name}}' must come before '{{previous}}'.` |
    | `blankLineBefore` | `Blank line required before region title.` |
    | `blankLineAfter` | `Blank line required after region title.` |
    | `constructorTitle` | `'constructor' title must be directly followed by 'constructor('.` |

  - Built-in names: the 23 names of spec E.4, verbatim and in that order. `<name>` is a non-empty wildcard.
  - Legacy names: `public properties - children`, `public properties - template bindings`, `public methods - template bindings`.

- [ ] **Step 1: Write the failing tests.**
  - **Valid cases:**
    - `pages/+poistenec/history/misc/directives/programContentCellTemplate/programContentCellTemplate.directive.ts:21-32` (`ng language server`, first in block, so no blank line before);
    - `services/api/jubulaWs/middlewares/chiroptera/chiroptera.middleware.ts:41-62` plus `\n    {\n    }\n}` (`public static properties` → `public methods - implementation of RestMiddleware`);
    - a skeleton class with the title sequence of `pages/+mosia/hodnotenie/hodnotenie.component.ts` (lines 230, 282, 554, 566-567, 593): `private fields` → `protected properties - template bindings` → `public properties - inputs` → `constructor` directly followed by `constructor()` → `protected methods - template bindings`, with one member each;
    - ignored contexts: the uppercase titles inside the `appProviders` array (`boot/app.providers.ts:50-60`), any titles in an `interface`, and `//######################### helpers #########################` inside `describe('x', () =>\n{ … });`;
    - options: `additionalNames: ['helpers']` with `helpers` anywhere in a class, and `names: ['b', 'a']` with `a` then `b` reported (invalid).
  - **Invalid cases** (`output` omitted, since the rule has no fix):
    - `boot/app.component.ts:46-108` plus `\n}` → 2× `legacyName`, at the titles that are on lines 80 and 102 of the original file;
    - `public methods` before `private fields` → `wrongOrder`;
    - `public method` → `unknownName`;
    - 8 `#` on each side, or no single spaces → `invalidFormat`;
    - a title directly after a member line → `blankLineBefore`;
    - a title directly followed by JSDoc → `blankLineAfter`;
    - a `constructor` title followed by a blank line or by JSDoc → `constructorTitle`.
- [ ] **Step 2: Run the tests and confirm they fail.** `npm test`. Expected: FAIL.
- [ ] **Step 3: Implement.**
  - On `Program:exit`, take every `Line` comment whose value starts with `#` and whose innermost node is a `ClassBody` (`sourceCode.getNodeByRangeIndex(comment.range[0])`).
  - Parse it with `/^#{25} (.+) #{25}$/`.
  - Ordering: titles in one class body must have non-decreasing indexes in the active list. Repeated titles are allowed.
  - "First in block" means the previous token is the class body `{`.
- [ ] **Step 4: Run the tests and confirm they pass.** `npm test`. Expected: PASS.
- [ ] **Step 5: Docs and commit.** Write `docs/rules/region-titles.md` (list the names and both options). Then `git commit -m "INT: added rule region-titles"`

---

### Task 9: `ressurectit/decorator-layout` (G.5 + "no blank line between JSDoc / decorators / member")  ·  parallel group P

**Files:**
- Create: `src/rules/decorator-layout.ts`, `tests/rules/decorator-layout.test.js`, `docs/rules/decorator-layout.md`

**Interfaces:**
- Produces: the default export `createRule({name: 'decorator-layout'})`.
  - `fixable: 'whitespace'`, `schema: []`.
  - Message ids:
    - `blankLineAfterJsdoc`: `No blank line allowed between JSDoc and the declaration.`
    - `blankLineAfterDecorator`: `No blank line allowed after a decorator.`
    - `decoratorOwnLine`: `Class and member decorators must be on their own line.`
    - `parameterDecoratorInline`: `Parameter decorators must be on the same line as the parameter.`

- [ ] **Step 1: Write the failing tests.**
  - Valid:
    - `services/api/account/account.service.ts:117-132` (JSDoc, 7 decorators, method; inside a class);
    - `services/api/asynctask/asynctask.service.ts:41-61` (class decorators, `@QueryObject @ParameterTransform(gridPagingToPageable) _paging?` inline);
    - `boot/app.component.ts:104-117` plus `\n    {\n    }` inside a class (`@ViewChild` member; constructor with `@Inject(LOGGER) logger: Logger`).
  - Invalid:
    - JSDoc, blank line, then a method → `blankLineAfterJsdoc` → blank line removed;
    - `@Input()`, blank line, then `public x: string;` → `blankLineAfterDecorator`;
    - `@Input() public x: string;` (inside a class at indent 4) → `decoratorOwnLine` → `@Input()\n    public x: string;`;
    - `constructor(@Inject(X)\n            x: X)` → `parameterDecoratorInline` → `constructor(@Inject(X) x: X)`;
    - JSDoc, blank line, then `export function f()` → `blankLineAfterJsdoc`.
- [ ] **Step 2: Run the tests and confirm they fail.** `npm test`. Expected: FAIL.
- [ ] **Step 3: Implement.**
  - JSDoc gap:
    - Applies to any statement or class/interface member whose closest preceding comment (from `sourceCode.getCommentsBefore`) is a `Block` comment starting with `*`.
    - The comment's end line must be the line before the first decorator or the first token.
  - Decorators:
    - For `ClassDeclaration`, `PropertyDefinition`, `MethodDefinition`, `AccessorProperty` and `TSAbstract*`, every decorator must be the first token on its line, and the token after the last decorator must start a new line with no blank line in between.
    - For parameters (`node.params[*].decorators`, `TSParameterProperty`), every decorator must end on the line where the parameter name starts.
  - Fixes: whitespace only. A new line gets the member's indent.
- [ ] **Step 4: Run the tests and confirm they pass.** `npm test`. Expected: PASS.
- [ ] **Step 5: Docs and commit.** Write `docs/rules/decorator-layout.md`. Then `git commit -m "INT: added rule decorator-layout"`

---

### Task 10: `ressurectit/argument-layout` (F.1, F.2, F.4)  ·  parallel group P

**Files:**
- Create: `src/rules/argument-layout.ts`, `tests/rules/argument-layout.test.js`, `docs/rules/argument-layout.md`

**Interfaces:**
- Produces: the default export `createRule({name: 'argument-layout'})`.
  - `fixable: 'code'`. Commas count as punctuation.
  - Options: `[{maxLength?: integer (default 120)}]`.
  - Message ids:
    - `constructorParamsWrap`: `Constructor with 2 or more parameters must have each parameter on its own line, aligned with the first.`
    - `paramsWrap`: `Line exceeds {{maxLength}} characters: wrap parameters, aligned with the first.`
    - `trailingCommaRequired`: `Wrapped parameter list must end with a trailing comma.`
    - `trailingCommaForbidden`: `Trailing comma not allowed here.`

- [ ] **Step 1: Write the failing tests.**
  - **Valid cases:**
    - `boot/app.component.ts:111-118` plus `\n    }` inside a class (wrapped constructor, `@Inject(DOCUMENT) private _document: Document,)`);
    - `services/api/asynctask/asynctask.service.ts:15` with a body (2 params, line > 120, not wrapped, which is fine because F.2 needs more than 2 params);
    - single-line `constructor(private _a: A)`;
    - wrapped rest parameter without a trailing comma, `function f(a: string,\n           ...rest: string[])\n{\n}` (Review Focus 2);
    - arrows are out of scope, so `const f = (a, b, c,) => a;` is valid.
  - **Invalid cases:**

    | Input | Error | Output |
    |---|---|---|
    | `services/api/jubulaWs/jubulaWs.service.ts:410-417` with an empty body, inside a class (wrapped, no trailing comma) | `trailingCommaRequired` | `idBenefit?: string\|null,): WsResponse<…>` |
    | `provideHttpClient(withInterceptorsFromDi(),);` (`boot/app.providers.ts:60`) | `trailingCommaForbidden` | `provideHttpClient(withInterceptorsFromDi());` |
    | `function f(a: string,) {}` | `trailingCommaForbidden` | comma removed |
    | `new Foo(a,);` | `trailingCommaForbidden` | comma removed |
    | `class A\n{\n    constructor(private _a: A, private _b: B)\n    {\n    }\n}` | `constructorParamsWrap` | `    constructor(private _a: A,\n                private _b: B,)` (column 16) |
    | `    public getHistory(idPoistenec: number, idProduktu?: string\|null, idPripadu?: string\|null, idUlohy?: string\|null): WsResponse<HistoriaWsResponse>` (148 chars, inside a class, with a body) | `paramsWrap` | 2nd and later params at column 22, trailing comma `idUlohy?: string\|null,):` |
- [ ] **Step 2: Run the tests and confirm they fail.** `npm test`. Expected: FAIL.
- [ ] **Step 3: Implement.**
  - **Declarations:** `FunctionDeclaration`, `FunctionExpression` (methods and constructors), `TSDeclareFunction` and `TSEmptyBodyFunctionExpression`. Arrows and signatures are excluded.
  - "Wrapped" means some parameter starts on a line other than the `(` line.
  - **F.1:** `kind === 'constructor'` and 2 or more params.
  - **F.2:** more than 2 params, not wrapped, and the `(` line length > `maxLength`.
  - **F.4:**
    - wrapped declaration → comma required, unless the last param is a `RestElement`;
    - single-line declaration → comma forbidden;
    - `CallExpression` / `NewExpression` → comma forbidden.
  - **Wrap fix:** replace the whitespace after each comma before param i ≥ 1 with `\n` + spaces up to the first param's column, and append `,` after the last param (unless rest).
- [ ] **Step 4: Run the tests and confirm they pass.** `npm test`. Expected: PASS.
- [ ] **Step 5: Docs and commit.** Write `docs/rules/argument-layout.md`. Then `git commit -m "INT: added rule argument-layout"`

---

### Task 11: `ressurectit/line-wrapping` (F.3, B.4, 120-char arbitration)  ·  parallel group P

**Files:**
- Create: `src/rules/line-wrapping.ts`, `tests/rules/line-wrapping.test.js`, `docs/rules/line-wrapping.md`

**Interfaces:**
- Produces: the default export `createRule({name: 'line-wrapping'})`.
  - `fixable: 'code'` (adds trailing commas when exploding).
  - Options: `[{maxLength?: integer (default 120); maxItems?: integer (default 5)}]`.
  - Message ids:
    - `wrapArguments`: `Wrap arguments of this call: put 2nd and following arguments on new lines aligned with the first.`
    - `explodeLiteral`: `Put each {{kind}} of this literal on its own line.`

- [ ] **Step 1: Write the failing tests.**
  - **Valid cases:**
    - `boot/app.component.ts:155` inside a method (141 chars, but only single-argument calls and an empty `[]`, so there is no candidate);
    - `pages/+mosia/hodnotenie/hodnotenie.component.ts:436-440` (already wrapped);
    - a long `import {…} from '…';` over 120 characters;
    - a long template literal containing `${fn(aaaa, bbbb)}`;
    - the type literal `let x: {a: string; b: string; c: string; d: string; e: string; f: string};`;
    - the destructuring `const {a, b, c, d, e, f} = obj;`.
  - **Invalid cases** (exactly 1 error each):
    - `const sprava = await lastValueFrom(this._hodnotenieSvc.createNote(this.detailId(), result.aktualne ? this.mosiaId().obdobie : null, result.text).pipe(handleError(this._notifications)), {defaultValue: undefined});` (from `hodnotenie.component.ts:665`, 212 chars) → `wrapArguments` on `lastValueFrom`, the outermost multi-argument call. Output: the line ends after `…_notifications)),`, and the next line is 35 spaces + `{defaultValue: undefined});`.
    - `function f()\n{\n    const rest: OverviewRow[] = items.filter(itm => !itm.sumarny).map(data => ({data, i1, i2, label: null, indent: true}));\n}` (`hodnotenie.component.ts:191`, 123 chars) → `explodeLiteral`. Output:
      ```ts
          const rest: OverviewRow[] = items.filter(itm => !itm.sumarny).map(data => (
          {
              data,
              i1,
              i2,
              label: null,
              indent: true,
          }));
      ```
    - `    protected readonly obdobieForm: FieldTree<{obdobie: string|null}> = form(linkedSignal<{obdobie: string|null}>(() => ({obdobie: this.mosiaId().obdobie})));` (`hodnotenie.component.ts:552`, 158 chars, in a class) → `explodeLiteral`. The value literal is exploded; the type literals are ignored. Output:
      ```ts
          protected readonly obdobieForm: FieldTree<{obdobie: string|null}> = form(linkedSignal<{obdobie: string|null}>(() => (
          {
              obdobie: this.mosiaId().obdobie,
          })));
      ```
    - `const rows = [\n    {label: texts?.prvy, tooltip: texts?.prvyTooltip, value: getAttr(atributy, i1?.nalepkaMosia, i1?.indikator ?? ''), meta: i1},\n];` (line 2 has 129 chars, after `hodnotenie.component.ts:382`) → `wrapArguments` on `getAttr`, because the call wins over the literal. Its 2nd and 3rd arguments go to column 69.
    - `fn(a, b, c, d, e, f);` (more than 5 args, short line) → `wrapArguments` → `fn(a,\n   b,\n   c,\n   d,\n   e,\n   f);`
    - `const o = {a: 1, b: 2, c: 3, d: 4, e: 5, f: 6};` → `explodeLiteral` → `const o =\n{\n    a: 1,\n …\n    f: 6,\n};`
    - `const x = [{a: 1, b: 2, c: 3, d: 4, e: 5, f: 6}, {g: 1}];` → one error, on the outer array (outermost literal).
    - A comment inside the literal of a qualifying line → `explodeLiteral` with `output: null` (Review Focus 5).
- [ ] **Step 2: Run the tests and confirm they fail.** `npm test`. Expected: FAIL.
- [ ] **Step 3: Implement the per-line arbitration on `Program:exit`.** This is the non-obvious algorithm:
  ```text
  collect call candidates: CallExpression/NewExpression with ≥2 args whose args all start on the line of '('
  collect literal candidates: ObjectExpression/ArrayExpression with ≥1 element, start and end on the same line
  drop candidates inside a TemplateLiteral, an ImportDeclaration or an Export*Declaration
  for each physical line L that contains the '(' of a call or the start of a literal:
      long  = sourceCode.lines[L-1].length > maxLength
      calls = call candidates on L where long or args.length > maxItems
      lits  = literal candidates on L where long or elements.length > maxItems
      keep only the outermost entries (not nested in another candidate of the same list on L)
      if calls is not empty: report wrapArguments on the leftmost call
      else if lits is not empty: report explodeLiteral on the leftmost literal
      (otherwise report nothing; never more than one report per line)
  ```
  - **wrapArguments fix:** like the Task 10 wrap, without a trailing comma.
  - **explodeLiteral fix:**
    - Put the opener on its own line at the leading indent of line L, unless B.2 applies (the literal is a `return` argument, directly or through `<T>`), or it is the arrow body `(…)`, in which case produce `(\n{`.
    - One element per line at +4, a trailing `,`, and the closer at the indent of L.
  - No fix when comments are inside the range.
- [ ] **Step 4: Run the tests and confirm they pass.** `npm test`. Expected: PASS.
- [ ] **Step 5: Docs and commit.** Write `docs/rules/line-wrapping.md`. Then `git commit -m "INT: added rule line-wrapping"`

---

### Task 12: `ressurectit/angular-metadata` (G.1–G.4)  ·  parallel group P

**Files:**
- Create: `src/rules/angular-metadata.ts`, `tests/rules/angular-metadata.test.js`, `docs/rules/angular-metadata.md`

**Interfaces:**
- Produces: the default export `createRule({name: 'angular-metadata'})`.
  - `fixable: 'code'`.
  - Options: `[{order?: {Component?: string[]; Directive?: string[]; NgModule?: string[]; Pipe?: string[]; Injectable?: string[]}}]`.
  - Message ids:

    | Id | Text |
    |---|---|
    | `propertyOrder` | `'{{property}}' must come before '{{previous}}' in @{{decorator}} metadata.` |
    | `mustBeMultiline` | `'{{property}}' must be a multi-line literal.` |
    | `arrayOrder` | `Items of '{{property}}' must be sorted by length (shortest first).` |
    | `metadataMultiline` | `@{{decorator}} metadata must be a multi-line object.` |

  - Default orders:
    - Component and Directive: `selector, standalone, templateUrl, template, styleUrl, styleUrls, styles, host, inputs, outputs, imports, providers, viewProviders, hostDirectives, changeDetection, encapsulation, schemas, animations, exportAs`
    - NgModule: `imports, declarations, providers, exports, bootstrap, schemas`
    - Pipe: `name, standalone, pure`
    - Injectable: `providedIn`

- [ ] **Step 1: Write the failing tests.** Every case starts with `import {Component, Directive, NgModule, Injectable} from '@angular/core';`.
  - **Valid cases:**
    - `boot/app.component.ts:25-46` plus `\n{\n}`;
    - `directives/staticDateTimeInput/staticDateTimeInput.directive.ts:8-22` plus `\n}`, with `exportAs` last;
    - `pages/+poistenec/history/misc/directives/lineThroughIf/lineThroughIf.directive.ts:6-22`, with a multi-line `host`;
    - `pages/+mosia/hodnotenie/hodnotenie.component.ts:199-229` plus `\n}`;
    - `@Injectable({providedIn: 'root'})`;
    - Review Focus 4: `import {Component} from 'other-lib';` with a one-line, unordered `@Component({template: '', selector: 'x'})`. Must be valid.
  - **Invalid cases:**
    - `templateUrl` before `selector` → `propertyOrder`, `output: null`;
    - `exportAs` before `providers` → `propertyOrder`;
    - `imports: [A],` inside multi-line metadata at indent 4 → `mustBeMultiline` → `imports:\n    [\n        A,\n    ],`;
    - `imports:\n    [\n        MainMenuComponent,\n        Console,\n    ],` → `arrayOrder` → `Console` first;
    - the same with a `// comment` between the items → `arrayOrder`, `output: null`;
    - `@Component({selector: 'a', template: ''})` → `metadataMultiline` → `@Component(\n{\n    selector: 'a',\n    template: '',\n})`;
    - `@NgModule` with `declarations` before `imports` → `propertyOrder`.
- [ ] **Step 2: Run the tests and confirm they fail.** `npm test`. Expected: FAIL.
- [ ] **Step 3: Implement.**
  - Track local names imported from `'@angular/core'`, including aliases.
  - Check only `Decorator > CallExpression[callee is one of those]` whose first argument is an `ObjectExpression`.
  - Pipe and Injectable get G.1 only. Component, Directive and NgModule get G.1–G.4.
  - G.1: known properties must be in relative order; unknown properties may be anywhere. Report only, never fix.
  - G.2: `imports`, `providers` and `host` must be multi-line literals. The fix explodes them like Task 11 does.
  - G.3:
    - Sort `imports, providers, viewProviders, declarations, exports` stably by `sourceCode.getText(element).length`.
    - The fix swaps element texts in place.
    - Skip `hostDirectives`.
  - G.4: the metadata object must span more than one line. The fix explodes it to `(\n{\n    p: v,\n})`.
- [ ] **Step 4: Run the tests and confirm they pass.** `npm test`. Expected: PASS.
- [ ] **Step 5: Docs and commit.** Write `docs/rules/angular-metadata.md`. Then `git commit -m "INT: added rule angular-metadata"`

---

### Task 13: Wire rules, `recommended` config (H, I, K), dependencies, README, changelog

**Files:**
- Create: `src/rules/linesBetweenClassMembers.ts`
- Modify: `src/rules/index.ts`, `src/index.ts`, `package.json`, `package-lock.json`, `README.md`, `changelog.md`
- Create: `tests/config.test.js`, `tests/fixtures/asynctask.service.ts`, `tests/fixtures/app.component.ts`

**Interfaces:**
- Consumes: the default exports of Tasks 2–12, under the file names in File Structure.
- Produces:
  - `plugin.rules` with the keys `imports-order, imports-spacing, indent, literal-brace-style, switch-case-braces, type-operator-spacing, region-titles, decorator-layout, argument-layout, line-wrapping, angular-metadata, padding-line-between-statements, lines-between-class-members`. The last key is `stylistic.rules['padding-line-between-statements']`, re-exported as an alias.
  - `plugin.configs.recommended`.

- [ ] **Step 1: Write the failing tests** in `tests/config.test.js` (node:test plus `new ESLint({overrideConfigFile: true, overrideConfig: plugin.configs.recommended})`).
  - (a) `Object.keys(plugin.rules)` equals the list above.
  - (b) `tests/fixtures/asynctask.service.ts` gives **0** messages. It is a verbatim copy of `services/api/asynctask/asynctask.service.ts` at b742834.
  - (c) `tests/fixtures/app.component.ts` (verbatim `boot/app.component.ts` at b742834) includes:
    - `ressurectit/region-titles` `legacyName` on lines 80 and 102;
    - `jsdoc/require-hyphen-before-param-description` on line 299;
    - `ressurectit/padding-line-between-statements` on line 237;
    - no `jsdoc/require-jsdoc` on the constructor.
  - (d) The snippet `staticDateTimeInput.directive.ts:37-62` wrapped in a class gives no `jsdoc/require-jsdoc` (Review Focus 3).
  - (e) `import {\n    A,\n    B} from 'x';` gives exactly one `@stylistic/list-style` message.
  - (f) `switch(a)\n{\n    case 1:\n    {\n        foo();\n\n        break;\n    }\n}` gives no `padding-line-between-statements` message.
- [ ] **Step 2: Run the tests and confirm they fail.** `npm test`. Expected: FAIL (rules not registered, jsdoc missing).
- [ ] **Step 3: Update `package.json` dependencies.**
  - `npm view eslint-plugin-jsdoc version`; it was 65.4.12 on 2026-11-18. Add that version exactly to devDependencies and as `>=` to dependencies.
  - Add `@typescript-eslint/utils` `8.72.2` / `>=8.72.2`. `src/` imports it directly today.
  - Run `npm install`.
  - **Engines (owner decision):** set `engines.node` to `^22.22.2 || >=24.15.0` (jsdoc 65 requirement; Node 20 dropped).
- [ ] **Step 4: Build `src/rules/index.ts` and `src/index.ts`.** Keep the existing first three config entries and the existing rules block. Then apply these changes (exact values):
  - **Plugins:** `ressurectit: plugin` and `jsdoc` (`import jsdoc from 'eslint-plugin-jsdoc'`).
  - **K:**
    - `@stylistic/indent: 'off'`, `ressurectit/indent: 'warn'`, `curly: ['warn', 'all']`.
    - `@stylistic/space-infix-ops: ['warn', {ignoreTypes: true}]`.
    - `@stylistic/space-before-function-paren: ['warn', {anonymous: 'never', named: 'never', asyncArrow: 'always', catch: 'never'}]`.
    - `@stylistic/keyword-spacing`: existing overrides plus:
      - `after: true` for `case, of, in, const, let, new, typeof, instanceof, await, yield, delete, void`;
      - `before: true` for `of, in, instanceof`;
      - `as: {before: true, after: true}` and `satisfies: {before: true, after: true}` (calls made: stylistic 6 reports 41 + 6 false hits on these otherwise).
    - `@stylistic/comma-dangle: ['warn', {arrays: 'always-multiline', objects: 'always-multiline', imports: 'always-multiline', exports: 'always-multiline', enums: 'always-multiline', tuples: 'always-multiline', generics: 'ignore', functions: 'ignore'}]`.
    - `@stylistic/list-style: ['warn', {singleLine: {spacing: 'never'}, overrides: {'()': 'off', '<>': 'off', '{}': {singleLine: {spacing: 'never'}}, ImportDeclaration: {singleLine: {spacing: 'never'}, multiLine: {minItems: Number.MAX_SAFE_INTEGER}}}}]`.
      - `'()'` and `'<>'` are off because aligned arguments are owned by A and F.
      - The `ImportDeclaration` entry implements "imports never wrapped".
  - **H:**
    - `@stylistic/padding-line-between-statements: ['error', {blankLine: 'always', prev: '*', next: ['if', 'for', 'while', 'do', 'switch', 'try']}, {blankLine: 'always', prev: ['if', 'for', 'while', 'do', 'switch', 'try'], next: '*'}, {blankLine: 'always', prev: '*', next: ['return', 'throw', 'break', 'continue']}]`
    - `ressurectit/padding-line-between-statements: ['warn', {blankLine: 'always', prev: ['const', 'let'], next: '*'}, {blankLine: 'any', prev: ['const', 'let'], next: ['const', 'let', 'if', 'for', 'while', 'do', 'switch', 'try', 'return', 'throw', 'break', 'continue']}]`. The second entry prevents a double report with the error rule.
    - `@stylistic/lines-between-class-members: 'off'`, replaced by `ressurectit/lines-between-class-members: ['warn', 'always']` – a thin wrapper (`src/rules/linesBetweenClassMembers.ts`) around `stylistic.rules['lines-between-class-members']` that drops reports where the previous member is a getter and the next one is a setter with the same key (owner decision: a glued getter/setter pair is allowed). Add it to `plugin.rules` keys in Interfaces/test (a). Test: `get a()\n{\n}\nset a(v)\n{\n}` → 0 messages; `get a()\n{\n}\nset b(v)\n{\n}` → 1 message.
  - **New custom rules:** `ressurectit/literal-brace-style`, `switch-case-braces`, `type-operator-spacing`, `region-titles`, `decorator-layout`, `argument-layout`, `line-wrapping` and `angular-metadata`, all `'warn'`. `ressurectit/imports-order` stays `'error'`.
  - **I:**
    - `jsdoc/multiline-blocks: ['warn', {noSingleLineBlocks: true}]`
    - `jsdoc/check-alignment: 'warn'`
    - `jsdoc/require-hyphen-before-param-description: ['warn', 'always']`
    - `jsdoc/require-jsdoc: ['warn', {enableFixer: false, require: {FunctionDeclaration: false, ClassDeclaration: false, MethodDefinition: false, ArrowFunctionExpression: false, FunctionExpression: false, ClassExpression: false}, contexts: [...]}]`, where `contexts` is:
      - `ClassDeclaration`, `TSInterfaceDeclaration`, `TSTypeAliasDeclaration`, `TSEnumDeclaration`;
      - `Program > FunctionDeclaration`, `Program > ExportNamedDeclaration > FunctionDeclaration`, `Program > ExportDefaultDeclaration > FunctionDeclaration`;
      - `Program > ExportNamedDeclaration > VariableDeclaration`;
      - `MethodDefinition:not([kind='constructor']):not([kind='set'])`, `TSAbstractMethodDefinition`, `PropertyDefinition`, `TSAbstractPropertyDefinition`, `AccessorProperty`;
      - `TSInterfaceBody > TSPropertySignature`.
- [ ] **Step 5: Run the tests and confirm they pass.** `npm test`. Expected: all PASS, including every rule suite.
- [ ] **Step 6: Update README and changelog.**
  - **README:**
    - flat-config usage (`export default [...ressurectit.configs.recommended];`);
    - a "Supported Rules" table that links each `docs/rules/<rule>.md` (replacing `* Fill in provided rules here`);
    - a "Third-party code" note for the indent fork (MIT).
  - **changelog.md:** a new top entry `## Version 1.0.0 (<release date>)`, in the existing format:
    - `### Features`: one bullet per new rule, plus the `recommended` changes (jsdoc, padding lines, keyword-spacing, list-style);
    - `### BREAKING CHANGES`:
      - minimal versions eslint 10.15.0, `@stylistic/eslint-plugin` 6.0.1, typescript-eslint 8.72.2, TypeScript 6.0.3;
      - the node engines;
      - `@stylistic/indent` replaced by `ressurectit/indent`;
      - the new `imports-order` groups;
      - the new dependency `eslint-plugin-jsdoc`.
- [ ] **Step 7: Commit.** `git add -A src package.json package-lock.json README.md changelog.md tests && git commit -m "INT: recommended config 1.0.0 with all formatting rules"`

---

### Task 14: Integration check on srcUpgrade (read-only) and false-positive tuning

**Files:**
- Modify: `docs/verification/srcUpgrade-lint.md`
- Modify only where a false positive is found: the rule file and its test file in `src/rules/*` and `tests/rules/*`

**Interfaces:**
- Consumes: the Task 1 snapshot, `/tmp/lint-check/eslint.config.js` and the baseline table; the Task 13 config.

- [ ] **Step 1: Lint the snapshot.** Run `npm run build`, then repeat the Task 1 Step 4 lint into `/tmp/lint-check/final.json`. Expected: no fatal or parsing messages, and no rule crashes.
- [ ] **Step 2: Triage.**
  - For every `ruleId`, review all hits when there are 30 or fewer. Otherwise review a random sample of 30, plus every file with more than 20 hits of that rule.
  - Classify each hit as a *real deviation* (it breaks a §5 rule as written) or a *false positive*.
- [ ] **Step 3: Fix each false-positive class with TDD.**
  - Add the offending snippet (path:line at b742834) as a valid case to the rule's test.
  - Run `npm test` and see it fail.
  - Fix the rule, run `npm test` again and see it pass.
  - Commit: `git commit -m "INT: <rule> no longer reports <construct>"`.
  - Repeat Steps 1–3 until a full pass finds no false-positive class.
- [ ] **Step 4: Check fix safety (anti-goal).**
  - Copy the snapshot to `/tmp/lint-fix/srcUpgrade` and run eslint with `--fix` there.
  - For every changed file, the token-value sequence without `,` tokens must match the original. Parse both versions with `tseslint.parser`.
  - For files where `angular-metadata` sorted arrays, the token multisets must match instead.
  - Re-lint the fixed copy. Expected: no parsing errors, and only non-fixable messages remain.
- [ ] **Step 5: Record the results.**
  - Add the "1.0.0" columns to `docs/verification/srcUpgrade-lint.md`: per-rule counts (src/spec/total) next to the baseline.
  - For each rule, write one line describing what its remaining hits are (for example "indent: 412, all genuine misalignments of type X/Y").
  - Commit: `git commit -m "INT: verified 1.0.0 against srcUpgrade"`.
  - Acceptance: every remaining hit class is a genuine deviation from §5. `@stylistic/indent` and `@stylistic/list-style` no longer appear.

---

## Self-review notes

- Spec coverage:
  - A → Tasks 3 and 4; B.1–B.3 → Task 5; B.4 → Task 11; C → Task 6; D → Task 7 (plus `space-infix-ops` in Task 13); E → Task 8.
  - F.1, F.2 and F.4 → Task 10; F.3 and the 120-char arbitration → Task 11; G.1–G.4 → Task 12; G.5 → Task 9.
  - H → Task 13 (padding, `lines-between-class-members`) and Task 9 (JSDoc/decorator gaps); I → Task 13; J → Task 2; K → Task 13.
  - §6 tests → Task 2 harness and every task; integration → Task 14. Release docs → each task plus Task 13.
- The one-report-per-line rule is applied to the count triggers (more than 5 items) as well. This is a decision of this plan; the spec only states it for over-long lines.
