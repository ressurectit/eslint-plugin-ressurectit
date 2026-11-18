/**
 * @fileoverview Tests for imports-order rule
 */

import {ruleTester, dedent} from '../helpers/ruleTester.js';
import rule from '../../lib/rules/imports-order.js';

const providers = `
import {FactoryProvider, ClassProvider, ValueProvider, Provider, ExistingProvider, EnvironmentProviders, inject, importProvidersFrom, provideAppInitializer} from '@angular/core';
import {provideClientHydration} from '@angular/platform-browser';
import {provideHttpClient, withInterceptorsFromDi} from '@angular/common/http';
import {provideRouter, withComponentInputBinding} from '@angular/router';
import {MAT_DIALOG_DEFAULT_OPTIONS, MatDialogConfig, MatDialogModule} from '@angular/material/dialog';
import {OVERLAY_DEFAULT_CONFIG, OverlayDefaultConfig} from '@angular/cdk/overlay';
import {AuthenticationService, AUTH_INTERCEPTOR_PROVIDER, SUPPRESS_AUTH_INTERCEPTOR_PROVIDER, AuthenticationServiceOptions} from '@anglr/authentication';
import {LocalPermanentStorage} from '@anglr/common/store';
import {PROGRESS_INTERCEPTOR_PROVIDER, GlobalizationService, DebugDataEnabledService, DEFAULT_NOTIFICATIONS, NOTIFICATIONS, providePosition, provideLoggerConfig, DeveloperConsoleSink, LogLevelEnricher, TimestampEnricher, LogLevel, ConsoleComponentSink, provideLoggerRestClient, RestSink, providePermanentStorage, ConsoleComponentServiceOptions} from '@anglr/common';
import {ERROR_HANDLING_NOTIFICATIONS, HttpGatewayTimeoutInterceptorOptions, NoConnectionInterceptorOptions, HTTP_GATEWAY_TIMEOUT_INTERCEPTOR_PROVIDER, NO_CONNECTION_INTERCEPTOR_PROVIDER, SERVICE_UNAVAILABLE_INTERCEPTOR_PROVIDER, ANGLR_EXCEPTION_HANDLER_PROVIDER, HTTP_SERVER_ERROR_INTERCEPTOR_PROVIDER, CLIENT_ERROR_NOTIFICATIONS, provideInternalServerErrorRenderer, provideAnglrExceptionExtenders, errorWithUrlExtender, provideHttpClientErrorResponseMapper, provideHttpClientValidationErrorResponseMapper, provideHttpClientErrorHandlers, handleHttp404Error, provideHttpClientErrorConfigs} from '@anglr/error-handling';
import {DialogInternalServerErrorRenderer} from '@anglr/error-handling/material';
import {BasicPagingOptions, TableContentRendererOptions, HEADER_CONTENT_RENDERER_OPTIONS, TableHeaderContentRendererOptions, QueryPermanentStorageGridInitializerOptions, QueryGridInitializerComponent, provideNoDataRendererOptions, provideGridInitializerType, providePagingOptions, provideMetadataSelectorType, provideMetadataSelectorOptions, provideGridInitializerOptions, provideContentRendererOptions, provideDefaultMatrixColumnWidth, provideContentRendererType} from '@anglr/grid';
import {DialogMetadataSelectorComponent, DialogMetadataSelectorOptions, VerticalDragNDropSelectionTexts} from '@anglr/grid/material';
import {CommonPositionerOptions, providePopupOptions, providePositionerOptions, provideSelectOptions} from '@anglr/select';
import {VALIDATION_ERROR_MESSAGES} from '@anglr/common/forms';
import {MovableTitledDialogComponent, TitledDialogServiceOptions, TitledDialogService, provideConfirmationDialogOptions} from '@anglr/common/material';
import {FloatingUiDomPosition} from '@anglr/common/floating-ui';
import {assetsPathPrefixExtension, IncludeMarkdownExtension, provideMarkdownRendererExtensions, GfmHeadingIdExtension} from '@anglr/md-help';
import {MermaidExtension} from '@anglr/md-help/mermaid';
import {baseUrlExtension} from '@anglr/md-help/baseurl';
import {HighlightJsExtension} from '@anglr/md-help/highlightjs';
import {REST_ERROR_HANDLING_MIDDLEWARE_ORDER, HttpClientErrorProcessingMiddleware, CatchHttpClientErrorMiddleware} from '@anglr/error-handling/rest';
import {provideGlobalNotifications} from '@anglr/notifications';
import {DATE_API, FORMAT_PROVIDER, FormatProvider} from '@anglr/datetime';
import {DateFnsDateApi, DateFnsLocale, DATE_FNS_DATE_API_OBJECT_TYPE, DATE_FNS_FORMAT_PROVIDER, DATE_FNS_LOCALE} from '@anglr/datetime/date-fns';
import {LoggerMiddleware, provideRestMethodMiddlewares, ReportProgressMiddleware, ResponseTypeMiddleware, RestMiddlewareType} from '@anglr/rest';
import {provideRestDateTime} from '@anglr/rest/datetime';
import {isString} from '@jscrpt/common';
import {sk} from 'date-fns/locale';
import {provideScrollbarOptions, provideScrollbarPolyfill} from 'ngx-scrollbar';

import {routes} from './app.component.routes';
import {GlobalizationService as GlobalizationServiceImpl} from '../services/globalization/globalization.service';
import {SettingsService, LocalSettingsStorage} from '../services/settings';
import {SETTINGS_STORAGE} from '../misc/tokens';
import {RestLoggerService} from '../services/api/restLogger';
import {AccountAuthOptions} from '../services/api/account/accountAuth.options';
import {VersionUpdateService} from '../services/versionUpdate';
import {HEADER_INJECT_INTERCEPTOR_PROVIDER} from '../misc/httpInterceptors';
import {middlewareTypes, provideWsStompJsMethodMiddlewares, provideWsStompJsMiddlewaresOrder, PublishBodyMiddleware, QueueResponseMiddleware, UseStompJsMiddleware} from '../services/api/jubulaWs/ws';
import {chiropteraMiddlewareTypes} from '../services/api/jubulaWs/middlewares/types';
import {ChiropteraMiddleware} from '../services/api/jubulaWs';
import {IdMatrixContentRendererComponent} from '../components';
import {NOTHING_SELECTED} from '../misc/constants';
import {CollapsibleTitleOptions, provideCollapsibleTitleOptions} from '../features';
`;

