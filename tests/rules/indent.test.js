/**
 * @fileoverview Tests for indent rule
 */

import {ruleTester, dedent} from '../helpers/ruleTester.js';
import rule from '../../lib/rules/indent/index.js';

/**
 * Creates expected errors for lines
 * @param {number[]} lines - Lines with wrong indentation
 * @returns {object[]} Expected errors
 */
function errorsAt(...lines)
{
    return lines.map(line => ({messageId: 'wrongIndentation', line}));
}

ruleTester.run('indent', rule,
{
    valid:
    [
        //v1 A.3 aligned pipe: lambda `{` at first-argument column, `forkJoin(\n[` collapses inside it
        //source (b742834): services/api/asynctask/asynctask.service.ts:15-39
        dedent(`
                function getAsyncTasksResponseTransform(this: RESTClientBase, response: Observable<PagedData<AsyncTask>>): Observable<PagedData<AsyncTask>>
                {
                    const enumService = this.injector.get(EnumService);

                    return response.pipe(mergeMap(data =>
                                         {
                                             return forkJoin(
                                             [
                                                 of(data),
                                                 enumService.getEnumObj<PopisInfo>('typAsyncTasku'),
                                                 enumService.getEnumObj<PopisInfo>('stavAsyncTasku'),
                                             ]);
                                         }),
                                         map(([result, typ, stav]) =>
                                         {
                                             result.content?.forEach(itm =>
                                             {
                                                 itm.stavEnum = itm.stav;
                                                 itm.typ = typ[itm.typ ?? '']?.kratkyPopis;
                                                 itm.stav = stav[itm.stav ?? '']?.popis;
                                             });

                                             return result;
                                         }));
                }
            `),
        //v2 A.3 owner-line: `new Hotkey('~', () =>\n{ … }, undefined, 'Show console'))`
        //source (b742834): boot/app.component.ts:200-217
        dedent(`
                class X
                {
                    private _toggleConsoleHotkey(): void
                    {
                        const oldHelpHotkey = this._appHotkeys.hotkeys.get('~');

                        if(oldHelpHotkey)
                        {
                            this._appHotkeys.hotkeys.remove(oldHelpHotkey);
                        }
                        else
                        {
                            this._appHotkeys.hotkeys.add(new Hotkey('~', () =>
                            {
                                this.consoleVisible.update(val => !val);

                                return false;
                            }, undefined, 'Show console'));
                        }
                    }
                }
            `),
        //v3 A.2: `=\n[`, `fn(\n{`, `<FactoryProvider>\n{`, `fn(\n[`, aligned `provideRouter(routes,\n withComponentInputBinding())`
        //source (b742834): boot/app.providers.ts:47-115
        dedent(`
                /**
                 * Array of providers that are used in app module
                 */
                export const appProviders: (Provider|EnvironmentProviders)[] =
                [
                    //######################### ROUTER #########################
                    provideRouter(routes,
                                  withComponentInputBinding()),

                    //######################### CLIENT HYDRATION #########################
                    provideClientHydration(),

                    //######################### HTTP CLIENT #########################
                    provideHttpClient(withInterceptorsFromDi(),),

                    //######################### NGX SCROLLBAR #########################
                    provideScrollbarPolyfill('assets/scroll-timeline-polyfill.js'),
                    provideScrollbarOptions(
                    {
                        visibility: 'hover',
                        appearance: 'compact',
                    }),

                    //######################### HTTP INTERCEPTORS #########################
                    HEADER_INJECT_INTERCEPTOR_PROVIDER,
                    HTTP_GATEWAY_TIMEOUT_INTERCEPTOR_PROVIDER,
                    SERVICE_UNAVAILABLE_INTERCEPTOR_PROVIDER,
                    HTTP_SERVER_ERROR_INTERCEPTOR_PROVIDER,
                    NO_CONNECTION_INTERCEPTOR_PROVIDER,
                    SUPPRESS_AUTH_INTERCEPTOR_PROVIDER,
                    AUTH_INTERCEPTOR_PROVIDER,
                    PROGRESS_INTERCEPTOR_PROVIDER,

                    //######################### NO CONNECTION INTERCEPTOR OPTIONS #########################
                    <FactoryProvider>
                    {
                        useFactory: () => new NoConnectionInterceptorOptions('Server je mimo prevádzky.'),
                        provide: NoConnectionInterceptorOptions,
                    },

                    //######################### HTTP GATEWAY TIMEOUT INTERCEPTOR OPTIONS #########################
                    <FactoryProvider>
                    {
                        useFactory: () => new HttpGatewayTimeoutInterceptorOptions('Server neodpovedal v stanovenom čase.'),
                        provide: HttpGatewayTimeoutInterceptorOptions,
                    },

                    //######################### GLOBALIZATION SERVICE #########################
                    <ClassProvider>
                    {
                        provide: GlobalizationService,
                        useClass: GlobalizationServiceImpl,
                    },

                    //######################### AUTHENTICATION & AUTHORIZATION #########################
                    <ClassProvider>
                    {
                        provide: AuthenticationServiceOptions,
                        useClass: AccountAuthOptions,
                    },

                    //######################### ERROR HANDLING #########################
                    provideAnglrExceptionExtenders(
                    [
                        errorWithUrlExtender,
                    ]),
                    ANGLR_EXCEPTION_HANDLER_PROVIDER,
                    provideInternalServerErrorRenderer(DialogInternalServerErrorRenderer),

                ];
            `),
        //v4 A.2: `=\n{` with nested `key:\n{`
        //source (b742834): pages/+mosia/hodnotenie/hodnotenie.component.ts:117-143
        dedent(`
                /**
                 * Hard coded texts of summary block
                 */
                const SUMMARY_TEXTS: SummaryTexts =
                {
                    pacienti:
                    {
                        prvy: 'počet ošet. URČ:',
                        prvyTooltip: 'Počet unikátnych ošetrených poistencov (unikátnych rodných čísel)',
                        druhy: 'počet ošet. URČ v ref:',
                        druhyTooltip: 'Priemerný počet unikátnych ošetrených poistencov (unikátnych rodných čísel) v referencii',
                    },
                    kapPacienti:
                    {
                        prvy: 'počet kap. URČ:',
                        prvyTooltip: 'Počet unikátnych kapitovaných poistencov (unikátnych rodných čísel)',
                        druhy: 'počet kap. URČ v ref:',
                        druhyTooltip: 'Priemerný počet unikátnych kapitovaných poistencov (unikátnych rodných čísel) v referencii',
                    },
                    pripady:
                    {
                        prvy: 'počet DRG prípadov:',
                        prvyTooltip: 'Počet DRG klasifikačných prípadov',
                        druhy: 'počet DRG prípadov v ref:',
                        druhyTooltip: 'Priemerný počet DRG klasifikačných prípadov v referencii',
                    },
                };
            `),
        //v5 A.3 aligned parameters and function body
        //source (b742834): pages/+mosia/hodnotenie/hodnotenie.component.ts:166-194
        dedent(`
                /**
                 * Creates rows of list of 'lekari'/'pracoviska', summary row is moved first and renamed, other rows are indented
                 * @param items - Items to be transformed
                 * @param reorder - Indication whether reorder items (summary first)
                 * @param summaryLabel - Label of summary row
                 * @param i1 - Metadata of first indicator
                 * @param i2 - Metadata of second indicator
                 */
                function createUtvarRows(items: MosiaUtvarDetail[]|undefined|null,
                                         reorder: boolean,
                                         summaryLabel: string,
                                         i1: HodnotenieLavaStranaMetadata|undefined|null,
                                         i2: HodnotenieLavaStranaMetadata|undefined|null): OverviewRow[]
                {
                    if(!items?.length)
                    {
                        return [];
                    }

                    if(!reorder)
                    {
                        return items.map(data => ({data, i1, i2, label: null, indent: false}));
                    }

                    const summary = items.find(itm => itm.sumarny);
                    const rest: OverviewRow[] = items.filter(itm => !itm.sumarny).map(data => ({data, i1, i2, label: null, indent: true}));

                    return summary ? [{data: summary, i1, i2, label: summaryLabel, indent: false}, ...rest] : rest;
                }
            `),
        //v6 constructor with aligned parameters and trailing comma, chain `.subscribe(itm =>\n{` (A.4)
        //source (b742834): boot/app.component.ts:110-160
        dedent(`
                class X
                {
                    //######################### constructor #########################
                    constructor(authSvc: AuthenticationService,
                                private _appHotkeys: AppHotkeysService,
                                private _configRelease: ConfigReleaseService,
                                private _debugDialogSvc: DebugDialogService,
                                settings: SettingsService,
                                @Inject(LOGGER) logger: Logger,
                                @Inject(DOCUMENT) private _document: Document,)
                    {
                        logger.verbose('Application is starting, main component constructed.');

                        this._generateOverride();
                        document.body.classList.add('app-page', settings.settings.theme);
                        this._theme = settings.settings.theme;

                        new Konami(() =>
                        {
                            console.log('konami enabled');
                        });

                        this._settingsChangeSubscription = settings.settingsChange
                            .subscribe(itm =>
                            {
                                if(itm == nameof<SettingsGeneral>('theme'))
                                {
                                    this._document.body.classList.remove(this._theme);
                                    this._theme = settings.settings.theme;
                                    this._document.body.classList.add(this._theme);
                                }
                            });

                        this._settingsDebuggingChangeSubscription = settings.settingsDebuggingChange
                            .subscribe(itm =>
                            {
                                if(itm == nameof<SettingsDebug>('consoleEnabled'))
                                {
                                    this._toggleConsoleHotkey();
                                }
                            });

                        if(settings.settingsDebugging?.consoleEnabled)
                        {
                            this._toggleConsoleHotkey();
                        }

                        this._initSubscriptions.add(authSvc.authenticationChanged.subscribe(identity => this._setDebugHotkeys(identity?.permissions || [])));

                        this._setDebugHotkeys(authSvc.userIdentity?.permissions || []);

                        effect(() => this.consoleVisible.set(this._debugDialogSvc.consoleLogEnabled()));
                    }
                }
            `),
        //v7 A.4 chain `new HttpParams()\n    .append(…)`
        //source (b742834): services/api/account/account.service.ts:97-105
        dedent(`
                class X
                {
                    public login(accessToken: AccessToken): Observable<void>
                    {
                        const body = new HttpParams()
                            .append('j_username', accessToken.userName)
                            .append('j_password', accessToken.password)
                            .append('remember-me', accessToken.rememberMe?.toString());

                        return this._login(body);
                    }
                }
            `),
        //v8 A.4 chain with lambda, `=\n{` and `= <T>\n{` inside
        //source (b742834): pages/+mosia/hodnotenie/hodnotenie.component.ts:391-431
        dedent(`
                class X
                {
                    protected readonly summaryRows: Signal<OverviewRow[]> = computed(() =>
                    {
                        const atributy = this.data()?.atributy ?? {};
                        const i1s = this.lavaStrana()?.['SUMAR-I1']?.metas;
                        const i2s = this.lavaStrana()?.['SUMAR-I2']?.metas;

                        if(!i1s || !i2s)
                        {
                            return [];
                        }

                        return i1s
                            .map((i1, index): OverviewRow =>
                            {
                                const i2 = i2s[index];
                                const data: MosiaUtvarDetail = {nazov: i1.popis};

                                if(i1.nalepkaMosia && atributy[i1.nalepkaMosia])
                                {
                                    data.indikator1 =
                                    {
                                        urc: getAttr(atributy, i1.nalepkaMosia, i1.indikator ?? ''),
                                        urcRef: getAttr(atributy, i1.nalepkaMosia, \`\${i1.indikator}Ref\`),
                                    };
                                }

                                if(i2?.nalepkaMosia && atributy[i2.nalepkaMosia])
                                {
                                    data.indikator2 = <HodnotenieIndikator>
                                    {
                                        urc: getAttr(atributy, i2.nalepkaMosia, i2.indikator ?? ''),
                                        urcRef: getAttr(atributy, i2.nalepkaMosia, \`\${i2.indikator}Ref\`),
                                        urcRefDiff: getAttr(atributy, i2.nalepkaMosia, \`\${i2.indikator}RefDiff\`),
                                        urcRefDiffVaha: getAttr(atributy, i2.nalepkaMosia, \`\${i2.indikator}RefDiffVaha\`),
                                    };
                                }

                                return {data, i1, i2, label: null, indent: false};
                            })
                            .filter(row => !!row.data.indikator1 || !!row.data.indikator2);
                    });
                }
            `),
        //v9 A.3 deep aligned arguments after `computed(() => createUtvarRows(`
        //source (b742834): pages/+mosia/hodnotenie/hodnotenie.component.ts:436-440
        dedent(`
                class X
                {
                    protected readonly lekarRows: Signal<OverviewRow[]> = computed(() => createUtvarRows(this.data()?.poskytovatelia,
                                                                                                         this.mosiaId().isSpecificLekar,
                                                                                                         'Lekár celkovo (všetky pracoviská)',
                                                                                                         this.lavaStrana()?.['LEK-I1']?.meta,
                                                                                                         this.lavaStrana()?.['LEK-I2']?.meta));
                }
            `),
        //v10a A.5 `if(… ||\n   …)`
        //source (b742834): services/api/jubulaWs/jubulaWs.service.ts:421-429
        dedent(`
                function f()
                {
                    if(isPresent(idUlohy) ||
                       isPresent(idProduktu) ||
                       isPresent(idPripadu) ||
                       isPresent(idIsProdukt) ||
                       isPresent(idIsPripad) ||
                       isPresent(idBenefit))
                    {
                        akcie = akcie.concat(['LS_PRIPAD', 'PS_PRIPAD']);
                    }
                }
            `),
        //v10b A.5 parenthesised operands
        //source (b742834): pages/+poistenec/history/misc/components/prihoda/prihoda.component.ts:408-412
        dedent(`
                function f()
                {
                    if((skipProdukty && this.prihodaDetail()) ||
                       (this.prihodaDetail() && this.prihodaDetail()?.uuid == this.inputDataSvc.pspripad()?.uuid && !this.inputDataSvc.produktUuid()))
                    {
                        return true;
                    }
                }
            `),
        //v11a A.6 ternary branches +4
        //source (b742834): components/conditionIcon/conditionIcon.component.ts:23-25
        dedent(`
                class X
                {
                    protected cssClass: Signal<string> = computed(() => this.condition() ?
                        'fa-check-circle text-success' :
                        'fa-times-circle text-danger');
                }
            `),
        //v11b A.6 ternary object branch `?\n{`
        //source (b742834): features/hlasenia/components/hlasenia/hlasenia.component.ts:146-152
        dedent(`
                function f()
                {
                    this.spravyValue.update(spravy => spravy.map(sprava => sprava.uuid == uuid ?
                        {
                            ...sprava,
                            sprava: updated,
                            popis: updated,
                        } :
                        sprava));
                }
            `),
        //v12a A.7 `case` blocks
        //source (b742834): services/api/account/account.service.ts:36-56
        dedent(`
                function f()
                {
                    switch(error.status)
                    {
                        case 503:
                        {
                            alert('Vzdialená služba je nedostupná. Skúste opätovne neskôr.');

                            break;
                        }
                        case 504:
                        {
                            alert('Vypršal čas na spracovanie požiadavky cez http proxy. Skúste opätovne neskôr.');

                            break;
                        }
                        case 0:
                        {
                            alert('Server je mimo prevádzky. Skúste opätovne neskôr.');

                            break;
                        }
                    }
                }
            `),
        //v12b A.7 `case` blocks with fall-through
        //source (b742834): pipes/vahaHodnotaCss/vahaHodnotaCss.pipe.ts:21-56
        dedent(`
                function f()
                {
                    switch(value)
                    {
                        case 'X':
                        case 'NEHODNOTENE':
                        {
                            return 'weight-x';
                        }
                        case '-1':
                        {
                            return 'weight-down';
                        }
                        case '0':
                        {
                            return 'weight-0';
                        }
                        case '1':
                        {
                            return 'weight-1';
                        }
                        case '2':
                        {
                            return 'weight-2';
                        }
                        case '3':
                        {
                            return 'weight-3';
                        }
                        case '4':
                        {
                            return 'weight-4';
                        }
                        case '5':
                        {
                            return 'weight-5';
                        }
                    }
                }
            `),
        //v13 A.8 template literal body and commented-out block
        //source (b742834): boot/app.component.ts:236-290
        dedent(`
                function f()
                {
                    const head = this._document.head || this._document.getElementsByTagName('head')[0];
                    this._style = this._document.createElement('style');

                    const css = \`main-menu.env-override
                    {
                        background: \${env.prostredie.bg};
                        color: \${env.prostredie.fg};
                    }

                    main-menu.env-override a
                    {
                        color: \${env.prostredie.fg};
                    }

                    .cpt-menu .mat-mdc-menu-content,
                    .statistiky-submenu
                    {
                        background: \${env.prostredie.bg};
                    }

                    .cpt-menu .mat-mdc-menu-content .mat-mdc-menu-item,
                    .statistiky-submenu a
                    {
                        color: \${env.prostredie.fg};
                    }\`;
                    // const css = \`main-menu.env-override.navbar-default
                    // {
                    //     background: \${env.prostredie.bg};
                    // }

                    // main-menu.env-override.navbar-default .dropdown-menu
                    // {
                    //     background: \${env.prostredie.bg};
                    // }

                    // main-menu.env-override.navbar-default .active>a,
                    // main-menu.env-override.navbar-default .active>a:hover,
                    // main-menu.env-override.navbar-default li>a:hover,
                    // main-menu.env-override.navbar-default .open>a:hover,
                    // main-menu.env-override.navbar-default .open>a
                    // {
                    //     background: rgba(0, 0, 0, 0.2);
                    //     color: \${env.prostredie.fg};
                    // }

                    // main-menu.env-override.navbar-default .navbar-brand,
                    // main-menu.env-override.navbar-default .navbar-version
                    // {
                    //     color: \${env.prostredie.fg};
                    // }

                    // main-menu.env-override.navbar-default li>a
                    // {
                    //     color: \${env.prostredie.fg};
                    // }\`;
                }
            `),
        //v14a B.3 layout `=> (\n{`
        //source (b742834): services/api/hodnotenie/hodnotenie.service.ts:120-126
        dedent(`
                function f()
                {
                    return Object.keys(groups)
                        .map(typZs => (
                        {
                            typZs,
                            data: groups[typZs],
                        }))
                        .sort((a, b) => a.typZs == b.typZs ? 0 : (a.typZs < b.typZs ? 1 : -1));
                }
            `),
        //v14b B.3 layout `=> (\n{`
        //source (b742834): pages/+mosia/hodnotenie/misc/components/okno/okno.component.ts:101-110
        dedent(`
                class X
                {
                    protected readonly chartRequest: WritableSignal<ChartRequest> = linkedSignal(
                    {
                        source: () => ({metadata: this.metadata(), obdobie: this.obdobie(), data: this.data()}),
                        computation: ({metadata, obdobie}) => (
                        {
                            atribut: metadata.grafDefault || DEFAULT_CHART_ATTR,
                            obdobie,
                            klucRiadku: metadata.grafDefaultKluc,
                        }),
                    });
                }
            `),
        //v15 `useValue: <T>\n{`
        //source (b742834): boot/app.providers.ts:178-188
        dedent(`
                const a =
                [
                    <ValueProvider>
                    {
                        provide: HEADER_CONTENT_RENDERER_OPTIONS,
                        useValue: <TableHeaderContentRendererOptions>
                        {
                            cssClasses:
                            {
                                thDefault: 'header-default fixed-header',
                            },
                        },
                    },
                ];
            `),
        //v16 A.2 collapse of nested single-argument calls (synthetic)
        'const a = btoa(encodeURIComponent(JSON.stringify(\n{\n    a: 1,\n})));',
        //v17 A.8 import declarations are ignored (synthetic)
        'import {a,\n        b} from \'x\';',
        //e1 A.3 aligned parameters of abstract method (signature without body)
        //source (b742834): misc/basePrehlad/basePrehladComponent.ts:221-223
        dedent(`
                class X
                {
                    protected abstract getPrehlad(paging: Pageable,
                                                  ordering: SimpleOrdering|undefined|null,
                                                  filter: TFilter): Observable<PagedData<TDataItem>>;
                }
            `),
        //e2 A.3 aligned decorated parameters
        //source (b742834): services/api/cis/cis.service.ts:148-154
        dedent(`
                class X
                {
                    @GET('/{type}/{kod}')
                    public getCisDgProdDetail(@Path('type') _type: 'dg'|'prod'|'drgpp',
                                              @Path('kod') _kod: string,
                                              @Query('datum') _datum?: AppInputDateTime): Observable<DrgDgDetail|DrgProdDetail>
                    {
                        return NEVER;
                    }
                }
            `),
        //e3 A.3 aligned parameters of call signature
        //source (b742834): services/api/jubulaWs/ws/interfaces/wsMiddlewareRunMethod/wsMiddlewareRunMethod.interface.ts:24-31
        dedent(`
                interface X
                {
                    (this: StompJsWsClientBase,
                     id: string,
                     target: TTarget,
                     methodName: string,
                     descriptor: TDescriptor,
                     args: unknown[],
                     request: WsRequest<TRequestBody>|WsSubscribeRequest|WsNoRequest,
                     next: WsMiddlewareRunNextMethod<TRequestBody, TNextQueues>): WsResponse<TQueues>;
                }
            `),
        //e4 A.2 mapped type `=\n{`
        //source (b742834): services/api/jubulaWs/ws/types/wsQueues/index.ts:7-10
        dedent(`
                export type WsQueues<TDataType> =
                {
                    [TProp in keyof TDataType]: Observable<TDataType[TProp]>;
                };
            `),
        //e5 A.2 type assertion on its own line is part of opener `fn(\n<T>\n{`
        //source (b742834): components/userSettings/userSettings.component.ts:109-114
        dedent(`
                function f()
                {
                    this.generalSettingsForm = formBuilder.group(
                    <SettingsGeneral>
                    {
                        language: settings.language,
                        theme: settings.theme
                    });
                }
            `),
        //e6 A.2 spread on its own line is part of opener `fn(\n...[`
        //source (b742834): pages/+poistenec/history/misc/services/poistenecInputData/poistenecInputData.service.ts:363-367
        dedent(`
                function f()
                {
                    responsePromises.push(
                    ...[
                        this.handlePsPripadQueue(response.queues.pspripad),
                        this.handleLsPripadQueue(response.queues.lspripad),
                    ]);
                }
            `),
        //e7 elements of literal aligned with first element on opener line
        //source (b742834): services/api/jubulaWs/jubulaWs.service.ts:36-38
        dedent(`
                function f()
                {
                    return forkJoin([of(data),
                                     getCodeObservable(pracoviska, kod => $this.getPracovisko({kod}), output => output.pracovisko, webSocketResponses),
                                     getCodeObservable(lekari, kod => $this.getLekar({kod}), output => output.lekar, webSocketResponses)]);
                }
            `),
        //r1 A.4 d3 sub-indent: chain line +4 deeper than previous dot, following ones aligned with it, back to chain column
        //source (b742834): pages/+mosia/misc/components/mosiaChart/mosiaChart.component.ts:422-434
        dedent(`
                function f()
                {
                    if(!reference)
                    {
                        chart.lineG.selectAll<SVGPathElement, ReferencePoint[]>('path')
                            .transition()
                            .duration(DURATION)
                                .attr('opacity', 0)
                            .remove();

                        chart.circleG.selectAll<SVGCircleElement, ReferencePoint>('circle')
                            .transition()
                            .duration(DURATION)
                                .attr('r', 0)
                            .remove();
                    }
                }
            `),
        //r2 A.4 d3 sub-indent repeated in one chain
        //source (b742834): pages/+mosia/misc/components/mosiaChart/mosiaChart.component.ts:477-498
        dedent(`
                class X
                {
                    private _renderBars(chart: MosiaChartObjects, barGroups: BarGroup[]): void
                    {
                        chart.barChartG
                            .selectAll<SVGGElement, BarGroup>('g')
                            .data(barGroups)
                            .enter()
                            .append('g')
                                .attr('fill', group => group.farba)
                            .selectAll<SVGRectElement, BarPoint>('rect')
                            .data(group => group.points)
                            .enter()
                            .append('rect')
                                .on('mouseenter', (event: MouseEvent, point: BarPoint) => this._showTooltip(event, point.value))
                                .on('mouseleave', () => this._hideTooltip())
                                .attr('x', point => chart.xScale(point.obdobie) ?? 0)
                                .attr('y', chart.yScale(0))
                                .attr('width', chart.xScale.bandwidth())
                            .transition()
                            .duration(DURATION)
                                .attr('y', point => chart.yScale(point.y1))
                                .attr('height', point => chart.yScale(point.y0) - chart.yScale(point.y1));
                    }
                }
            `),
        //r3 A.4 d3 sub-indent, first chain line and sub-indent in variable initializer
        //source (b742834): features/podmienky/components/podmienkyRenderer/podmienkyRenderer.component.ts:442-447, 507-524
        dedent(`
                class X
                {
                    private _createChart(): Chart
                    {
                        const svg = select(this.svgElement().nativeElement)
                            .append('svg')
                                .attr('height', this.height);
                        const parentGroup = svg.append('g');
                    }

                    private _drawNode(chart: Chart, node: NodeModel): void
                    {
                        chart.nodesG.append('circle')
                            .on('click', () => node.node.toggleCollapsed())
                            .on('mouseenter', (evt: MouseEvent) => this._showTooltip(evt, this._tooltipText(node.node)))
                            .on('mouseleave', () => this.tooltipVisible.set(false))
                                .attr('r', 0)
                                .attr('cx', node.cx)
                                .attr('cy', SIZE / 2)
                                .attr('class', \`circle valid-\${node.valid} \${invert} pointer-cursor\`)
                            .transition()
                            .duration(TRANSITION_DURATION)
                                .attr('r', (SIZE / 2) - 2.5);

                        chart.nodesG.append('text')
                            .on('click', () => node.node.toggleCollapsed())
                            .on('mouseenter', (evt: MouseEvent) => this._showTooltip(evt, this._tooltipText(node.node)))
                            .on('mouseleave', () => this.tooltipVisible.set(false))
                            .text(node.char)
                                .attr('class', \`circle text-\${node.valid} \${invert} pointer-cursor\`)
                                .attr('y', SIZE / 2 + 5)
                                .attr('x', node.charX);
                    }
                }
            `),
        //r4 A.4 d3 sub-indented line with lambda body follows the sub-indented line (synthetic)
        'selection\n    .transition()\n        .on(\'end\', () =>\n        {\n            done();\n        })\n    .remove();',
        //r13 owner decision (A.4): chain line aligned with a dot on the chain head line, nested chain inside lambda
        //source (b742834): boot/app.providers.ts:211-220
        dedent(`
                export const providers =
                [
                    provideLoggerConfig(config => config
                        .writeTo(cfg => cfg.writeTo(ConsoleComponentSink)
                                           .minimumLevel(LogLevel.Verbose))
                        .writeTo(cfg => cfg.writeTo(RestSink)
                                           .minimumLevel(LogLevel.Error))
                        .writeTo(DeveloperConsoleSink)
                        .enrichWith(LogLevelEnricher)
                        .minimumLevel(LogLevel.Information)),
                ];
            `),
        //r14 owner decision (A.4): chain lines aligned with a dot on the chain head line, following ones aligned with previous dot
        //source (b742834): pages/+poistenec/history/misc/components/drgVariant/drgVariant.component.spec.ts:236-241
        dedent(`
                function argsOf(title: string): HospArgStub[]
                {
                    const block = itm.nextElementSibling as HTMLElement;

                    return fixture.debugElement.queryAll(By.directive(HospArgStub))
                                  .filter(debug => block.contains(debug.nativeElement))
                                  .map(debug => debug.injector.get(HospArgStub));
                }
            `),
        //r15 owner decision (A.4): chain line aligned with a dot on the chain head line (deeper indented function)
        //source (b742834): pages/+poistenec/history/misc/components/drgEdit/drgEdit.component.spec.ts:343-348
        dedent(`
                describe('x', () =>
                {
                    function argsOf(title: string): HospArgStub[]
                    {
                        const block = titles.find(itm => itm.textContent?.trim() == title)!.nextElementSibling as HTMLElement;

                        return fixture.debugElement.queryAll(By.directive(HospArgStub))
                                      .filter(itm => block.contains(itm.nativeElement))
                                      .map(itm => itm.injector.get(HospArgStub));
                    }
                });
            `),
        //r16 owner decision (A.4): single chain line aligned with a dot on the chain head line
        //source (b742834): pages/+poistenec/history/misc/components/hospTitle/hospTitle.component.spec.ts:137-141
        dedent(`
                function cenaTooltip(fixture: ComponentFixture<unknown>): TooltipDirective
                {
                    return fixture.debugElement.queryAll(By.directive(TooltipDirective))
                                  .find(itm => (itm.nativeElement as HTMLElement).classList.contains('semi-bold'))!.injector.get(TooltipDirective);
                }
            `),
        //r5 A.8 template literal starting its own line is ignored, `template:\n` at +4 (as in the source)
        //source (b742834): components/idMatrixContentRenderer/idMatrixContentRenderer.component.spec.ts:72-78
        '@Component(\n{\n    template:\n    `\n    <div ngGrid [gridOptions]="options()">\n    </div>\n    `,\n})\nclass X\n{\n}',
        //r6 A.8 template literal starting its own line is ignored, `template:\n` at +0
        '@Component(\n{\n    template:\n`\n    <div></div>\n`,\n})\nclass X\n{\n}',
        //r7 A.8 template literal starting its own line is ignored, `template:\n` at +8 and `x =\n` at +0
        '@Component(\n{\n    template:\n            `\n    <div></div>\n            `,\n})\nclass X\n{\n}\nconst css =\n`a {}`;',
    ],
    invalid:
    [
        //i1 A.3 statement-indent variant of pipe operators, reduced from services/api/account/account.service.ts:14-80
        {
            code: dedent(`
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
            `),
            output: dedent(`
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
            `),
            errors: errorsAt(4, 5, 6, 7, 8, 9, 10),
        },
        //i2 A.3 wrapped last object argument, reduced from boot/app.config.ts:22-26
        {
            code: 'provideServiceWorker(\'ngsw-worker.js\',\n{\n    enabled: false,\n});',
            output: 'provideServiceWorker(\'ngsw-worker.js\',\n                     {\n                         enabled: false,\n                     });',
            errors: errorsAt(2, 3, 4),
        },
        //i3 A.2 upstream +4 layout of `=\n{`
        {
            code: 'const x =\n    {\n        a: 1,\n    };',
            output: 'const x =\n{\n    a: 1,\n};',
            errors: errorsAt(2, 3, 4),
        },
        //i4 A.2 upstream +4 layout of `fn(\n{`
        {
            code: 'provideSelectOptions(\n    {\n        placeholder: NOTHING_SELECTED,\n    });',
            output: 'provideSelectOptions(\n{\n    placeholder: NOTHING_SELECTED,\n});',
            errors: errorsAt(2, 3, 4),
        },
        //i5 A.5 continuation of condition aligned with first operand
        {
            code: 'if(a ||\n    b)\n{\n}',
            output: 'if(a ||\n   b)\n{\n}',
            errors: errorsAt(2),
        },
        //i6 A.5 strict, hanging negation is not allowed, from features/podmienky/components/podmienkyRenderer/podmienkyRenderer.component.ts:241-246
        {
            code: 'if(!node.isFirst() ||\n    ongoing ||\n   !selfNode)\n{\n    return null;\n}',
            output: 'if(!node.isFirst() ||\n   ongoing ||\n   !selfNode)\n{\n    return null;\n}',
            errors: errorsAt(2),
        },
        //i7 A.7 `case` +4 inside `switch`, case block `{` at `case` column
        {
            code: 'switch(x)\n{\ncase 1:\n{\n    break;\n}\n}',
            output: 'switch(x)\n{\n    case 1:\n    {\n        break;\n    }\n}',
            errors: errorsAt(3, 4, 5, 6),
        },
        //i8 A.4 member chain +4 from chain head line
        {
            code: 'const body = new HttpParams()\n      .append(\'a\', b)\n      .append(\'c\', d);',
            output: 'const body = new HttpParams()\n    .append(\'a\', b)\n    .append(\'c\', d);',
            errors: errorsAt(2, 3),
        },
        //i9 A.6 ternary branches +4
        {
            code: 'const css = cond ?\n        \'a\' :\n        \'b\';',
            output: 'const css = cond ?\n    \'a\' :\n    \'b\';',
            errors: errorsAt(2, 3),
        },
        //e8 A.3 parameters (with decorators) align with first one, from services/api/ulohaJubula/ulohaJubula.service.ts:92-97
        {
            code: dedent(`
                class X
                {
                    public getHosps(@QueryObject _paging?: GridPaging,
                        @Query('sort') _ordering?: SimpleOrdering,
                        @Body _filter?: PostreviziaFilter): Observable<void>
                    {
                        return NEVER;
                    }
                }
            `),
            output: dedent(`
                class X
                {
                    public getHosps(@QueryObject _paging?: GridPaging,
                                    @Query('sort') _ordering?: SimpleOrdering,
                                    @Body _filter?: PostreviziaFilter): Observable<void>
                    {
                        return NEVER;
                    }
                }
            `),
            errors: errorsAt(4, 5),
        },
        //r8 A.4 d3 sub-indent is exactly +4, +8 deeper than previous dot is reported, fix never creates sub-indent, it aligns with previous dot
        {
            code: 'selection\n    .transition()\n            .attr(\'y\', 0)\n    .remove();',
            output: 'selection\n    .transition()\n    .attr(\'y\', 0)\n    .remove();',
            errors: errorsAt(3),
        },
        //r12 A.4 misaligned chain block (column matches no dot and is not +4) is fixed to chain column, not to sub-indent of fixed previous dot
        {
            code: dedent(`
                function argsOf(title: string): HospArgStub[]
                {
                    return fixture.debugElement.queryAll(By.directive(HospArgStub))
                                   .filter(debug => block.contains(debug.nativeElement))
                                   .map(debug => debug.injector.get(HospArgStub));
                }
            `),
            output: dedent(`
                function argsOf(title: string): HospArgStub[]
                {
                    return fixture.debugElement.queryAll(By.directive(HospArgStub))
                        .filter(debug => block.contains(debug.nativeElement))
                        .map(debug => debug.injector.get(HospArgStub));
                }
            `),
            errors: errorsAt(4, 5),
        },
        //r9 A.4 d3 sub-indent is exactly +4, +2 deeper than previous dot is fixed to the aligned column (tie)
        {
            code: 'selection\n    .transition()\n      .attr(\'y\', 0);',
            output: 'selection\n    .transition()\n    .attr(\'y\', 0);',
            errors: errorsAt(3),
        },
        //r10 A.4 first chain line has no previous dot, it is only +4 from chain head line
        {
            code: 'selection\n        .transition()\n    .remove();',
            output: 'selection\n    .transition()\n    .remove();',
            errors: errorsAt(2),
        },
        //r11 owner decision (A.8 note): single-argument nested call with lambda, body at inner column stays reported
        //source (b742834): services/api/jubulaWs/jubulaWs.service.ts:373-388
        {
            code: dedent(`
                function zurnalResponseTransform(this: StompJsWsClientBase, response: Observable<WsRozhodnutieDetail[]>): Observable<WsRozhodnutieDetail[]>
                {
                    return response
                        .pipe(map(result =>
                              {
                                  return result;
                              }));
                }
            `),
            output: dedent(`
                function zurnalResponseTransform(this: StompJsWsClientBase, response: Observable<WsRozhodnutieDetail[]>): Observable<WsRozhodnutieDetail[]>
                {
                    return response
                        .pipe(map(result =>
                        {
                            return result;
                        }));
                }
            `),
            errors: errorsAt(5, 6, 7),
        },
    ],
});
