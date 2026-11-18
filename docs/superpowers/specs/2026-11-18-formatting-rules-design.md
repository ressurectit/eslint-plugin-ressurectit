# eslint-plugin-ressurectit 1.0.0 – team formatting rules

Status: draft for approval · Date: 2026-11-18

## 1. Intent

The recommended config of `eslint-plugin-ressurectit` must describe the TypeScript formatting style the team actually
writes (Allman everywhere, "brace takes owner-line indent", argument alignment, region titles, …). Today the config
produces thousands of false positives on real code (3413 `@stylistic/indent` hits on `chiroptera-trachops/srcUpgrade`)
and misses many written rules. AI-generated code (e.g. tests) currently drifts from the style because nothing enforces it.

Sources of truth:
- written: `~/git/chiroptera-trachops/srcUpgrade/.github/instructions/typescript/formatting.md`, `comments.md`
- observed: all 555 `app/**/*.ts` files of that project (real examples for tests should be taken from there,
  e.g. `app/boot/app.providers.ts`, `app/boot/app.component.ts`, `app/services/api/asynctask/asynctask.service.ts`,
  `app/pages/+mosia/hodnotenie/hodnotenie.component.ts`, `app/services/api/account/account.service.ts`)
- decisions made with the owner (this document).

## 2. Goals / non-goals / anti-goals

Goals
- Encode every agreed rule below in the plugin's `recommended` config (custom rules + configured third-party rules).
- Autofix where agreed (indent, literal braces, trailing comma, decorator array sort, type-operator spacing, …).
- Real tests (`npm test`, `node:test` + ESLint `RuleTester`).

Non-goals
- No changes to `chiroptera-trachops` (read-only reference; may be linted read-only for verification).
- No checking of `//` line comment spacing, no alphabetical import sorting, no `max-len`.
- Member-to-region assignment (which member belongs in which region) is not validated, only region order.

Anti-goals
- Flooding real code with false positives again: a rule that cannot be precise must stay silent on a construct
  rather than guess.
- `--fix` changing behavior (only whitespace/punctuation/order of decorator arrays).

## 3. Constraints

- Already done (uncommitted, part of this release): dependency upgrade – eslint 10.15, @stylistic 6.0.1,
  typescript-eslint 8.72.2, TypeScript 6.0.3 (7.x unsupported by typescript-eslint), `@eslint/js` added,
  `engines.node` `^20.19.0 || ^22.13.0 || >=24`.
- New dependency: `eslint-plugin-jsdoc` (latest).
- ESM, TypeScript sources in `src/`, built by `tsc` to `lib/`. Existing style: Allman, 4 spaces, JSDoc on members.
- Release as **1.0.0** (breaking). Update `changelog.md`, `docs/rules/*.md`, README.
- Third-party code copied in (stylistic indent) keeps its MIT notice.

## 4. Approaches (indentation engine)

1. **Fork `@stylistic/indent` into the plugin and change its handlers (chosen).** Its `OffsetStorage` engine already
   models "token indented relative to another token", first-argument alignment and template-literal ignoring; we
   change ~10 handlers. Pro: hundreds of syntax cases + autofix for free. Con: ~1.2k lines of vendored code to maintain.
2. Fresh AST walker computing expected columns – small and exact, but every exotic construct is our problem; rejected
   for false-positive risk.
3. Prettier / dprint plugins – cannot express the model; rejected.

## 5. The rules (agreed)

Severity: blank-line rules 1–2 = `error`, rule 3 = `warn`; JSDoc presence = `warn`; all wrapping rules triggered by
the 120-char limit (B.4, F.2, F.3) = `warn`; `imports-order` stays `error`.
*Builder's call (proposed):* all other formatting rules `warn`, matching the current config.

### A. Indentation – custom `ressurectit/indent` (fork of @stylistic/indent), replaces `@stylistic/indent`
1. 4 spaces per level; block content +4 from the line owning the `{`.
2. A `{` / `[` on its own line takes the indent of its *owner line* (after `=`, `key:`, `(`, `<T>`, `=>`), not +4;
   content +4; closer aligned with opener. Nested single-argument calls collapse to the statement indent
   (`btoa(encodeURIComponent(JSON.stringify(\n{`).
3. Wrapped arguments / parameters align with the first one; that column is the base for everything nested in them.
   **A wrapped object/array last argument and RxJS `pipe(op1(), op2())` operators also align with the first
   argument** (statement-indent variant is reported).
   The aligned column becomes the base **only if at least one 2nd-or-later argument starts on its own line**;
   otherwise A.2 applies (owner-line indent). Both of these are valid:
   ```ts
   return response.pipe(mergeMap(data =>
                        {
                        }),
                        map(...));

   hotkeys.add(new Hotkey('~', () =>
   {
   }, undefined, 'Show console'));
   ```
