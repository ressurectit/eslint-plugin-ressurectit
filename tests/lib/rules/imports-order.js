/**
 * @fileoverview Checks whether are imports in correct order
 * @author kukjevov
 */
"use strict";

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

var rule = require("../../../lib/rules/imports-order"),

    RuleTester = require("eslint").RuleTester;


//------------------------------------------------------------------------------
// Tests
//------------------------------------------------------------------------------

var ruleTester = new RuleTester();
ruleTester.run("imports-order", rule, {

    valid: [

        // give me some code that won't trigger a warning
    ],

    invalid: [
        {
            code: "",
            errors: [{
                message: "Fill me in.",
                type: "Me too"
            }]
        }
    ]
});