const hodnotenie = `
import {afterNextRender, Component, computed, DestroyRef, DOCUMENT, effect, inject, Injector, input, InputSignal, linkedSignal, ResourceRef, Signal, signal, untracked, WritableSignal} from '@angular/core';
import {rxResource} from '@angular/core/rxjs-interop';
import {ActivatedRoute, Router, RouterLink} from '@angular/router';
import {FieldTree, form, FormField} from '@angular/forms/signals';
import {FirstUppercaseLocalizePipe, LocalizePipe, TooltipDirective, WithPageContentCssClass} from '@anglr/common';
import {TitledDialogService} from '@anglr/common/material';
import {AuthorizeDirective} from '@anglr/authentication';
import {GlobalNotificationsService} from '@anglr/notifications';
import {DATE_API, DateApi, DateFormatPipe} from '@anglr/datetime';
import {Option, Select, SelectFormControl} from '@anglr/select';
import {deserializeFromUrlQuery, isJsObject, serializeToUrlQuery} from '@jscrpt/common';
import {NgScrollbar} from 'ngx-scrollbar';
import {lastValueFrom, map} from 'rxjs';

import {handleError} from '../../../misc/rxjsOperators';

import {HodnotenieDetail, HodnotenieIndikator, HodnotenieLavaStranaMetadata, HodnotenieMetadata, HodnotenieMetadataDescription, HodnotenieService, MosiaEnumItem, MosiaSprava, MosiaUtvarDetail} from '../../../services/api/hodnotenie';
import {EnumService} from '../../../services/api/enum';
import {PostreviziaFilter} from '../../../services/api/ulohaJubula';
import {createMosiaProduktyFilter, MosiaFormatPipe, MosiaId, obdobieRange, OverviewLineComponent, parseMosiaId} from '../misc';
import {OknoComponent, OknoState, PoznamkaDialogComponent, PoznamkaDialogResult} from './misc/components';
`;

ruleTester.run('imports-order', rule,
{
    valid:
    [
        providers,
        hodnotenie,
        "import {a} from '@angular/router';\nimport {b} from '@angularx-foo/bar';",
    ],
    invalid:
    [
        {
            name: '@angular/core/* before @angular/core',
            code: dedent(`
                import {a} from '@angular/core/rxjs-interop';
                import {b} from '@angular/core';
            `),
            output: dedent(`
                import {b} from '@angular/core';
                import {a} from '@angular/core/rxjs-interop';
            `),
            errors: [{messageId: 'msg'}],
        },
        {
            name: '@jscrpt/other before @jscrpt/common',
            code: dedent(`
                import {a} from '@jscrpt/other';
                import {b} from '@jscrpt/common';
            `),
            output: dedent(`
                import {b} from '@jscrpt/common';
                import {a} from '@jscrpt/other';
            `),
            errors: [{messageId: 'msg'}],
        },
        {
            name: '@angularx-foo is other scoped, not @angular',
            code: dedent(`
                import {a} from '@angularx-foo/bar';
                import {b} from '@angular/router';
            `),
            output: dedent(`
                import {b} from '@angular/router';
                import {a} from '@angularx-foo/bar';
            `),
            errors: [{messageId: 'msg'}],
        },
        {
            name: 'absolute before other scoped',
            code: dedent(`
                import {a} from 'rxjs';
                import {b} from '@ngx-translate/core';
            `),
            output: dedent(`
                import {b} from '@ngx-translate/core';
                import {a} from 'rxjs';
            `),
            errors: [{messageId: 'msg'}],
        },
        {
            name: 'relative before absolute',
            code: dedent(`
                import {a} from './a';
                import {b} from 'rxjs';
            `),
            output: dedent(`
                import {b} from 'rxjs';
                import {a} from './a';
            `),
            errors: [{messageId: 'msg'}],
        },
    ],
});
