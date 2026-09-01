import { MarkdownView, Notice, Plugin, setIcon } from 'obsidian';
import { AdviceModal } from './advice-modal';
import { type AdviceErrorCode, DeepSeekClient } from './deepseek-client';
import { createTranslator, type TranslationKey } from './i18n';
import { captureActiveNote } from './note-context';
import { AiAdviceSettingTab } from './settings';
import { DEFAULT_SETTINGS, type AiAdviceSettings } from './types';

const ERROR_KEYS: Record<AdviceErrorCode, TranslationKey> = {
  'missing-key': 'missingKey',
  'invalid-key': 'invalidKey',
  'insufficient-balance': 'insufficientBalance',
  'rate-limited': 'rateLimited',
  'invalid-response': 'invalidResponse',
  'request-failed': 'requestFailed',
};

export default class AiAdvicePlugin extends Plugin {
  settings: AiAdviceSettings = { ...DEFAULT_SETTINGS };
  client!: DeepSeekClient;
  private floatingButton: HTMLButtonElement | null = null;
  private buttonHost: HTMLElement | null = null;

  async onload(): Promise<void> {
    await this.loadSettings();
    this.client = new DeepSeekClient(this.app, () => this.settings);
    this.addSettingTab(new AiAdviceSettingTab(this));
    this.addCommand({
      id: 'open-ai-advice',
      name: this.t('commandOpen'),
      callback: () => void this.openAdvice(),
    });

    this.registerEvent(this.app.workspace.on('active-leaf-change', () => this.refreshFloatingButton()));
    this.registerEvent(this.app.workspace.on('file-open', () => this.refreshFloatingButton()));
    this.registerEvent(this.app.workspace.on('layout-change', () => this.refreshFloatingButton()));
    this.app.workspace.onLayoutReady(() => this.refreshFloatingButton());
  }

  onunload(): void {
    this.removeFloatingButton();
  }

  t(key: TranslationKey, variables?: Record<string, string | number>): string {
    return createTranslator(this.settings.language).t(key, variables);
  }

  errorMessage(code: AdviceErrorCode): string {
    return this.t(ERROR_KEYS[code]);
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }

  refreshLanguage(): void {
    this.refreshFloatingButton();
  }

  private async loadSettings(): Promise<void> {
    const saved = await this.loadData() as Partial<AiAdviceSettings> | null;
    this.settings = { ...DEFAULT_SETTINGS, ...saved };
  }

  private refreshFloatingButton(): void {
    this.removeFloatingButton();
    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (!view?.file) return;

    this.buttonHost = view.containerEl;
    this.buttonHost.addClass('ai-advice-view-host');
    this.floatingButton = this.buttonHost.createEl('button', {
      cls: 'ai-advice-fab',
      attr: {
        type: 'button',
        'aria-label': this.t('button'),
        title: this.t('button'),
      },
    });
    const icon = this.floatingButton.createSpan({ cls: 'ai-advice-fab-icon' });
    setIcon(icon, 'sparkles');
    this.floatingButton.createSpan({
      text: this.t('button'),
      cls: 'ai-advice-fab-label',
    });
    this.floatingButton.addEventListener('click', () => void this.openAdvice());
  }

  private removeFloatingButton(): void {
    this.floatingButton?.remove();
    this.floatingButton = null;
    this.buttonHost?.removeClass('ai-advice-view-host');
    this.buttonHost = null;
  }

  private async openAdvice(): Promise<void> {
    const snapshot = await captureActiveNote(this.app);
    if (!snapshot) {
      new Notice(this.t('noActiveNote'));
      return;
    }
    const translator = createTranslator(this.settings.language);
    new AdviceModal(
      this.app,
      snapshot,
      this.client,
      translator.locale,
      translator.t,
    ).open();
  }
}
