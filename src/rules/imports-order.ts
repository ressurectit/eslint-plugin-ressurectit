/**
 * @fileoverview Checks whether are imports in correct order
 * @author kukjevov
 */

import {isString} from '@jscrpt/common';
import {AST_NODE_TYPES} from '@typescript-eslint/experimental-utils';
import type {ImportDeclaration} from '@typescript-eslint/types/dist/ast-spec';

import {createRule} from '../utils/createRule';


//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

export = createRule(
{
    name: 'imports-order',
    meta:
    {
        docs:
        {
            category: 'Stylistic Issues',
            description: 'Checks whether are imports in correct order',
            recommended: "warn",
            requiresTypeChecking: false,
            extendsBaseRule: false,
            suggestion: false
        },
        messages: 
        {
            "msg": "Imports are not in recommended order. First '@angular/core', '@angular/*', '@anglr/*', '@*/*', '*', './*'"
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
        const order = {'@angular/core': true, '@angular': true, '@anglr': true, '@jscrpt': true, '@': true};

        return {
            Program(node)
            {
                let imports: ImportDeclaration[] = node.body.filter(itm => itm.type == AST_NODE_TYPES.ImportDeclaration) as any;
                
                if(imports.length)
                {
                    let faulty = false;
                    let orderNames = Object.keys(order);
                    let lastIndex = 0;

                    for(let x = 0; x < imports.length; x++)
                    {
                        let $import = imports[x];
                        let name = $import.source.value as string;
                        let hasOrder = orderNames.find(itm => name.startsWith(itm));

                        if(hasOrder)
                        {
                            let orderIndex = order[hasOrder];
                        }
                    }

                    // imports = imports.sort((first, second) =>
                    // {
                    //     if(!isString(first.source.value) || !isString(second.source.value))
                    //     {
                    //         return 0;
                    //     }

                    //     if(first.source.value == "@angular/core")
                    //     {
                    //         return -1;
                    //     }

                    //     if(second.source.value == "@angular/core")
                    //     {
                    //         return 1;
                    //     }

                    //     if(first.source.value.startsWith("@angular") && second.source.value.startsWith("@angular"))
                    //     {
                    //         return 0;
                    //     }

                    //     if(first.source.value.startsWith("@angular"))
                    //     {
                    //         return -1;
                    //     }

                    //     if(second.source.value.startsWith("@angular"))
                    //     {
                    //         return 1;
                    //     }

                    //     if(first.source.value.startsWith("@anglr") && second.source.value.startsWith("@anglr"))
                    //     {
                    //         return 0;
                    //     }

                    //     if(first.source.value.startsWith("@anglr"))
                    //     {
                    //         return -1;
                    //     }

                    //     if(second.source.value.startsWith("@anglr"))
                    //     {
                    //         return 1;
                    //     }

                    //     if(first.source.value.startsWith("@jscrpt") && second.source.value.startsWith("@jscrpt"))
                    //     {
                    //         return 0;
                    //     }

                    //     if(first.source.value.startsWith("@jscrpt"))
                    //     {
                    //         return -1;
                    //     }

                    //     if(second.source.value.startsWith("@jscrpt"))
                    //     {
                    //         return 1;
                    //     }

                    //     if(first.source.value.startsWith("@") && second.source.value.startsWith("@"))
                    //     {
                    //         return 0;
                    //     }

                    //     if(first.source.value.startsWith("@"))
                    //     {
                    //         return -1;
                    //     }

                    //     if(second.source.value.startsWith("@"))
                    //     {
                    //         return 1;
                    //     }

                    //     if(first.source.value.startsWith(".") && second.source.value.startsWith("."))
                    //     {
                    //         return 0;
                    //     }

                    //     if(!first.source.value.startsWith("."))
                    //     {
                    //         return -1;
                    //     }

                    //     if(!second.source.value.startsWith("."))
                    //     {
                    //         return 1;
                    //     }

                    //     return 0;
                    // });

                    if(faulty)
                    {
                        context.report(
                        {
                            messageId: "msg",
                            node,
                            loc:
                            {
                                start: imports[0].loc.start,
                                end: imports[imports.length - 1].loc.end
                            }
                        });
                    }
                }
            }
        };
    }
});