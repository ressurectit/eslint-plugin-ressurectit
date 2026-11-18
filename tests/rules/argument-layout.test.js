/**
 * @fileoverview Tests for argument-layout rule
 */

import {ruleTester, dedent} from '../helpers/ruleTester.js';
import rule from '../../lib/rules/argument-layout.js';

const wrappedCtor = dedent(`
    class A
    {
        constructor(authSvc: AuthenticationService,
                    private _appHotkeys: AppHotkeysService,
                    @Inject(LOGGER) logger: Logger,
                    @Inject(DOCUMENT) private _document: Document,)
        {
            logger.verbose('Application is starting, main component constructed.');
        }
    }
`);

const longTwoParams = dedent(`
    function getAsyncTasksResponseTransform(this: RESTClientBase, response: Observable<PagedData<AsyncTask>>): Observable<PagedData<AsyncTask>>
    {
        return response;
    }
`);

const jubulaInput = dedent(`
    class A
    {
        public getHistory(idPoistenec: number,
                          idProduktu?: string|null,
                          idPripadu?: string|null,
                          idUlohy?: string|null,
                          idIsProdukt?: string|null,
                          idIsPripad?: string|null,
                          idBenefit?: string|null): WsResponse<HistoriaWsResponse>
        {
        }
    }
`);

const longDeclaration = '    public getHistory(idPoistenec: number, idProduktu?: string|null, idPripadu?: string|null, idUlohy?: string|null): WsResponse<HistoriaWsResponse>';

ruleTester.run('argument-layout', rule,
{
    valid:
    [
        wrappedCtor,
        longTwoParams,
        'class A\n{\n    constructor(private _a: A)\n    {\n    }\n}',
        'function f(a: string,\n           ...rest: string[])\n{\n}',
        'const f = (a, b, c,) => a;',
        'provideHttpClient(withInterceptorsFromDi());',
        'foo(a,\n    b);',
    ],
    invalid:
    [
        {
            code: jubulaInput,
            errors: [{messageId: 'trailingCommaRequired'}],
            output: jubulaInput.replace('idBenefit?: string|null)', 'idBenefit?: string|null,)'),
        },
        {
            code: 'provideHttpClient(withInterceptorsFromDi(),);',
            errors: [{messageId: 'trailingCommaForbidden'}],
            output: 'provideHttpClient(withInterceptorsFromDi());',
        },
        {
            code: 'function f(a: string,) {}',
            errors: [{messageId: 'trailingCommaForbidden'}],
            output: 'function f(a: string) {}',
        },
        {
            code: 'new Foo(a,);',
            errors: [{messageId: 'trailingCommaForbidden'}],
            output: 'new Foo(a);',
        },
        {
            code: 'function f(a: string, /* c */) {}',
            errors: [{messageId: 'trailingCommaForbidden'}],
            output: null,
        },
        {
            code: 'class A\n{\n    constructor(private _a: A, private _b: B)\n    {\n    }\n}',
            errors: [{messageId: 'constructorParamsWrap', line: 3, column: 16}],
            output: 'class A\n{\n    constructor(private _a: A,\n                private _b: B,)\n    {\n    }\n}',
        },
        {
            code: `class A\n{\n${longDeclaration}\n    {\n    }\n}`,
            errors: [{messageId: 'paramsWrap', line: 3, column: 22}],
            output: 'class A\n{\n    public getHistory(idPoistenec: number,\n' +
                    ' '.repeat(22) + 'idProduktu?: string|null,\n' +
                    ' '.repeat(22) + 'idPripadu?: string|null,\n' +
                    ' '.repeat(22) + 'idUlohy?: string|null,): WsResponse<HistoriaWsResponse>\n    {\n    }\n}',
        },
        {
            code: 'function f(a: string, b: string, c: string) {}',
            options: [{maxLength: 20}],
            errors: [{messageId: 'paramsWrap'}],
            output: 'function f(a: string,\n           b: string,\n           c: string,) {}',
        },
        {
            code: 'function f(a: string, b: string, ...c: string[]) {}',
            options: [{maxLength: 20}],
            errors: [{messageId: 'paramsWrap'}],
            output: 'function f(a: string,\n           b: string,\n           ...c: string[]) {}',
        },
    ],
});