4. Member chains: first `.call()` on a new line +4 from the chain head line, following ones aligned with the
   previous dot.
5. Multi-line `&&`/`||` conditions: continuation aligned with the first operand (column after `if(`).
6. Multi-line ternary: branches +4.
7. `case` +4 inside `switch`; the case block `{` at the same column as `case`.
8. Ignored: template-literal contents, comment-only lines, import declarations.
9. Autofix.

### B. Brace placement of literals – custom rule (e.g. `ressurectit/literal-brace-style`)
1. Multi-line object / array literal, type literal, interface body, enum body: `{`/`[` on its own line (column per A.2).
2. Exception: `return {`, `return <T>{`, `return [` keep the opener on the `return` line.
3. Arrow returning multi-line object: `=> (\n{ … })` only; `=>\n({` and `=> ({` are reported.
4. One-line literals allowed, but must be exploded when the line is **> 120 chars or > 5 properties/elements**
   (whichever first). Exploded = one property/element per line ("all or nothing").
   Applies only to object/array **value** literals – not to inline type literals (`let x: {a: string; …}`) nor
   destructuring patterns.
5. Autofix (move brace, explode literal).

### C. Switch case blocks (can live in B's rule or own rule)
`case X:` / `default:` body is a `{}` block on the next line. No blank line between `}` and the next `case`.
(Blank line before `break` is covered by the blank-line rules.)

### D. Type operators – custom `ressurectit/type-operator-spacing`
No spaces around `|` and `&` in types (`A|B`, `A&B`). Value operators keep spaces:
`@stylistic/space-infix-ops` with `ignoreTypes: true`. Autofix.

### E. Region titles – custom `ressurectit/region-titles` (report only, no fix, no suggestions)
1. Format: `//######################### <name> #########################` (exactly 25 `#` each side, single spaces).
2. Blank line before (unless first in block) and after the title. **Exception:** `constructor` title is directly
   followed by `constructor(` (no blank line, no JSDoc).
