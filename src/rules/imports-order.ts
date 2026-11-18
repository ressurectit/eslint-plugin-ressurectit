/**
 * @fileoverview Checks whether are imports in correct order
 * @author kukjevov
 */

import {AST_NODE_TYPES} from '@typescript-eslint/utils';
import type {RuleFix} from '@typescript-eslint/utils/ts-eslint';
import type {TSESTree} from '@typescript-eslint/utils';

import {createRule} from '../utils/index.js';

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

/**
 * Gets group index of import source, matches on scope segment and package name, never on raw prefix
 * @param source - Import source (module specifier)
 * @returns Index of group, 0 `@angular/core`, 1 `@angular/core/*`, 2 `@angular/*`, 3 `@anglr/*`, 4 `@jscrpt/common`, 5 other `@jscrpt/*`, 6 other scoped, 7 other absolute, 8 relative
 */
function getImportGroup(source: string): number
{
    if(source.startsWith('.'))
    {
        return 8;
    }

    if(!source.startsWith('@'))
    {
        return 7;
    }

    const segments = source.split('/');
    const scope = segments[0];
    const pkg = segments[1];

    switch(scope)
    {
        case '@angular':
        {
            if(pkg == 'core')
            {
                return segments.length > 2 ? 1 : 0;
            }

            return 2;
        }
        case '@anglr':
        {
            return 3;
        }
        case '@jscrpt':
        {
            return pkg == 'common' ? 4 : 5;
        }
        default:
        {
            return 6;
        }
    }
}

export default createRule(
{
    name: 'imports-order',
    meta:
    {
        docs:
        {
            description: 'Checks whether are imports in correct order',
            recommended: 'stylistic',
            requiresTypeChecking: false,
            extendsBaseRule: false,
        },
        messages: 
        {
            "msg": "Imports are not in recommended order: '@angular/core', '@angular/core/*', '@angular/*', '@anglr/*', '@jscrpt/common', '@jscrpt/*', other scoped, other absolute, relative"
        },
        schema:
        [
        ],
        type: 'layout',
        fixable: 'whitespace'
    },
    defaultOptions: [],
    create(context)
    {
        const sourceCode = context.sourceCode;

        return {
            Program(node)
            {
                const imports = node.body.filter(itm => itm.type == AST_NODE_TYPES.ImportDeclaration) as TSESTree.ImportDeclaration[];

                if(!imports.length)
                {
                    return;
                }

                const groups = imports.map(itm => getImportGroup(itm.source.value as string));
                let faulty = false;

                for(let x = 1; x < groups.length; x++)
                {
                    if(groups[x] < groups[x - 1])
                    {
                        faulty = true;

                        break;
                    }
                }

                if(!faulty)
                {
                    return;
                }

                context.report(
                {
                    messageId: "msg",
                    node,
                    loc:
                    {
                        start: imports[0].loc.start,
                        end: imports[imports.length - 1].loc.end
                    },
                    fix(fixer)
                    {
                        const ordered = imports
                            .map((itm, index) => ({itm, index, group: groups[index]}))
                            .sort((first, second) => first.group - second.group || first.index - second.index)
                            .map(itm => itm.itm);

                        const result: RuleFix[] = [];

                        for(let x = 0; x < ordered.length; x++)
                        {
                            result.push(fixer.replaceText(imports[x], sourceCode.getText(ordered[x])));
                        }

                        return result;
                    }
                });
            }
        };
    }
});
