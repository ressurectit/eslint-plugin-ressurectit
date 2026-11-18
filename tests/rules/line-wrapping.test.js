/**
 * @fileoverview Tests for line-wrapping rule
 */

import {ruleTester, dedent} from '../helpers/ruleTester.js';
import rule from '../../lib/rules/line-wrapping.js';

const lekarRows = `
class A
{
    protected readonly lekarRows: Signal<OverviewRow[]> = computed(() => createUtvarRows(this.data()?.poskytovatelia,
                                                                                         this.mosiaId().isSpecificLekar,
                                                                                         'Lekár celkovo (všetky pracoviská)',
                                                                                         this.lavaStrana()?.['LEK-I1']?.meta,
                                                                                         this.lavaStrana()?.['LEK-I2']?.meta));
}
`;

const appComponent = `
class A
{
    m()
    {
        this._initSubscriptions.add(authSvc.authenticationChanged.subscribe(identity => this._setDebugHotkeys(identity?.permissions || [])));
    }
}
`;

ruleTester.run('line-wrapping', rule,
{
    valid:
    [
        {
            name: 'long line with only single-argument calls and an empty array (app.component.ts:155)',
            code: appComponent,
        },
        {
            name: 'already wrapped call (hodnotenie.component.ts:436-440)',
            code: lekarRows,
        },
        {
            name: 'long import',
            code: "import {FirstUppercaseLocalizePipe, LocalizePipe, TooltipDirective, WithPageContentCssClass, Something} from '@anglr/common';",
        },
        {
            name: 'long template literal with call inside expression',
            code: 'const s = `some quite long text that is placed in the template literal ${fn(aaaa, bbbb)} and continues even further and further`;',
        },
        {
            name: 'type literal is not a value literal',
            code: 'let x: {a: string; b: string; c: string; d: string; e: string; f: string};',
        },
        {
            name: 'destructuring pattern is not a value literal',
            code: 'const {a, b, c, d, e, f} = obj;',
        },
        {
            name: 'short line, at most 5 arguments and properties',
            code: 'fn(a, b, c, d, e);\nconst o = {a: 1, b: 2, c: 3, d: 4, e: 5};',
        },
        {
            name: 'maxItems option',
            code: 'fn(a, b, c, d, e, f);',
            options: [{maxItems: 6}],
        },
        {
            name: 'literal after spread is not exploded, opener cannot leave the operator',
            code: 'const a = [...[1, 2, 3, 4, 5, 6], 7];',
        },
        {
            name: 'literal after prefix unary operator is not exploded, opener cannot leave the operator',
            code: 'const a = ![1, 2, 3, 4, 5, 6].includes(x);',
        },
    ],
    invalid:
    [
        {
            name: 'outermost multi-argument call is wrapped (hodnotenie.component.ts:665)',
            code: 'const sprava = await lastValueFrom(this._hodnotenieSvc.createNote(this.detailId(), result.aktualne ? this.mosiaId().obdobie : null, result.text).pipe(handleError(this._notifications)), {defaultValue: undefined});',
            output: 'const sprava = await lastValueFrom(this._hodnotenieSvc.createNote(this.detailId(), result.aktualne ? this.mosiaId().obdobie : null, result.text).pipe(handleError(this._notifications)),\n' +
                    ' '.repeat(35) + '{defaultValue: undefined});',
            errors: [{messageId: 'wrapArguments', line: 1, column: 22}],
        },
        {
            name: 'literal in arrow body is exploded (hodnotenie.component.ts:191)',
            code: dedent(`
                function f()
                {
                    const rest: OverviewRow[] = items.filter(itm => !itm.sumarny).map(data => ({data, i1, i2, label: null, indent: true}));
                }
            `),
            output: dedent(`
                function f()
                {
                    const rest: OverviewRow[] = items.filter(itm => !itm.sumarny).map(data => (
                    {
                        data,
                        i1,
                        i2,
                        label: null,
                        indent: true,
                    }));
                }
            `),
            errors: [{messageId: 'explodeLiteral', data: {kind: 'property'}}],
        },
        {
            name: 'value literal exploded, type literals ignored (hodnotenie.component.ts:552)',
            code: dedent(`
                class A
                {
                    protected readonly obdobieForm: FieldTree<{obdobie: string|null}> = form(linkedSignal<{obdobie: string|null}>(() => ({obdobie: this.mosiaId().obdobie})));
                }
            `),
            output: dedent(`
                class A
                {
                    protected readonly obdobieForm: FieldTree<{obdobie: string|null}> = form(linkedSignal<{obdobie: string|null}>(() => (
                    {
                        obdobie: this.mosiaId().obdobie,
                    })));
                }
            `),
            errors: [{messageId: 'explodeLiteral'}],
        },
        {
            name: 'call wins over literal on the same line (after hodnotenie.component.ts:382)',
            code: dedent(`
                const rows = [
                    {label: texts?.prvy, tooltip: texts?.prvyTooltip, value: getAttr(atributy, i1?.nalepkaMosia, i1?.indikator ?? ''), meta: i1},
                ];
            `),
            output: dedent(`
                const rows = [
                    {label: texts?.prvy, tooltip: texts?.prvyTooltip, value: getAttr(atributy,
                ${' '.repeat(69)}i1?.nalepkaMosia,
                ${' '.repeat(69)}i1?.indikator ?? ''), meta: i1},
                ];
            `),
            errors: [{messageId: 'wrapArguments', line: 2}],
        },
        {
            name: 'more than 5 arguments on a short line',
            code: 'fn(a, b, c, d, e, f);',
            output: 'fn(a,\n   b,\n   c,\n   d,\n   e,\n   f);',
            errors: [{messageId: 'wrapArguments'}],
        },
        {
            name: 'more than 5 properties on a short line',
            code: 'const o = {a: 1, b: 2, c: 3, d: 4, e: 5, f: 6};',
            output: dedent(`
                const o =
                {
                    a: 1,
                    b: 2,
                    c: 3,
                    d: 4,
                    e: 5,
                    f: 6,
                };
            `),
            errors: [{messageId: 'explodeLiteral', data: {kind: 'property'}}],
        },
        {
            name: 'more than 5 elements of an array, existing trailing comma kept',
            code: 'const a = [1, 2, 3, 4, 5, 6,];',
            output: 'const a =\n[\n    1,\n    2,\n    3,\n    4,\n    5,\n    6,\n];',
            errors: [{messageId: 'explodeLiteral', data: {kind: 'element'}}],
        },
        {
            name: 'only the qualifying inner literal is reported (outer array has 2 elements on a short line)',
            code: 'const x = [{a: 1, b: 2, c: 3, d: 4, e: 5, f: 6}, {g: 1}];',
            output: 'const x = [\n{\n    a: 1,\n    b: 2,\n    c: 3,\n    d: 4,\n    e: 5,\n    f: 6,\n}, {g: 1}];',
            errors: [{messageId: 'explodeLiteral', column: 12}],
        },
        {
            name: 'return literal keeps the opener on the return line (B.2)',
            code: dedent(`
                function f()
                {
                    return {a: 1, b: 2, c: 3, d: 4, e: 5, f: 6};
                }
            `),
            output: dedent(`
                function f()
                {
                    return {
                        a: 1,
                        b: 2,
                        c: 3,
                        d: 4,
                        e: 5,
                        f: 6,
                    };
                }
            `),
            errors: [{messageId: 'explodeLiteral'}],
        },
        {
            name: 'return <T> literal keeps the opener on the return line (B.2)',
            code: 'function f()\n{\n    return <T>[1, 2, 3, 4, 5, 6];\n}',
            output: 'function f()\n{\n    return <T>[\n        1,\n        2,\n        3,\n        4,\n        5,\n        6,\n    ];\n}',
            errors: [{messageId: 'explodeLiteral', data: {kind: 'element'}}],
        },
        {
            name: 'return literal with member call keeps the opener on the return line (no ASI)',
            code: 'function f()\n{\n    return [1, 2, 3, 4, 5, 6].map(x => x);\n}',
            output: 'function f()\n{\n    return [\n        1,\n        2,\n        3,\n        4,\n        5,\n        6,\n    ].map(x => x);\n}',
            errors: [{messageId: 'explodeLiteral', data: {kind: 'element'}}],
        },
        {
            name: 'return literal with as assertion keeps the opener on the return line (no ASI)',
            code: 'function f()\n{\n    return {a: 1, b: 2, c: 3, d: 4, e: 5, f: 6} as T;\n}',
            output: 'function f()\n{\n    return {\n        a: 1,\n        b: 2,\n        c: 3,\n        d: 4,\n        e: 5,\n        f: 6,\n    } as T;\n}',
            errors: [{messageId: 'explodeLiteral', data: {kind: 'property'}}],
        },
        {
            name: 'yield literal keeps the opener on the yield line (no ASI)',
            code: 'function* f()\n{\n    yield {a: 1, b: 2, c: 3, d: 4, e: 5, f: 6};\n}',
            output: 'function* f()\n{\n    yield {\n        a: 1,\n        b: 2,\n        c: 3,\n        d: 4,\n        e: 5,\n        f: 6,\n    };\n}',
            errors: [{messageId: 'explodeLiteral', data: {kind: 'property'}}],
        },
        {
            name: 'throw literal keeps the opener on the throw line (no ASI)',
            code: 'function f()\n{\n    throw {a: 1, b: 2, c: 3, d: 4, e: 5, f: 6};\n}',
            output: 'function f()\n{\n    throw {\n        a: 1,\n        b: 2,\n        c: 3,\n        d: 4,\n        e: 5,\n        f: 6,\n    };\n}',
            errors: [{messageId: 'explodeLiteral', data: {kind: 'property'}}],
        },
        {
            name: 'comment inside the literal: report without fix',
            code: 'const o = {a: 1, /* note */ b: 2, c: 3, d: 4, e: 5, f: 6};',
            output: null,
            errors: [{messageId: 'explodeLiteral'}],
        },
        {
            name: 'comment inside the arguments: report without fix',
            code: 'fn(a, /* note */ b, c, d, e, f);',
            output: null,
            errors: [{messageId: 'wrapArguments'}],
        },
        {
            name: 'maxLength option',
            code: 'fn(aaaa, bbbb);',
            output: 'fn(aaaa,\n   bbbb);',
            options: [{maxLength: 10}],
            errors: [{messageId: 'wrapArguments'}],
        },
        {
            name: 'exported declaration is checked',
            code: 'export const o = {a: 1, b: 2, c: 3, d: 4, e: 5, f: 6};',
            output: 'export const o =\n{\n    a: 1,\n    b: 2,\n    c: 3,\n    d: 4,\n    e: 5,\n    f: 6,\n};',
            errors: [{messageId: 'explodeLiteral'}],
        },
    ],
});
