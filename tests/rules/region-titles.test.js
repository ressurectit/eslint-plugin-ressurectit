/**
 * @fileoverview Tests for region-titles rule
 */

import {ruleTester, dedent} from '../helpers/ruleTester.js';
import rule from '../../lib/rules/region-titles.js';

const ngLanguageServer = "export class ProgramContentCellTemplateDirective extends ContentCellTemplateDirective\n{\n    //######################### ng language server #########################\n\n    /**\n     * Allows typechecking for template\n     */\n    static override ngTemplateContextGuard(_dir: ContentCellTemplateDirective, _ctx: unknown): _ctx is GridDataCellContext<WTMSProgram>\n    {\n        return true;\n    }\n}";

const middleware = "export class ChiropteraMiddleware implements WsMiddleware<unknown, Record<string, unknown>, unknown, unknown, Record<string, unknown>>\n{\n    //######################### public static properties #########################\n\n    /**\n     * String identification of middleware\n     */\n    public static id: string = 'ChiropteraMiddleware';\n\n    //######################### public methods - implementation of RestMiddleware #########################\n\n    /**\n     * @inheritdoc\n     */\n    public run(this: StompJsWsClientBase,\n               _id: string,\n               _target: unknown,\n               _methodName: string,\n               _descriptor: unknown,\n               _args: unknown[],\n               request: WsRequest<unknown>|WsSubscribeRequest|WsNoRequest,\n               next: WsMiddlewareRunNextMethod<unknown, Record<string, unknown>>): WsResponse<Record<string, unknown>>\n    {\n    }\n}";

const appComponent = "export class AppComponent implements AfterViewInit, OnDestroy\n{\n    //######################### private fields #########################\n\n    /**\n     * Html style element for override\n     */\n    private _style: HTMLStyleElement|undefined|null;\n\n    /**\n     * Subscription for router outlet activation changes\n     */\n    private _routerOutletActivatedSubscription: Subscription|undefined|null;\n\n    /**\n     * Subscription for changes of general settings\n     */\n    private _settingsChangeSubscription: Subscription;\n\n    /**\n     * Subscription for changes of debugging settings\n     */\n    private _settingsDebuggingChangeSubscription: Subscription;\n\n    /**\n     * Subscriptions created during initialization\n     */\n    private _initSubscriptions: Subscription = new Subscription();\n\n    /**\n     * Currently active theme\n     */\n    private _theme: string;\n\n    //######################### public properties - template bindings #########################\n\n    /**\n     * Indication whether is console visible\n     */\n    public consoleVisible: WritableSignal<boolean> = signal(false);\n\n    /**\n     * Name of state for routed component animation\n     */\n    public routeComponentState: string = 'none';\n\n    /**\n     * Current version of gui\n     */\n    public guiVersion: string = version.version;\n\n    /**\n     * Indication whether is application initialized\n     */\n    public initialized: boolean = false;\n\n    //######################### public properties - children #########################\n\n    /**\n     * Router outlet that is used for loading routed components\n     */\n    @ViewChild('outlet')\n    public routerOutlet: RouterOutlet|undefined|null;\n}";

const appProviders = "export const appProviders: (Provider|EnvironmentProviders)[] =\n[\n    //######################### ROUTER #########################\n    provideRouter(routes,\n                  withComponentInputBinding()),\n\n    //######################### CLIENT HYDRATION #########################\n    provideClientHydration(),\n\n    //######################### HTTP CLIENT #########################\n    provideHttpClient(withInterceptorsFromDi(),)," + '\n];';

/**
 * Creates region title comment
 * @param name - Name of region
 * @returns Region title
 */
function title(name)
{
    return `//${'#'.repeat(25)} ${name} ${'#'.repeat(25)}`;
}

/**
 * Creates class with one member per title, optional extra options
 * @param names - Titles in order
 * @returns Source code of class
 */
function skeleton(names)
{
    return 'class A\n{\n' + names.map((name, index) => `    ${title(name)}\n\n    /**\n     * Member\n     */\n    public m${index}: string;\n`).join('\n') + '}';
}

