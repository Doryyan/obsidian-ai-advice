import { describe, expect, it } from 'vitest';
import { resolveLocale, translate } from '../src/i18n-core';

describe('i18n', () => {
  it('follows Chinese Obsidian locales', () => {
    expect(resolveLocale('auto', 'zh-cn')).toBe('zh');
    expect(resolveLocale('auto', 'zh-TW')).toBe('zh');
  });

  it('falls back to English for other locales', () => {
    expect(resolveLocale('auto', 'de')).toBe('en');
  });

  it('honors the manual override', () => {
    expect(resolveLocale('en', 'zh-cn')).toBe('en');
  });

  it('interpolates privacy counts', () => {
    expect(translate('zh', 'privacyNote', { count: 42 })).toContain('42');
    expect(translate('en', 'privacyNote', { count: 42 })).toContain('42');
  });
});