3. Applies only to titles directly inside a **class body**; classes need them only when non-trivial
   (*builder's call:* the rule does not require titles to exist; it validates those present). Titles in interfaces,
   spec `describe` blocks and file level (e.g. UPPERCASE titles in `app.providers.ts`) are ignored.
4. Allowed names, in required order (`<name>` = wildcard):
   1. `ng language server`
   2. `public static properties`
   3. `private fields`
   4. `protected fields`
   5. `protected properties`
   6. `protected properties - template bindings`
   7. `protected properties - host bindings`
   8. `protected properties - children`
   9. `protected properties - overrides`
   10. `public properties`
   11. `public properties - inputs`
   12. `public properties - outputs`
   13. `public properties - models`
   14. `public properties - implementation of <name>`
   15. `constructor`
   16. `public methods - static`
   17. `public methods - implementation of <name>`
   18. `public methods`
   19. `protected methods - template bindings`
   20. `protected methods - host listeners`
   21. `protected methods - overrides`
   22. `protected methods`
   23. `private methods`
5. Unknown names are reported. Legacy names (`public properties - children`, `public properties - template
   bindings`, `public methods - template bindings`) get a dedicated message ("use protected member + `protected …`
   title"). Typos are just unknown names.
6. Options: `names: string[]` – replaces the built-in list entirely, array order = required order;
   `additionalNames: string[]` – added to the active list, allowed anywhere, not order-checked.

### F. Wrapping parameters and arguments – custom rule (e.g. `ressurectit/argument-layout`)
1. Constructor with ≥ 2 params: each param on its own line, aligned with the first.
2. Other function/method declarations: wrap when **> 2 params AND line > 120 chars**, aligned with first.
3. Calls: wrap (2nd+ argument on new lines, aligned) when **line > 120 chars OR > 5 arguments**.
   Single lambda argument stays `fn(x =>` with body on next line. Single object argument follows B.4
   (one-line within limits, otherwise `fn(\n{`).
4. Trailing comma before `)`: **required** for wrapped declarations (constructors, functions, methods);
   **forbidden** for single-line declarations (incl. single-line constructors) and for all calls.
   `@stylistic/comma-dangle` set to `functions: 'ignore'`; literals keep `always-multiline`.
5. Autofix where unambiguous.

### The 120-character limit (applies to B.4, F.2, F.3)
- Never reported as "line too long" (no `max-len`); it only triggers wrapping, reported as `warn`.
- Measured on the physical line.
- At most **one report per over-long line**. Preference: wrap the **outermost multi-argument call** on the line
  (F.3); only if there is none, explode a one-line literal (B.4); if there is no candidate (e.g. long string),
  report nothing. F.2 (declarations) applies to declaration lines independently.

### G. Angular decorator metadata – custom `ressurectit/angular-metadata`
Applies to `@Component`, `@Directive`, `@NgModule` (*builder's call:* also `@Pipe`/`@Injectable` only for item 1).
1. Property order: `selector, standalone, templateUrl, template, styleUrl, styleUrls, styles, host, inputs, outputs,
   imports, providers, viewProviders, hostDirectives, changeDetection, encapsulation, schemas, animations, exportAs`
   (**`exportAs` always last**). NgModule: `imports, declarations, providers, exports, bootstrap, schemas`.
   Unknown properties allowed anywhere. Overridable via `order` option.
2. `imports`, `providers`, `host` always multi-line (even one item) – overrides B.4.
3. Arrays `imports, providers, viewProviders, declarations, exports` sorted by item text length ascending
   (non-identifiers measured by source text; `hostDirectives` skipped; equal length any order). **Autofix.**
4. Every metadata object multi-line with `(\n{` layout (from A/B), trailing comma (comma-dangle).
5. Member decorators on their own line; parameter decorators inline.

### H. Blank lines – `@stylistic/padding-line-between-statements`
1. `error`: blank line before and after `if/for/while/do/switch/try` unless first/last in block.
2. `error`: blank line before `return/throw/break/continue` unless first in block.
3. `warn`: blank line after a `const`/`let` group before other statements (consecutive declarations: any).
Also: `@stylistic/lines-between-class-members: always` (comments between members ok); `padded-blocks never`
(already); no blank line between JSDoc / decorators / member (custom check inside E's rule or B's – builder's choice).

### I. JSDoc – `eslint-plugin-jsdoc`
- Multi-line form only (`/**` ⏎ ` * text` ⏎ ` */`, aligned stars); no one-line `/** x */`.
- `@param name - description` (hyphen required).
- `require-jsdoc` as `warn` for classes, interfaces, type aliases, enums, top-level functions, exported consts,
  all class members incl. private ones, interface property signatures; **constructors exempt**; functions nested
  in functions / `describe` blocks not required.

### J. Imports – fix existing `ressurectit/imports-order`
Order: `@angular/core` → `@angular/core/*` → `@angular/*` → `@anglr/*` → `@jscrpt/common(/*)` → other `@jscrpt/*`
→ other scoped → other absolute → relative. Match by package name / path segment (not raw `startsWith`), so
`@angularx-foo` is not `@angular`. No ordering within a group. Keep option compatibility.
`imports-spacing` unchanged. Imports never wrapped (`object-curly-newline` `ImportDeclaration: never`).

### K. Config fixes to existing @stylistic rules
- `@stylistic/indent` off (replaced by A).
- `keyword-spacing`: keep `if(`/`for(`/`catch(` tight; add `after: true` for `case, of, in, const, let, new, typeof,
  instanceof, await, yield, delete, void`, `before: true` for `of, in, instanceof`.
- `space-before-function-paren`: add `catch: 'never'` (async arrow keeps space).
- core `curly: ['error'|'warn', 'all']`.
- Unchanged and confirmed: LF, eol-last, no tabs / trailing spaces, max 1 empty line, semi, single quotes,
  `arrow-parens as-needed`, `operator-linebreak after`, `dot-location property`, no inner padding in `{}`/`[]`/`()`.
- Spec files: same rules, no special casing (users may override for `**/*.spec.ts`).
- `spaced-comment` stays off.

## 6. Testing & verification

- `npm test`: `node:test` + `RuleTester` (typescript-eslint parser) per rule; replace the CJS stubs in `tests/`.
  Valid cases taken from real `srcUpgrade` snippets (with path in a comment), invalid cases with expected autofix output.
- Integration check (read-only): lint `~/git/chiroptera-trachops/srcUpgrade/app` with the new built plugin
  (temp config outside that repo); compare message counts per rule against the baseline (3681 messages); inspect
  remaining hits – they must be real deviations, not style false positives.

## 7. Left to the builder

- Exact rule names, file layout under `src/rules/`, message texts, option schemas beyond those listed.
- Whether B and C (and the JSDoc/decorator blank-line check) are one rule or several.
- How the forked indent is structured (vendor file + patches vs. rewritten handlers), as long as MIT notice is kept.
- Severity of rules not fixed in §5 (proposed `warn`).
- `padding-line-between-statements` needs two severities (H.1–2 error, H.3 warn): register it twice (e.g. a
  `ressurectit/` alias) or similar.
- `imports-order` currently has `schema: []`; no option compatibility to preserve.