ruleTester.run('region-titles', rule,
{
    valid:
    [
        {name: 'ng language server first in block', code: ngLanguageServer},
        {name: 'static properties then implementation methods', code: middleware},
        {
            name: 'skeleton class (hodnotenie.component.ts title sequence)',
            code: dedent(`
                export class HodnotenieComponent
                {
                    ${title('private fields')}

                    private _a: string;

                    ${title('protected properties - template bindings')}

                    protected b: string;

                    ${title('public properties - inputs')}

                    public c: string;

                    ${title('constructor')}
                    constructor()
                    {
                    }

                    ${title('protected methods - template bindings')}

                    protected d(): void
                    {
                    }
                }
            `),
        },
        {name: 'uppercase titles in array are ignored', code: appProviders},
        {
            name: 'titles in interface are ignored',
            code: 'interface A\n{\n    //#### whatever\n    a: string;\n    //' + '#'.repeat(25) + 'x' + '#'.repeat(25) + '\n    b: string;\n}',
        },
        {
            name: 'titles in describe are ignored',
            code: `describe('x', () =>\n{\n    //${'#'.repeat(25)} helpers ${'#'.repeat(25)}\n    it('a', () =>\n    {\n    });\n});`,
        },
        {
            name: 'additionalNames allowed anywhere',
            code: skeleton(['private fields', 'helpers', 'public properties', 'helpers']),
            options: [{additionalNames: ['helpers']}],
        },
        {
            name: 'custom names in given order',
            code: skeleton(['b', 'a']),
            options: [{names: ['b', 'a']}],
        },
        {
            name: 'repeated titles allowed',
            code: skeleton(['private fields', 'private fields']),
        },
        {
            name: 'wildcard names',
            code: skeleton(['public properties - implementation of OnInit', 'public methods - implementation of OnInit']),
        },
        {
            name: 'any known title directly followed by constructor skips blank line after',
            code: dedent(`
                class A
                {
                    ${title('public properties')}
                    constructor()
                    {
                    }
                }
            `),
        },
    ],
    invalid:
    [
        {
            name: 'legacy names (app.component.ts)',
            code: appComponent,
            errors:
            [
                {messageId: 'legacyName', line: 35, data: {name: 'public properties - template bindings'}},
                {messageId: 'legacyName', line: 57, data: {name: 'public properties - children'}},
            ],
        },
        {
            name: 'public methods before private fields',
            code: skeleton(['public methods', 'private fields']),
            errors: [{messageId: 'wrongOrder', data: {name: 'private fields', previous: 'public methods'}}],
        },
        {
            name: 'unknown name',
            code: skeleton(['public method']),
            errors: [{messageId: 'unknownName', data: {name: 'public method'}}],
        },
        {
            name: 'additionalNames not order checked but unknown otherwise',
            code: skeleton(['helpers', 'other']),
            options: [{additionalNames: ['helpers']}],
            errors: [{messageId: 'unknownName', data: {name: 'other'}}],
        },
        {
            name: 'names option reversed order',
            code: skeleton(['a', 'b']),
            options: [{names: ['b', 'a']}],
            errors: [{messageId: 'wrongOrder', data: {name: 'b', previous: 'a'}}],
        },
        {
            name: 'names option replaces built-in list',
            code: skeleton(['private fields']),
            options: [{names: ['a']}],
            errors: [{messageId: 'unknownName'}],
        },
        {
            name: '8 hashes',
            code: 'class A\n{\n    //' + '#'.repeat(8) + ' private fields ' + '#'.repeat(8) + '\n\n    public a: string;\n}',
            errors: [{messageId: 'invalidFormat'}],
        },
        {
            name: 'no single spaces',
            code: 'class A\n{\n    //' + '#'.repeat(25) + 'private fields' + '#'.repeat(25) + '\n\n    public a: string;\n}',
            errors: [{messageId: 'invalidFormat'}],
        },
        {
            name: 'blank line before',
            code: dedent(`
                class A
                {
                    public a: string;
                    ${title('private fields')}

                    private b: string;
                }
            `),
            errors: [{messageId: 'blankLineBefore'}],
        },
        {
            name: 'blank line after, directly followed by jsdoc',
            code: dedent(`
                class A
                {
                    ${title('private fields')}
                    /**
                     * B
                     */
                    private b: string;
                }
            `),
            errors: [{messageId: 'blankLineAfter'}],
        },
        {
            name: 'unknown title constructors directly followed by constructor reports only unknown name (userSettings.component.ts:98)',
            code: dedent(`
                export class UserSettingsComponent
                {
                    /**
                     * User settings section enum
                     */
                    public UserSettingsSections = UserSettingsSections;

                    ${title('constructors')}
                    constructor(settingsSvc: SettingsService,
                                formBuilder: FormBuilder,
                                debugDataEnabled: DebugDataEnabledService,)
                    {
                    }
                }
            `),
            errors: [{messageId: 'unknownName', line: 8, data: {name: 'constructors'}}],
        },
        {
            name: 'constructor title followed by blank line',
            code: dedent(`
                class A
                {
                    ${title('constructor')}

                    constructor()
                    {
                    }
                }
            `),
            errors: [{messageId: 'constructorTitle'}],
        },
        {
            name: 'constructor title followed by jsdoc',
            code: dedent(`
                class A
                {
                    ${title('constructor')}
                    /**
                     * Ctor
                     */
                    constructor()
                    {
                    }
                }
            `),
            errors: [{messageId: 'constructorTitle'}],
        },
    ],
});
