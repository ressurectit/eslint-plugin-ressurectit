/**
 * @fileoverview Checks whether are imports in correct order
 * @author kukjevov
 */

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

export = {
    meta: {
        docs: {
            description: "Checks whether are imports in correct order",
            category: "Fill me in",
            recommended: false
        },
        fixable: null,  // or "code" or "whitespace"
        schema: [
            // fill in your schema
        ]
    },

    create: function(context: any) {

        console.log(context);
        console.log('tuuuuuuuuuuuuuuu soooooooooooooooooooom xxxxxxxxxxxxxxxxxxxxxx');
        // variables should be defined here

        //----------------------------------------------------------------------
        // Helpers
        //----------------------------------------------------------------------

        // any helper functions should go here or else delete this section

        //----------------------------------------------------------------------
        // Public
        //----------------------------------------------------------------------

        return {
            Program(_node: any)
            {
                // console.log('program', node);
            },
            ImportDeclaration(node: any)
            {
                console.log('import', node);
            }
            // give me methods

        };
    }
};
