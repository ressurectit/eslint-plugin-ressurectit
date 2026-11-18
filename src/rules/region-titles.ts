/**
 * @fileoverview Checks format, placement and order of region titles inside class bodies
 * @author kukjevov
 */

import {AST_NODE_TYPES} from '@typescript-eslint/utils';
import type {TSESTree} from '@typescript-eslint/utils';

import {createRule} from '../utils/index.js';

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

/**
 * Options of region-titles rule
 */
export interface RegionTitlesOptions
{
    /**
     * Names of regions replacing built-in list, array order is required order
     */
    names?: string[];

    /**
     * Additional names of regions, allowed anywhere and not order checked
     */
    additionalNames?: string[];
}

/**
 * Built-in names of regions in required order, `<name>` is a non-empty wildcard
 */
const DEFAULT_NAMES =
[
    'ng language server',
    'public static properties',
    'private fields',
    'protected fields',
    'protected properties',
    'protected properties - template bindings',
    'protected properties - host bindings',
    'protected properties - children',
    'protected properties - overrides',
    'public properties',
    'public properties - inputs',
    'public properties - outputs',
    'public properties - models',
    'public properties - implementation of <name>',
    'constructor',
    'public methods - static',
    'public methods - implementation of <name>',
    'public methods',
    'protected methods - template bindings',
    'protected methods - host listeners',
    'protected methods - overrides',
    'protected methods',
    'private methods',
];

/**
 * Legacy names of regions, they have dedicated message
 */
const LEGACY_NAMES =
[
    'public properties - children',
    'public properties - template bindings',
    'public methods - template bindings',
];

/**
 * Regular expression for region title
 */
const TITLE_REGEX = /^#{25} (.+) #{25}$/;

/**
 * Creates matcher of region name, `<name>` is non-empty wildcard
 * @param pattern - Name pattern
 * @returns Regular expression matching whole name
 */
function createNameMatcher(pattern: string): RegExp
{
    const escaped = pattern
        .split('<name>')
        .map(part => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
        .join('.+');

    return new RegExp(`^${escaped}$`);
}

export default createRule<[RegionTitlesOptions], 'invalidFormat'|'unknownName'|'legacyName'|'wrongOrder'|'blankLineBefore'|'blankLineAfter'|'constructorTitle'>(
{
    name: 'region-titles',
    meta:
    {
        docs:
        {
            description: 'Checks format, placement and order of region titles inside class bodies',
            recommended: 'stylistic',
            requiresTypeChecking: false,
            extendsBaseRule: false,
        },
        messages:
        {
            invalidFormat: "Region title must be '//######################### <name> #########################'.",
            unknownName: "Unknown region title '{{name}}'.",
            legacyName: "Legacy region title '{{name}}': use a protected member and a 'protected …' title.",
            wrongOrder: "Region '{{name}}' must come before '{{previous}}'.",
            blankLineBefore: 'Blank line required before region title.',
            blankLineAfter: 'Blank line required after region title.',
            constructorTitle: "'constructor' title must be directly followed by 'constructor('.",
        },
        schema:
        [
            {
                type: 'object',
                properties:
                {
                    names:
                    {
                        type: 'array',
                        items: {type: 'string'},
                    },
                    additionalNames:
                    {
                        type: 'array',
                        items: {type: 'string'},
                    },
                },
                additionalProperties: false,
            },
        ],
        type: 'layout',
    },
    defaultOptions: [{}],
    create(context, [options])
    {
        const sourceCode = context.sourceCode;
        const matchers = (options.names ?? DEFAULT_NAMES).map(createNameMatcher);
        const additionalMatchers = (options.additionalNames ?? []).map(createNameMatcher);

        /**
         * Gets index of name in active list, -1 if not found
         * @param name - Name of region
         */
        const indexOf = (name: string): number => matchers.findIndex(matcher => matcher.test(name));

        /**
         * Checks whether region title is followed directly by constructor
         * @param comment - Region title comment
         * @param body - Class body containing the comment
         */
        const followedByConstructor = (comment: TSESTree.Comment, body: TSESTree.ClassBody): boolean =>
        {
            const next = body.body.find(member => member.range[0] >= comment.range[1]);

            return !!next &&
                   next.type == AST_NODE_TYPES.MethodDefinition &&
                   next.kind == 'constructor' &&
                   next.loc.start.line == comment.loc.end.line + 1;
        };

        return {
            'Program:exit'()
            {
                const lastByBody = new Map<TSESTree.Node, {index: number; name: string}>();

                for(const comment of sourceCode.getAllComments())
                {
                    if(comment.type != 'Line' || !comment.value.startsWith('#'))
                    {
                        continue;
                    }

                    const body = sourceCode.getNodeByRangeIndex(comment.range[0]);

                    if(body?.type != AST_NODE_TYPES.ClassBody)
                    {
                        continue;
                    }

                    const match = TITLE_REGEX.exec(comment.value);

                    if(!match)
                    {
                        context.report({node: body, loc: comment.loc, messageId: 'invalidFormat'});

                        continue;
                    }

                    const name = match[1];
                    const index = indexOf(name);

                    if(LEGACY_NAMES.includes(name) && index < 0)
                    {
                        context.report({node: body, loc: comment.loc, messageId: 'legacyName', data: {name}});
                    }
                    else if(index < 0)
                    {
                        if(!additionalMatchers.some(matcher => matcher.test(name)))
                        {
                            context.report({node: body, loc: comment.loc, messageId: 'unknownName', data: {name}});
                        }
                    }
                    else
                    {
                        const last = lastByBody.get(body);

                        if(last && index < last.index)
                        {
                            context.report({node: body, loc: comment.loc, messageId: 'wrongOrder', data: {name, previous: last.name}});
                        }
                        else
                        {
                            lastByBody.set(body, {index, name});
                        }
                    }

                    const previous = sourceCode.getTokenBefore(comment, {includeComments: true});

                    if(previous && previous.range[0] != body.range[0] && comment.loc.start.line - previous.loc.end.line < 2)
                    {
                        context.report({node: body, loc: comment.loc, messageId: 'blankLineBefore'});
                    }

                    if(name == 'constructor')
                    {
                        if(!followedByConstructor(comment, body))
                        {
                            context.report({node: body, loc: comment.loc, messageId: 'constructorTitle'});
                        }

                        continue;
                    }

                    //any title directly followed by constructor skips blank line after (owner decision)
                    if(followedByConstructor(comment, body))
                    {
                        continue;
                    }

                    const next = sourceCode.getTokenAfter(comment, {includeComments: true});

                    if(next && next.value != '}' && next.loc.start.line - comment.loc.end.line < 2)
                    {
                        context.report({node: body, loc: comment.loc, messageId: 'blankLineAfter'});
                    }
                }
            },
        };
    },
});
