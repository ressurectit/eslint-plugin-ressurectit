/**
 * @fileoverview Tests for switch-case-braces rule
 */

import {ruleTester, dedent} from '../helpers/ruleTester.js';
import rule from '../../lib/rules/switch-case-braces.js';

ruleTester.run('switch-case-braces', rule,
{
    valid:
    [
        {
            name: 'case blocks on next line with break inside (account.service)',
            code: dedent(`
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
            `),
        },
        {
            name: 'fall-through cases sharing one block (vahaHodnotaCss)',
            code: dedent(`
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
                }
            `),
        },
        {
            name: 'default with empty block',
            code: dedent(`
                switch(value)
                {
                    default:
                    {
                    }
                }
            `),
        },
        {
            name: 'empty fall-through case without body',
            code: dedent(`
                switch(value)
                {
                    case 1:
                    case 2:
                    {
                        break;
                    }
                }
            `),
        },
    ],
    invalid:
    [
        {
            name: 'case body without block',
            code: dedent(`
                switch(value)
                {
                    case 1:
                        foo();
                        break;
                }
            `),
            output: null,
            errors: [{messageId: 'caseBlockRequired', data: {label: 'case 1'}}],
        },
        {
            name: 'default body without block',
            code: dedent(`
                switch(value)
                {
                    default:
                        foo();
                }
            `),
            output: null,
            errors: [{messageId: 'caseBlockRequired', data: {label: 'default'}}],
        },
        {
            name: 'multiple statements next to block',
            code: dedent(`
                switch(value)
                {
                    case 1:
                    {
                        break;
                    }
                    foo();
                }
            `),
            output: null,
            errors: [{messageId: 'caseBlockRequired'}],
        },
        {
            name: 'block on same line as case',
            code: dedent(`
                switch(value)
                {
                    case 1: {
                        break;
                    }
                }
            `),
            output: dedent(`
                switch(value)
                {
                    case 1:
                    {
                        break;
                    }
                }
            `),
            errors: [{messageId: 'caseBlockOnNextLine', data: {label: 'case 1'}}],
        },
        {
            name: 'block on same line as case with comment, no fix',
            code: dedent(`
                switch(value)
                {
                    case 1: /* note */ {
                        break;
                    }
                }
            `),
            output: null,
            errors: [{messageId: 'caseBlockOnNextLine'}],
        },
        {
            name: 'blank line between closing brace and next case',
            code: dedent(`
                switch(value)
                {
                    case 1:
                    {
                        break;
                    }

                    case 2:
                    {
                        break;
                    }
                }
            `),
            output: dedent(`
                switch(value)
                {
                    case 1:
                    {
                        break;
                    }
                    case 2:
                    {
                        break;
                    }
                }
            `),
            errors: [{messageId: 'noBlankLineBetweenCases'}],
        },
        {
            name: 'blank line between closing brace and next case with comment, no fix',
            code: dedent(`
                switch(value)
                {
                    case 1:
                    {
                        break;
                    }

                    // next
                    case 2:
                    {
                        break;
                    }
                }
            `),
            output: null,
            errors: [{messageId: 'noBlankLineBetweenCases'}],
        },
    ],
});
