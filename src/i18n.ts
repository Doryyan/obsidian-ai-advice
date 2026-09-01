import { getLanguage } from 'obsidian';
import { resolveLocale, translate, type TranslationKey, type TranslationVariables } from './i18n-core';
import type { LanguagePreference, SupportedLocale } from './types';

export function getLocale(preference: LanguagePreference): SupportedLocale {
  return resolveLocale(preference, getLanguage());
}

export function createTranslator(preference: LanguagePreference) {
  const locale = getLocale(preference);
  return {
    locale,
    t: (key: TranslationKey, variables?: TranslationVariables) =>
      translate(locale, key, variables),
  };
}

export type { TranslationKey } from './i18n-core';

