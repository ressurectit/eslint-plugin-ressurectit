/**
 * @fileoverview Checks property order, multi-line layout and array item order of Angular decorator metadata
 * @author kukjevov
 */

import {AST_NODE_TYPES} from '@typescript-eslint/utils';
import type {TSESTree} from '@typescript-eslint/utils';
import type {RuleFix, RuleFixer} from '@typescript-eslint/utils/ts-eslint';

import {createRule, getLineIndent, getLiteralItems} from '../utils/index.js';

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

/**
 * Options of angular-metadata rule
 */
export interface AngularMetadataOptions
{
    /**
     * Custom property order per decorator name, replaces default order of that decorator
     */
    order?: Record<string, string[]>;
}

/**
 * Message ids of angular-metadata rule
 */
type MessageIds = 'propertyOrder'|'mustBeMultiline'|'arrayOrder'|'metadataMultiline';

/**
 * Component and directive default property order
 */
const COMPONENT_ORDER = ['selector', 'standalone', 'templateUrl', 'template', 'styleUrl', 'styleUrls', 'styles', 'host', 'inputs', 'outputs', 'imports', 'providers', 'viewProviders', 'hostDirectives', 'changeDetection', 'encapsulation', 'schemas', 'animations', 'exportAs'];

/**
 * Default property order per decorator name
 */
const DEFAULT_ORDER: Record<string, string[]> =
{
    Component: COMPONENT_ORDER,
    Directive: COMPONENT_ORDER,
    NgModule: ['imports', 'declarations', 'providers', 'exports', 'bootstrap', 'schemas'],
    Pipe: ['name', 'standalone', 'pure'],
    Injectable: ['providedIn'],
};

/**
 * Decorators that are checked for layout (G.2, G.3, G.4), others are checked only for property order
 */
const LAYOUT_DECORATORS = ['Component', 'Directive', 'NgModule'];

/**
 * Properties that must be multi-line literals
 */
const MULTILINE_PROPERTIES = ['imports', 'providers', 'host'];

/**
 * Properties whose array items must be sorted by length
 */
const SORTED_PROPERTIES = ['imports', 'providers', 'viewProviders', 'declarations', 'exports'];

/**
 * Indentation step
 */
const INDENT = '    ';

/**
 * Gets name of property key, if it is static
 * @param property - Property to get name of
 * @returns Name of property or null
 */
function getPropertyName(property: TSESTree.ObjectLiteralElement): string|null
{
    if(property.type != AST_NODE_TYPES.Property || property.computed)
    {
        return null;
    }

    if(property.key.type == AST_NODE_TYPES.Identifier)
    {
        return property.key.name;
    }

    if(property.key.type == AST_NODE_TYPES.Literal && typeof property.key.value == 'string')
    {
        return property.key.value;
    }

    return null;
}

/**
 * Gets whether literal has opener on its own line and each item on its own line
 * @param literal - Non empty literal to check
 * @param key - Key of property that owns literal
 * @param items - Items of literal
 * @returns True if literal is multi-line in required form
 */
function isExploded(literal: TSESTree.Node, key: TSESTree.Node, items: TSESTree.Node[]): boolean
{
    if(literal.loc.start.line <= key.loc.end.line || items[0].loc.start.line <= literal.loc.start.line)
    {
        return false;
    }

    for(let x = 1; x < items.length; x++)
    {
        if(items[x].loc.start.line <= items[x - 1].loc.end.line)
        {
            return false;
        }
    }

    return literal.loc.end.line > items[items.length - 1].loc.end.line;
}

/**
 * Creates text of exploded literal, opener and closer on own lines at base indentation, items one level deeper
 * @param opener - Opening bracket
 * @param closer - Closing bracket
 * @param itemTexts - Texts of items
 * @param base - Base indentation
 * @returns Exploded text
 */
