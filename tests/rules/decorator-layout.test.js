/**
 * @fileoverview Tests for decorator-layout rule
 */

import {ruleTester, dedent} from '../helpers/ruleTester.js';
import rule from '../../lib/rules/decorator-layout.js';

ruleTester.run('decorator-layout', rule,
{
    valid:
    [
        {
            code: 'const x = @Dec() class {};',
        },
        {
            code: dedent(`
                class A
                {
                    /**
                     * Gets information about user
                     * @returns Observable
                     */
                    @ResponseTransform(getUserIdentityResponseTransform)
                    @FullHttpResponse()
                    @DisableInterceptor(SuppressAuthInterceptor)
                    @DisableInterceptor(AuthInterceptor)
                    @DisableInterceptor(ServiceUnavailableInterceptor)
                    @DisableInterceptor(HttpGatewayTimeoutInterceptor)
                    @DisableInterceptor(NoConnectionInterceptor)
                    @GET('myaccount')
                    public getUserIdentity(): Observable<UserIdentity>
                    {
                        return NEVER;
                    }
                }
            `),
        },
        {
            code: dedent(`
                /**
                 * Service used to access async tasks
                 */
                @Injectable()
                @BaseUrl(\`\${config.configuration.apiBaseUrl}asynctask\`)
                @DefaultHeaders(config.configuration.defaultApiHeaders)
                export class AsynctaskService extends RESTClient
                {
                    //######################### public methods #########################

                    /**
                     * Gets array of async tasks
                     * @param _paging - Paging of requested data
                     */
                    @ResponseTransform(getAsyncTasksResponseTransform)
                    @GET('/moje/platne')
                    public getAsyncTasks(@QueryObject @ParameterTransform(gridPagingToPageable) _paging?: GridPaging): Observable<PagedData<AsyncTask>>
                    {
                        return NEVER;
                    }
                }
            `),
        },
        {
            code: dedent(`
                class A
                {
                    /**
                     * Router outlet that is used for loading routed components
                     */
                    @ViewChild('outlet')
                    public routerOutlet: RouterOutlet|undefined|null;

                    //######################### constructor #########################
                    constructor(authSvc: AuthenticationService,
                                private _appHotkeys: AppHotkeysService,
                                @Inject(LOGGER) logger: Logger,
                                @Inject(DOCUMENT) private _document: Document,)
                    {
                    }
                }
            `),
        },
        {
            code: '/**\n * @fileoverview Header of file\n */\n\nimport {A} from \'a\';\n',
        },
        {
            code: '/**\n * @fileoverview Header of file\n */\n\nexport class A\n{\n}\n',
        },
    ],
    invalid:
    [
        {
            code: '/**\n * Doc\n */\n\nexport function f()\n{\n}\n',
            output: '/**\n * Doc\n */\nexport function f()\n{\n}\n',
            errors: [{messageId: 'blankLineAfterJsdoc'}],
        },
        {
            code: 'class A\n{\n    /**\n     * Doc\n     */\n\n    public m(): void\n    {\n    }\n}\n',
            output: 'class A\n{\n    /**\n     * Doc\n     */\n    public m(): void\n    {\n    }\n}\n',
            errors: [{messageId: 'blankLineAfterJsdoc'}],
        },
        {
            code: 'class A\n{\n    @Input()\n\n    public x: string;\n}\n',
            output: 'class A\n{\n    @Input()\n    public x: string;\n}\n',
            errors: [{messageId: 'blankLineAfterDecorator'}],
        },
        {
            code: 'class A\n{\n    @Input() public x: string;\n}\n',
            output: 'class A\n{\n    @Input()\n    public x: string;\n}\n',
            errors: [{messageId: 'decoratorOwnLine'}],
        },
        {
            code: '@Injectable() export class A\n{\n}\n',
            output: '@Injectable()\nexport class A\n{\n}\n',
            errors: [{messageId: 'decoratorOwnLine'}],
        },
        {
            code: 'class A\n{\n    constructor(@Inject(X)\n                x: X)\n    {\n    }\n}\n',
            output: 'class A\n{\n    constructor(@Inject(X) x: X)\n    {\n    }\n}\n',
            errors: [{messageId: 'parameterDecoratorInline'}],
        },
    ],
});
