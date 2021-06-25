/**
 * @fileoverview Checks new lines between imports
 * @author kukjevov
 */

import {AST_NODE_TYPES} from '@typescript-eslint/experimental-utils';
//  import type {RuleFix} from '@typescript-eslint/experimental-utils/dist/ts-eslint';
import type {ImportDeclaration} from '@typescript-eslint/types/dist/ast-spec';

import {createRule} from '../utils';

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

const NUMBER_OF_CHARACTERS = 16;

export = createRule(
{
    name: 'imports-spacing',
    meta:
    {
        docs:
        {
            category: 'Stylistic Issues',
            description: 'Checks new lines between imports',
            recommended: "warn",
            requiresTypeChecking: false,
            extendsBaseRule: false,
            suggestion: false
        },
        messages:
        {
            "emptyLineRequired": "Empty line before import is required",
            "emptyLineForbidden": "Empty line before import is forbidden"
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
        const sourceCode = context.getSourceCode();

        return {
            Program(node)
            {
                let imports: ImportDeclaration[] = node.body.filter(itm => itm.type == AST_NODE_TYPES.ImportDeclaration) as any;
                let newLine = /\r\n/.test(sourceCode.getText(node)) ? '\r\n' : '\n';

                if(imports.length)
                {
                    let tooMuchFactory = () => new RegExp(`^(.*?)(\\s+)${newLine}import`);

                    let name = imports[0].source.value as string;
                    let firstRelative = false;

                    if(name.startsWith('.'))
                    {
                        return;
                    }

                    for(let x = 1; x < imports.length; x++)
                    {
                        // let first = imports[x - 1];
                        let second = imports[x];
                        // let firstName = first.source.value as string;
                        let secondName = second.source.value as string;
                        let secondText = sourceCode.getText(second, NUMBER_OF_CHARACTERS);

                        //first relative occurence, space expected
                        if(secondName.startsWith('.') && !firstRelative)
                        {
                            //no empty line
                            if(!new RegExp(`^.*?${newLine}${newLine}import`).test(secondText))
                            {
                                context.report(
                                {
                                    messageId: "emptyLineRequired",
                                    node,
                                    loc: second.loc,
                                    fix(fixer)
                                    {
                                        let matches = /^.*?(\s*)import/.exec(secondText)!;
                                        let rangeFrom = second.range[0] - matches[1].length;
                                        let rangeTo = second.range[0];

                                        return fixer.replaceTextRange([rangeFrom, rangeTo], newLine + newLine);
                                    }
                                });
                            }

                            firstRelative = true;
                        }
                        //space not expected
                        else
                        {
                            //too much empty lines
                            if(tooMuchFactory().test(secondText))
                            {
                                context.report(
                                {
                                    messageId: "emptyLineForbidden",
                                    node,
                                    loc: second.loc,
                                    fix(fixer)
                                    {
                                        let matches = tooMuchFactory().exec(secondText)!;
                                        let rangeFrom = second.range[0] - 16 + matches[1].length;
                                        let rangeTo = rangeFrom + matches[2].length;

                                        return fixer.removeRange([rangeFrom, rangeTo]);
                                    }
                                });
                            }
                        }
                    }
                }
            }
        };
    }
});
