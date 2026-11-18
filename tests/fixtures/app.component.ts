import {Component, ViewChild, Inject, AfterViewInit, OnDestroy, WritableSignal, signal, effect} from '@angular/core';
import {DOCUMENT} from '@angular/common';
import {RouterOutlet} from '@angular/router';
import {Console, LOGGER, Logger, ProgressIndicatorModule} from '@anglr/common';
import {AppHotkeysService, HotkeysCheatsheetComponent} from '@anglr/common/hotkeys';
import {InternalServerErrorComponent} from '@anglr/error-handling';
import {NotificationsGlobalModule} from '@anglr/notifications';
import {AuthenticationService} from '@anglr/authentication';
import {nameof} from '@jscrpt/common';
import {lastValueFrom} from '@jscrpt/common/rxjs';
import {Subscription} from 'rxjs';
import {Hotkey} from 'angular2-hotkeys';

import {ConfigReleaseService} from '../services/api/configRelease/configRelease.service';
import {SettingsDebug, SettingsGeneral} from '../config';
import version from '../../config/version.json';
import {SettingsService} from '../services/settings';
import {MainMenuComponent} from '../components';
import {DEBUG_INFO} from '../misc/constants';
import {DebugDialogService} from '../services/debugDialog';

/**
 * Application root component
 */
@Component(
{
    selector: 'app',
    templateUrl: 'app.component.html',
    styleUrl: 'app.component.scss',
    imports:
    [
        Console,
        RouterOutlet,
        MainMenuComponent,
        ProgressIndicatorModule,
        NotificationsGlobalModule,
        HotkeysCheatsheetComponent,
        InternalServerErrorComponent,
    ],
    providers:
    [
        AppHotkeysService,
        ConfigReleaseService,
    ],
})
export class AppComponent implements AfterViewInit, OnDestroy
{
    //######################### private fields #########################

    /**
     * Html style element for override
     */
    private _style: HTMLStyleElement|undefined|null;

    /**
     * Subscription for router outlet activation changes
     */
    private _routerOutletActivatedSubscription: Subscription|undefined|null;

    /**
     * Subscription for changes of general settings
     */
    private _settingsChangeSubscription: Subscription;

    /**
     * Subscription for changes of debugging settings
     */
    private _settingsDebuggingChangeSubscription: Subscription;

    /**
     * Subscriptions created during initialization
     */
    private _initSubscriptions: Subscription = new Subscription();

    /**
     * Currently active theme
     */
    private _theme: string;

    //######################### public properties - template bindings #########################

    /**
     * Indication whether is console visible
     */
    public consoleVisible: WritableSignal<boolean> = signal(false);

    /**
     * Name of state for routed component animation
     */
    public routeComponentState: string = 'none';

    /**
     * Current version of gui
     */
    public guiVersion: string = version.version;

    /**
     * Indication whether is application initialized
     */
    public initialized: boolean = false;

    //######################### public properties - children #########################

    /**
     * Router outlet that is used for loading routed components
     */
    @ViewChild('outlet')
    public routerOutlet: RouterOutlet|undefined|null;

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

    //######################### public methods - implementation of AfterViewInit #########################

    /**
     * Called when view was initialized
     */
    public ngAfterViewInit(): void
    {
        // this._routerOutletActivatedSubscription = this.routerOutlet?.activateEvents.subscribe(() =>
        // {
        //     this.routeComponentState = this.routerOutlet?.activatedRouteData['animation'] || (<any>this.routerOutlet?.activatedRoute.component).name;
        // });

        // this.initialized = true;
    }

    //######################### public methods - implementation of OnDestroy #########################

    /**
     * Called when component is destroyed
     */
    public ngOnDestroy(): void
    {
        this._routerOutletActivatedSubscription?.unsubscribe();
        this._routerOutletActivatedSubscription = null;

        this._settingsChangeSubscription?.unsubscribe();
        this._settingsDebuggingChangeSubscription?.unsubscribe();

        this._initSubscriptions?.unsubscribe();

        this._appHotkeys.destroy();
    }

    //######################### private methods #########################

    /**
     * Toggles hotkey for displaying console log
     */
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

    /**
     * Generates css override for environment
     */
    private async _generateOverride(): Promise<void>
    {
        const env = await lastValueFrom(this._configRelease.get());

        if(!env)
        {
            throw new Error('AppComponent: Failed to obtain config release!');
        }

        if(!env.prostredie)
        {
            return;
        }

        const head = this._document.head || this._document.getElementsByTagName('head')[0];
        this._style = this._document.createElement('style');

        const css = `main-menu.env-override
        {
            background: ${env.prostredie.bg};
            color: ${env.prostredie.fg};
        }

        main-menu.env-override a
        {
            color: ${env.prostredie.fg};
        }

        .cpt-menu .mat-mdc-menu-content,
        .statistiky-submenu
        {
            background: ${env.prostredie.bg};
        }

        .cpt-menu .mat-mdc-menu-content .mat-mdc-menu-item,
        .statistiky-submenu a
        {
            color: ${env.prostredie.fg};
        }`;
        // const css = `main-menu.env-override.navbar-default
        // {
        //     background: ${env.prostredie.bg};
        // }

        // main-menu.env-override.navbar-default .dropdown-menu
        // {
        //     background: ${env.prostredie.bg};
        // }

        // main-menu.env-override.navbar-default .active>a,
        // main-menu.env-override.navbar-default .active>a:hover,
        // main-menu.env-override.navbar-default li>a:hover,
        // main-menu.env-override.navbar-default .open>a:hover,
        // main-menu.env-override.navbar-default .open>a
        // {
        //     background: rgba(0, 0, 0, 0.2);
        //     color: ${env.prostredie.fg};
        // }

        // main-menu.env-override.navbar-default .navbar-brand,
        // main-menu.env-override.navbar-default .navbar-version
        // {
        //     color: ${env.prostredie.fg};
        // }

        // main-menu.env-override.navbar-default li>a
        // {
        //     color: ${env.prostredie.fg};
        // }`;

        head.appendChild(this._style);

        this._style.appendChild(this._document.createTextNode(css));
    }

    /**
     * Sets debug hotkeys
     * @param permissions Array of permissions
     */
    private _setDebugHotkeys(permissions: string[])
    {
        if(permissions.find(permission => permission == DEBUG_INFO))
        {
            this._appHotkeys.hotkeys.add(new Hotkey('f2', () =>
            {
                this._debugDialogSvc.showDebugDialog();

                return false;
            }, undefined, 'Nástroje pre ladenie'));
        }
        else
        {
            const hotkey = this._appHotkeys.hotkeys.get('f2');

            if(hotkey)
            {
                this._appHotkeys.hotkeys.remove(hotkey);
            }
        }
    }
}
