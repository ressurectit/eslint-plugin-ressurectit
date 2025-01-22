import {ESLintUtils} from '@typescript-eslint/utils';
import type {RuleRecommendation, RuleRecommendationAcrossConfigs} from '@typescript-eslint/utils/dist/ts-eslint';

export interface ESLintPluginDocs 
{
    /**
     * Does the rule extend (or is it based off of) an ESLint code rule?
     * Alternately accepts the name of the base rule, in case the rule has been renamed.
     * This is only used for documentation purposes.
     */
    extendsBaseRule?: boolean | string;

    /**
     * If a string config name, which starting config this rule is enabled in.
     * If an object, which settings it has enabled in each of those configs.
     */
    recommended?: RuleRecommendation | RuleRecommendationAcrossConfigs<unknown[]>;

    /**
     * Does the rule require us to create a full TypeScript Program in order for it
     * to type-check code. This is only used for documentation purposes.
     */
    requiresTypeChecking?: boolean;
}

export const createRule = ESLintUtils.RuleCreator<ESLintPluginDocs>(name => `https://github.com/ressurectit/eslint-plugin-ressurectit/blob/master/docs/rules/${name}.md`);