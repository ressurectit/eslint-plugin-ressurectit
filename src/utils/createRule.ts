import {ESLintUtils} from '@typescript-eslint/experimental-utils';

export const createRule = ESLintUtils.RuleCreator(name => `https://github.com/ressurectit/eslint-plugin-ressurectit/blob/master/docs/rules/${name}.md`);