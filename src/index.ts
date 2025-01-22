/**
 * @fileoverview RessurectIT specific ESlint rules and configs
 * @author kukjevov
 */

import meta from './meta';
import rules from './rules';

const plugin =
{
    meta,
    rules,
    configs: {},
};

Object.assign(plugin.configs,
{
    recommended:
    [
        {
            plugins:
            {
                example: plugin
            },
            rules:
            {
                "semi": 
                [
                    "error",
                    "always"
                ],
                "brace-style": 
                [
                    "error",
                    "allman",
                    {
                        "allowSingleLine": true
                    }
                ],
                "indent":
                [
                    "error",
                    4
                ],
                "linebreak-style":
                [
                    "error",
                    "unix"
                ],
                "quotes":
                [
                    "error",
                    "single"
                ],
                "@typescript-eslint/no-empty-function": "off",
                "ressurectit/imports-order": "error",
                "ressurectit/imports-spacing": "warn"
            },
        }
    ],
});

export default plugin;
