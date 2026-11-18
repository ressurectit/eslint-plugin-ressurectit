# Checks Angular decorator metadata (angular-metadata)

Rule which checks metadata object of Angular decorators imported from `@angular/core` (aliases are supported). Decorators with the same name imported from other packages are ignored.

## Rule Details

 - **G.1 property order** (`propertyOrder`, all decorators, report only): known properties must be in the order below, unknown properties may be anywhere.
   - `Component`, `Directive`: `selector, standalone, templateUrl, template, styleUrl, styleUrls, styles, host, inputs, outputs, imports, providers, viewProviders, hostDirectives, changeDetection, encapsulation, schemas, animations, exportAs`
   - `NgModule`: `imports, declarations, providers, exports, bootstrap, schemas`
   - `Pipe`: `name, standalone, pure`
   - `Injectable`: `providedIn`
 - **G.2 multi-line literals** (`mustBeMultiline`, `Component`/`Directive`/`NgModule`): non-empty `imports`, `providers` and `host` must have the opening bracket on its own line, each item on its own line and the closing bracket on its own line. Fixable (not when comments are inside or an item spans more lines).
 - **G.3 array item order** (`arrayOrder`, `Component`/`Directive`/`NgModule`): items of `imports`, `providers`, `viewProviders`, `declarations` and `exports` must be sorted by source text length, shortest first (stable). Fixable by swapping item texts in place, not when comments are inside. Arrays with spread elements are skipped. `hostDirectives` is never sorted.
 - **G.4 multi-line metadata** (`metadataMultiline`, `Component`/`Directive`/`NgModule`): the metadata object must span more than one line. Fixable, not when comments are inside.

Examples of **incorrect** code:

```ts
@Component({selector: 'a', template: ''})
export class A {}

@Component(
{
    templateUrl: 'a.html',
    selector: 'a',
    imports:
    [
        MainMenuComponent,
        Console,
    ],
})
export class B {}
```

Examples of **correct** code:

```ts
@Component(
{
    selector: 'a',
    templateUrl: 'a.html',
    imports:
    [
        Console,
        MainMenuComponent,
    ],
})
export class A {}
```

## Options

```json
{
    "ressurectit/angular-metadata": ["warn", {"order": {"Pipe": ["name", "pure", "standalone"]}}]
}
```

`order` optionally replaces the default property order of `Component`, `Directive`, `NgModule`, `Pipe` or `Injectable`.