function explode(opener: string, closer: string, itemTexts: string[], base: string): string
{
    return `${base}${opener}\n${itemTexts.map(itm => `${base}${INDENT}${itm},\n`).join('')}${base}${closer}`;
}

export default createRule<[AngularMetadataOptions], MessageIds>(
{
    name: 'angular-metadata',
    meta:
    {
        docs:
        {
            description: 'Checks property order, multi-line layout and array item order of Angular decorator metadata',
            recommended: 'stylistic',
            requiresTypeChecking: false,
            extendsBaseRule: false,
        },
        messages:
        {
            propertyOrder: "'{{property}}' must come before '{{previous}}' in @{{decorator}} metadata.",
            mustBeMultiline: "'{{property}}' must be a multi-line literal.",
            arrayOrder: "Items of '{{property}}' must be sorted by length (shortest first).",
            metadataMultiline: '@{{decorator}} metadata must be a multi-line object.',
        },
        schema:
        [
            {
                type: 'object',
                properties:
                {
                    order:
                    {
                        type: 'object',
                        properties:
                        {
                            Component: {type: 'array', items: {type: 'string'}},
                            Directive: {type: 'array', items: {type: 'string'}},
                            NgModule: {type: 'array', items: {type: 'string'}},
                            Pipe: {type: 'array', items: {type: 'string'}},
                            Injectable: {type: 'array', items: {type: 'string'}},
                        },
                        additionalProperties: false,
                    },
                },
                additionalProperties: false,
            },
        ],
        type: 'layout',
        fixable: 'code',
    },
    defaultOptions: [{}],
    create(context, [options])
    {
        const sourceCode = context.sourceCode;
        const order = {...DEFAULT_ORDER, ...options.order};

        //local name => imported name, of '@angular/core' imports
        const angularNames = new Map<string, string>();

        /**
         * Checks property order (G.1), reports only
         * @param decorator - Name of decorator
         * @param metadata - Metadata object
         */
        const checkOrder = (decorator: string, metadata: TSESTree.ObjectExpression): void =>
        {
            const expected = order[decorator] ?? [];
            let previous: {name: string; index: number}|null = null;

            for(const property of metadata.properties)
            {
                const name = getPropertyName(property);
                const index = name === null ? -1 : expected.indexOf(name);

                if(name === null || index < 0)
                {
                    continue;
                }

                if(previous && index < previous.index)
                {
                    context.report(
                    {
                        messageId: 'propertyOrder',
                        node: property,
                        data: {property: name, previous: previous.name, decorator},
                    });

                    continue;
                }

                previous = {name, index};
            }
        };

        /**
         * Checks that property literal is multi-line (G.2)
         * @param property - Property to check
         * @param name - Name of property
         */
        const checkMultiline = (property: TSESTree.Property, name: string): void =>
        {
            const value = property.value;

            if(value.type != AST_NODE_TYPES.ArrayExpression && value.type != AST_NODE_TYPES.ObjectExpression)
            {
                return;
            }

            const items = getLiteralItems(value);

            if(!items || !items.length || isExploded(value, property.key, items))
            {
                return;
            }

            context.report(
            {
                messageId: 'mustBeMultiline',
                node: property,
                data: {property: name},
                fix: (fixer: RuleFixer) =>
                {
                    const colon = sourceCode.getTokenAfter(property.key);

                    if(!colon || colon.value != ':' || sourceCode.getCommentsInside(property).length)
                    {
                        return null;
                    }

                    const texts = items.map(itm => sourceCode.getText(itm));

                    if(texts.some(itm => itm.includes('\n')))
                    {
                        return null;
                    }

                    const base = getLineIndent(sourceCode, property.loc.start.line);
                    const isArray = value.type == AST_NODE_TYPES.ArrayExpression;
                    const text = explode(isArray ? '[' : '{', isArray ? ']' : '}', texts, base);

                    return fixer.replaceTextRange([colon.range[1], value.range[1]], `\n${text}`);
                },
            });
        };

        /**
         * Checks that array items are sorted by length (G.3)
         * @param property - Property to check
         * @param name - Name of property
         */
        const checkArrayOrder = (property: TSESTree.Property, name: string): void =>
        {
            const value = property.value;

            if(value.type != AST_NODE_TYPES.ArrayExpression)
            {
                return;
            }

            const items = getLiteralItems(value);

            if(!items || items.length < 2 || items.some(itm => itm.type == AST_NODE_TYPES.SpreadElement))
            {
                return;
            }

            const texts = items.map(itm => sourceCode.getText(itm));

            if(!texts.some((itm, index) => index > 0 && texts[index - 1].length > itm.length))
            {
                return;
            }

            context.report(
            {
                messageId: 'arrayOrder',
                node: property,
                data: {property: name},
                fix: (fixer: RuleFixer) =>
                {
                    if(sourceCode.getCommentsInside(value).length)
                    {
                        return null;
                    }

                    const sorted = texts
                        .map((text, index) => ({text, index}))
                        .sort((first, second) => first.text.length - second.text.length || first.index - second.index);
                    const result: RuleFix[] = [];

                    for(let x = 0; x < items.length; x++)
                    {
                        if(sorted[x].index != x)
                        {
                            result.push(fixer.replaceText(items[x], sorted[x].text));
                        }
                    }

                    return result;
                },
            });
        };

        /**
         * Checks that metadata object spans multiple lines (G.4)
         * @param decorator - Name of decorator
         * @param metadata - Metadata object
         * @param node - Decorator node
         */
        const checkMetadataMultiline = (decorator: string, metadata: TSESTree.ObjectExpression, node: TSESTree.Decorator): void =>
        {
            if(!metadata.properties.length || metadata.loc.start.line != metadata.loc.end.line)
            {
                return;
            }

            context.report(
            {
                messageId: 'metadataMultiline',
                node: metadata,
                data: {decorator},
                fix: (fixer: RuleFixer) =>
                {
                    if(sourceCode.getCommentsInside(metadata).length)
                    {
                        return null;
                    }

                    const base = getLineIndent(sourceCode, node.loc.start.line);
                    const text = explode('{', '}', metadata.properties.map(itm => sourceCode.getText(itm)), base);

                    return fixer.replaceText(metadata, `\n${text}`);
                },
            });
        };

        return {
            ImportDeclaration(node)
            {
                if(node.source.value != '@angular/core')
                {
                    return;
                }

                for(const specifier of node.specifiers)
                {
                    if(specifier.type == AST_NODE_TYPES.ImportSpecifier && specifier.imported.type == AST_NODE_TYPES.Identifier)
                    {
                        angularNames.set(specifier.local.name, specifier.imported.name);
                    }
                }
            },
            Decorator(node)
            {
                const call = node.expression;

                if(call.type != AST_NODE_TYPES.CallExpression || call.callee.type != AST_NODE_TYPES.Identifier)
                {
                    return;
                }

                const decorator = angularNames.get(call.callee.name);
                const metadata = call.arguments[0];

                if(!decorator || !order[decorator] || !metadata || metadata.type != AST_NODE_TYPES.ObjectExpression)
                {
                    return;
                }

                checkOrder(decorator, metadata);

                if(!LAYOUT_DECORATORS.includes(decorator))
                {
                    return;
                }

                checkMetadataMultiline(decorator, metadata, node);

                for(const property of metadata.properties)
                {
                    const name = getPropertyName(property);

                    if(name === null || property.type != AST_NODE_TYPES.Property)
                    {
                        continue;
                    }

                    if(MULTILINE_PROPERTIES.includes(name))
                    {
                        checkMultiline(property, name);
                    }

                    if(SORTED_PROPERTIES.includes(name))
                    {
                        checkArrayOrder(property, name);
                    }
                }
            },
        };
    },
});
