/**
 * @fileoverview Checks whether are imports in correct order
 * @author kukjevov
 */

import {isString} from '@jscrpt/common';
import {AST_NODE_TYPES} from '@typescript-eslint/utils';
import type {RuleFix} from '@typescript-eslint/utils/dist/ts-eslint';
import type {ImportDeclaration} from '@typescript-eslint/types/dist/generated/ast-spec';

import {createRule} from '../utils';

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

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
        const order = ['@angular/core', '@angular', '@anglr', '@jscrpt', '@'];
        const sourceCode = context.sourceCode;

        return {
            Program(node)
            {
                let imports: ImportDeclaration[] = node.body.filter(itm => itm.type == AST_NODE_TYPES.ImportDeclaration) as any;
                
                if(imports.length)
                {
                    let faulty = false;
                    let lastIndex = -1;
                    let relative = false;
                    let general = false;

                    for(let x = 0; x < imports.length; x++)
                    {
                        let $import = imports[x];
                        let name = $import.source.value as string;
                        let hasOrder = order.find(itm => name.startsWith(itm));

                        if(hasOrder)
                        {
                            //relative or general npm was already present
                            if(relative || general)
                            {
                                faulty = true;

                                break;
                            }

                            let orderIndex = order.indexOf(hasOrder);

                            //out of order
                            if(orderIndex < lastIndex)
                            {
                                faulty = true;

                                break;
                            }

                            lastIndex = orderIndex;

                            continue;
                        }

                        //general
                        if(!name.startsWith('.'))
                        {
                            //relative was already present
                            if(relative)
                            {
                                faulty = true;

                                break;
                            }

                            general = true;

                            continue;
                        }

                        //relative
                        if(name.startsWith('.'))
                        {
                            relative = true;
                        }
                    }

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
                            },
                            fix(fixer)
                            {
                                const ordered = [...imports].sort((first, second) =>
                                {
                                    if(!isString(first.source.value) || !isString(second.source.value))
                                    {
                                        return 0;
                                    }

                                    if(first.source.value == "@angular/core")
                                    {
                                        return -1;
                                    }

                                    if(second.source.value == "@angular/core")
                                    {
                                        return 1;
                                    }

                                    if(first.source.value.startsWith("@angular") && second.source.value.startsWith("@angular"))
                                    {
                                        return 0;
                                    }

                                    if(first.source.value.startsWith("@angular"))
                                    {
                                        return -1;
                                    }

                                    if(second.source.value.startsWith("@angular"))
                                    {
                                        return 1;
                                    }

                                    if(first.source.value.startsWith("@anglr") && second.source.value.startsWith("@anglr"))
                                    {
                                        return 0;
                                    }

                                    if(first.source.value.startsWith("@anglr"))
                                    {
                                        return -1;
                                    }

                                    if(second.source.value.startsWith("@anglr"))
                                    {
                                        return 1;
                                    }

                                    if(first.source.value.startsWith("@jscrpt") && second.source.value.startsWith("@jscrpt"))
                                    {
                                        return 0;
                                    }

                                    if(first.source.value.startsWith("@jscrpt"))
                                    {
                                        return -1;
                                    }

                                    if(second.source.value.startsWith("@jscrpt"))
                                    {
                                        return 1;
                                    }

                                    if(first.source.value.startsWith("@") && second.source.value.startsWith("@"))
                                    {
                                        return 0;
                                    }

                                    if(first.source.value.startsWith("@"))
                                    {
                                        return -1;
                                    }

                                    if(second.source.value.startsWith("@"))
                                    {
                                        return 1;
                                    }

                                    if(first.source.value.startsWith(".") && second.source.value.startsWith("."))
                                    {
                                        return 0;
                                    }

                                    if(!first.source.value.startsWith("."))
                                    {
                                        return -1;
                                    }

                                    if(!second.source.value.startsWith("."))
                                    {
                                        return 1;
                                    }

                                    return 0;
                                });

                                let result: RuleFix[] = [];

                                for(let x = 0; x < ordered.length; x++)
                                {
                                    let original = imports[x];
                                    let orderedOne = ordered[x];

                                    result.push(fixer.replaceText(original, sourceCode.getText(orderedOne)));
                                }

                                return result;
                            }
                        });
                    }
                }
            }
        };
    }
});