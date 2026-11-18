/**
 * @fileoverview Tests for type-operator-spacing rule
 */

import {ruleTester, dedent} from '../helpers/ruleTester.js';
import rule from '../../lib/rules/type-operator-spacing.js';

ruleTester.run('type-operator-spacing', rule,
{
    valid:
    [
        {
            code: dedent(`
                class Test
                {
                    private _style: HTMLStyleElement|undefined|null;
                }
            `)
        },
        {
            code: dedent(`
                class Test
                {
                    public items: Signal<Array<Hlasenie&Sprava>>;
                }
            `)
        },
        {
            code: 'const x = a | b & c;'
        },
        {
            code: dedent(`
                type X =
                    |A
                    |B;
            `)
        }
    ],
    invalid:
    [
        {
            code: dedent(`
                type X =
                    A |
                    B;
            `),
            output: dedent(`
                type X =
                    A|
                    B;
            `),
            errors: [{messageId: 'unexpectedSpace', data: {operator: '|'}}]
        },
        {
            code: 'let a: string | number;',
            output: 'let a: string|number;',
            errors: [{messageId: 'unexpectedSpace', data: {operator: '|'}}]
        },
        {
            code: 'type T = A &B;',
            output: 'type T = A&B;',
            errors: [{messageId: 'unexpectedSpace', data: {operator: '&'}}]
        },
        {
            code: dedent(`
                type X =
                    | A
                    | B;
            `),
            output: dedent(`
                type X =
                    |A
                    |B;
            `),
            errors: [
                {messageId: 'unexpectedSpace', data: {operator: '|'}},
                {messageId: 'unexpectedSpace', data: {operator: '|'}}
            ]
        }
    ]
});
