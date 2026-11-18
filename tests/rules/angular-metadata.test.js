/**
 * @fileoverview Tests for angular-metadata rule
 */

import {ruleTester, dedent} from '../helpers/ruleTester.js';
import rule from '../../lib/rules/angular-metadata.js';

const head = "import {Component, Directive, NgModule, Injectable} from '@angular/core';\n";

ruleTester.run('angular-metadata', rule,
{
    valid:
    [
        {
            code: head + dedent(`
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
                export class AppComponent
                {
                }
            `),
        },
        {
            code: head + dedent(`
                @Directive(
                {
                    selector: '[dateTime][dateTimeInput][static]',
                    providers:
                    [
                        <ExistingProvider>
                        {
                            provide: DATE_TIME_INPUT,
                            useExisting: forwardRef(() => StaticDateTimeInputDirective),
                        },
                    ],
                    exportAs: 'dateTime',
                })
                export class StaticDateTimeInputDirective
                {
                }
            `),
        },
        {
            code: head + dedent(`
                @Directive(
                {
                    selector: '[lineThroughIf]',
                    host:
                    {
                        '[style.textDecoration]': 'condition() ? "line-through" : "none"',
                    },
                })
                export class LineThroughIf
                {
                }
            `),
        },
        {
            code: head + dedent(`
                @Component(
                {
                    selector: 'hodnotenie-page',
                    templateUrl: 'hodnotenie.component.html',
                    styleUrl: 'hodnotenie.component.scss',
                    imports:
                    [
                        Select,
                        Option,
                        FormField,
                        RouterLink,
                        NgScrollbar,
                        LocalizePipe,
                        OknoComponent,
                        DateFormatPipe,
                        MosiaFormatPipe,
                        TooltipDirective,
                        SelectFormControl,
                        AuthorizeDirective,
                        OverviewLineComponent,
                        FirstUppercaseLocalizePipe,
                    ],
                    providers:
                    [
                        EnumService,
                        HodnotenieService,
                    ],
                })
                @WithPageContentCssClass()
                export default class HodnotenieComponent
                {
                }
            `),
        },
        {
            code: head + "@Injectable({providedIn: 'root'})\nexport class A\n{\n}",
        },
        {
            code: "import {Component} from 'other-lib';\n@Component({template: '', selector: 'x'})\nexport class A\n{\n}",
        },
    ],
    invalid:
    [
        {
            code: head + dedent(`
                @Component(
                {
                    templateUrl: 'a.html',
                    selector: 'a',
                })
                export class A
                {
                }
            `),
            output: null,
            errors: [{messageId: 'propertyOrder', data: {property: 'selector', previous: 'templateUrl', decorator: 'Component'}}],
        },
        {
            code: head + dedent(`
                @Component(
                {
                    selector: 'a',
                    exportAs: 'a',
                    providers:
                    [
                        A,
                    ],
                })
                export class A
                {
                }
            `),
            output: null,
            errors: [{messageId: 'propertyOrder'}],
        },
        {
            code: head + dedent(`
                @Component(
                {
                    selector: 'a',
                    imports: [A],
                })
                export class A
                {
                }
            `),
            output: head + dedent(`
                @Component(
                {
                    selector: 'a',
                    imports:
                    [
                        A,
                    ],
                })
                export class A
                {
                }
            `),
            errors: [{messageId: 'mustBeMultiline'}],
        },
        {
            code: head + dedent(`
                @Component(
                {
                    selector: 'a',
                    imports:
                    [
                        MainMenuComponent,
                        Console,
                    ],
                })
                export class A
                {
                }
            `),
            output: head + dedent(`
                @Component(
                {
                    selector: 'a',
                    imports:
                    [
                        Console,
                        MainMenuComponent,
                    ],
                })
                export class A
                {
                }
            `),
            errors: [{messageId: 'arrayOrder'}],
        },
        {
            code: head + dedent(`
                @Component(
                {
                    selector: 'a',
                    imports:
                    [
                        MainMenuComponent,
                        // comment
                        Console,
                    ],
                })
                export class A
                {
                }
            `),
            output: null,
            errors: [{messageId: 'arrayOrder'}],
        },
        {
            code: head + "@Component({selector: 'a', template: ''})\nexport class A\n{\n}",
            output: head + "@Component(\n{\n    selector: 'a',\n    template: '',\n})\nexport class A\n{\n}",
            errors: [{messageId: 'metadataMultiline'}],
        },
        {
            code: head + dedent(`
                @NgModule(
                {
                    declarations:
                    [
                        A,
                    ],
                    imports:
                    [
                        B,
                    ],
                })
                export class M
                {
                }
            `),
            output: null,
            errors: [{messageId: 'propertyOrder', data: {property: 'imports', previous: 'declarations', decorator: 'NgModule'}}],
        },
    ],
});
