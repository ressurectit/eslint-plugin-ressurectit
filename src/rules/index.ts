import stylistic from '@stylistic/eslint-plugin';

import angularMetadata from './angular-metadata.js';
import argumentLayout from './argument-layout.js';
import decoratorLayout from './decorator-layout.js';
import importsOrder from './imports-order.js';
import importsSpacing from './imports-spacing.js';
import indent from './indent/index.js';
import linesBetweenClassMembers from './linesBetweenClassMembers.js';
import lineWrapping from './line-wrapping.js';
import literalBraceStyle from './literal-brace-style.js';
import regionTitles from './region-titles.js';
import switchCaseBraces from './switch-case-braces.js';
import typeOperatorSpacing from './type-operator-spacing.js';

export default
{
    'imports-order': importsOrder,
    'imports-spacing': importsSpacing,
    'indent': indent,
    'literal-brace-style': literalBraceStyle,
    'switch-case-braces': switchCaseBraces,
    'type-operator-spacing': typeOperatorSpacing,
    'region-titles': regionTitles,
    'decorator-layout': decoratorLayout,
    'argument-layout': argumentLayout,
    'line-wrapping': lineWrapping,
    'angular-metadata': angularMetadata,
    'padding-line-between-statements': stylistic.rules['padding-line-between-statements'],
    'lines-between-class-members': linesBetweenClassMembers,
};
