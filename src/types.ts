export type AdviceScope = 'selection' | 'note' | 'input';
export type LanguagePreference = 'auto' | 'zh' | 'en';
export type SupportedLocale = 'zh' | 'en';

export interface AiAdviceSettings {
  secretName: string;
  language: LanguagePreference;
}

export interface NoteSnapshot {
  filePath: string;
  fileName: string;
  noteContent: string;
  selection: string;
  editorMode: 'source' | 'preview';
}

export interface AdviceRequestInput {
  scope: AdviceScope;
  question: string;
  description: string;
  sourceContent: string;
  responseLanguage: SupportedLocale;
}

export const DEFAULT_SETTINGS: AiAdviceSettings = {
  secretName: '',
  language: 'auto',
};

