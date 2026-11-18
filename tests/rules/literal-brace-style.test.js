/**
 * @fileoverview Tests for literal-brace-style rule
 */

import {ruleTester, dedent} from '../helpers/ruleTester.js';
import rule from '../../lib/rules/literal-brace-style.js';

const error = (messageId, data) => ({messageId, ...(data ? {data} : {})});

ruleTester.run('literal-brace-style', rule,
{
    valid:
    [
        //app.providers.ts, array on own line with nested object on own line
        dedent(`
            export const appProviders: (Provider|EnvironmentProviders)[] =
            [
                provideRouter(routes,
                              withComponentInputBinding()),
                provideScrollbarOptions(
                {
                    visibility: 'hover',
                    appearance: 'compact',
                }),
            ];
        `),
        //return { inside function
        dedent(`
            function a()
            {
                return {
                    a: 1,
                    b: 2,
                };
            }
        `),
        //return <T>{
        dedent(`
            const p =
            [
                function a()
                {
                    return <FormatProvider>{
                        a: 1,
                    };
                },
            ];
        `),
        //return {…} as T, app/pages/+mosia/misc/components/hlavnyUkazovatel/hlavnyUkazovatel.component.spec.ts:45 (b742834)
        dedent(`
            function createItem(overrides: Partial<HlavnyUkazovatel> = {}): HlavnyUkazovatel
            {
                return {
                    nazov: 'Naklady',
                    ...overrides,
                } as HlavnyUkazovatel;
            }
        `),
        //return {…} as unknown as T, app/pages/+poistenec/history/misc/components/drgInfoLine/drgInfoLine.component.spec.ts:20 (b742834)
        dedent(`
            function drg(data: Record<string, unknown> = {}): WsDrgSkupina
            {
                return {
                    osetrovaciaDoba: 5,
                    ...data,
                } as unknown as WsDrgSkupina;
            }
        `),
        //return […] as T[], app/pages/+poistenec/history/misc/components/rozhodnutia/rozhodnutia.component.spec.ts:108 (b742834)
        dedent(`
            function createDetaily(): WsRozhodnutieDetail[]
            {
                return [
                    {uuid: 'd1', kod: 'KOD1'},
                    {uuid: 'd2', kod: 'KOD2'},
                ] as WsRozhodnutieDetail[];
            }
        `),
        //return {…} satisfies T
        dedent(`
            function create(): Item
            {
                return {
                    kod: 'A',
                } satisfies Item;
            }
        `),
        //spread of multi-line array, '[' cannot leave '...' (rest-spread-spacing), app/pages/+poistenec/history/misc/services/poistenecInputData/poistenecInputData.service.ts:364 (b742834)
        dedent(`
            responsePromises.push(
            ...[
                this.handlePsPripadQueue(response.queues.pspripad),
                this.handleLsPripadQueue(response.queues.lspripad),
            ]);
        `),
        //negated multi-line array, '[' cannot leave '!' (space-unary-ops), exploded form of app/pages/+poistenec/history/misc/components/hospArg/hospArg.component.ts:229 (b742834)
        dedent(`
            const css =
            {
                'light-text-color': ![
                    'OPERATOR',
                    'JUBULA',
                    'MOSIA',
                ].includes(value.povod ?? '') && !value.drgRelevant && !onlyCode,
            };
        `),
        //=> (\n{
        dedent(`
            const s = items.map(x => (
            {
                kod: x,
            }));
        `),
        //interface with type literal on its own line
        dedent(`
            export interface HodnotenieData
            {
                a: string;
                b:
                {
                    c: number;
                };
            }
        `),
        //enum
        dedent(`
            export enum EditDirection
            {
                None = 'None',
                Up = 'Up',
            }
        `),
        //one-line literals
        '@Injectable({providedIn: \'root\'})\nexport class A {}',
        'const a = [1, 2];',
        //opener after 'return' / 'throw' / 'yield' cannot leave the keyword (ASI), rule is silent
        'function a()\n{\n    return {\n        a: 1,\n    } || b;\n}',
        'function a(y)\n{\n    return [\n        1,\n        2,\n    ].includes(y);\n}',
        'throw {\n    a: 1,\n};',
        'function* a()\n{\n    yield {\n        a: 1,\n    };\n}',
    ],
    invalid:
    [
        //binary operator before opener is not a prefix operator, opener moves to own line
        {
            code: 'const x = a.concat(b) + [\n    1,\n].length;',
            output: 'const x = a.concat(b) +\n[\n    1,\n].length;',
            errors: [error('openerOnOwnLine', {opener: '[', kind: 'array literal'})],
        },
        {
            code: 'const x = {\n    a: 1,\n};',
            output: 'const x =\n{\n    a: 1,\n};',
            errors: [error('openerOnOwnLine', {opener: '{', kind: 'object literal'})],
        },
        {
            code: 'this.router.navigate([\n    \'a\',\n]);',
            output: 'this.router.navigate(\n[\n    \'a\',\n]);',
            errors: [error('openerOnOwnLine', {opener: '[', kind: 'array literal'})],
        },
        {
            code: 'interface A {\n    a: string;\n}',
            output: 'interface A\n{\n    a: string;\n}',
            errors: [error('openerOnOwnLine', {opener: '{', kind: 'interface body'})],
        },
        {
            code: 'enum E {\n    A = 1,\n}',
            output: 'enum E\n{\n    A = 1,\n}',
            errors: [error('openerOnOwnLine', {opener: '{', kind: 'enum body'})],
        },
        {
            code: 'let x: {\n    a: string;\n};',
            output: 'let x:\n{\n    a: string;\n};',
            errors: [error('openerOnOwnLine', {opener: '{', kind: 'type literal'})],
        },
        {
            code: 'function a()\n{\n    const y = {\n        a: 1,\n    };\n}',
            output: 'function a()\n{\n    const y =\n    {\n        a: 1,\n    };\n}',
            errors: [error('openerOnOwnLine')],
        },
        //arrow in function (cisSuvisiaciKod.directive.ts)
        {
            code: dedent(`
                function a()
                {
                    return result.map(itm => ({
                        value: signal(itm),
                        group: signal(null),
                    }));
                }
            `),
            output: dedent(`
                function a()
                {
                    return result.map(itm => (
                    {
                        value: signal(itm),
                        group: signal(null),
                    }));
                }
            `),
            errors: [error('arrowObjectLayout')],
        },
        {
            code: 'const s = items.map(x =>\n    ({\n        kod: x,\n    }));',
            output: 'const s = items.map(x => (\n{\n        kod: x,\n    }));',
            errors: [error('arrowObjectLayout')],
        },
        //comment between opener and owner, no fix
        {
            code: 'const x = /* c */ {\n    a: 1,\n};',
            output: null,
            errors: [error('openerOnOwnLine')],
        },
        {
            code: 'const s = items.map(x => /* c */ ({\n    a: 1,\n}));',
            output: null,
            errors: [error('arrowObjectLayout')],
        },
    ],
});
