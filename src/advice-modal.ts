import { App, Component, MarkdownRenderer, Modal, Notice } from 'obsidian';
import { AdviceError, type AdviceErrorCode, DeepSeekClient } from './deepseek-client';
import { contentForScope, defaultScope, insertAdvice } from './note-context';
import type { TranslationKey } from './i18n';
import type { AdviceScope, NoteSnapshot, SupportedLocale } from './types';

type Translator = (key: TranslationKey, variables?: Record<string, string | number>) => string;

const ERROR_KEYS: Record<AdviceErrorCode, TranslationKey> = {
  'missing-key': 'missingKey',
  'invalid-key': 'invalidKey',
  'insufficient-balance': 'insufficientBalance',
  'rate-limited': 'rateLimited',
  'invalid-response': 'invalidResponse',
  'request-failed': 'requestFailed',
};

export class AdviceModal extends Modal {
  private adviceScope: AdviceScope;
  private readonly renderComponent = new Component();
  private closed = false;
  private submitting = false;
  private questionEl!: HTMLTextAreaElement;
  private descriptionEl!: HTMLTextAreaElement;
  private privacyEl!: HTMLElement;
  private errorEl!: HTMLElement;
  private submitButton!: HTMLButtonElement;
  private resultSection!: HTMLElement;
  private resultContent!: HTMLElement;
  private result = '';

  constructor(
    app: App,
    private readonly snapshot: NoteSnapshot,
    private readonly client: DeepSeekClient,
    private readonly locale: SupportedLocale,
    private readonly t: Translator,
  ) {
    super(app);
    this.adviceScope = defaultScope(snapshot);
  }

  onOpen(): void {
    this.closed = false;
    this.renderComponent.load();
    this.modalEl.addClass('ai-advice-modal');
    this.contentEl.addClass('ai-advice-modal-content');
    this.setTitle(this.t('modalTitle'));
    this.renderForm();
  }

  onClose(): void {
    this.closed = true;
    this.renderComponent.unload();
    this.contentEl.empty();
  }

  private renderForm(): void {
    const sourceSection = this.contentEl.createDiv({ cls: 'ai-advice-section' });
    sourceSection.createEl('div', { text: this.t('sourceLabel'), cls: 'ai-advice-label' });
    const scopeGroup = sourceSection.createDiv({ cls: 'ai-advice-scope-group' });
    const scopes: AdviceScope[] = this.snapshot.selection.trim()
      ? ['selection', 'note', 'input']
      : ['note', 'input'];
    const scopeButtons = new Map<AdviceScope, HTMLButtonElement>();

    for (const scope of scopes) {
      const key: TranslationKey = scope === 'selection'
        ? 'scopeSelection'
        : scope === 'note' ? 'scopeNote' : 'scopeInput';
      const button = scopeGroup.createEl('button', {
        text: this.t(key),
        cls: 'ai-advice-scope-button',
        attr: { type: 'button' },
      });
      scopeButtons.set(scope, button);
      button.addEventListener('click', () => {
        this.adviceScope = scope;
        for (const [option, optionButton] of scopeButtons) {
          const selected = option === this.adviceScope;
          optionButton.toggleClass('is-active', selected);
          optionButton.setAttr('aria-pressed', String(selected));
        }
        this.updatePrivacyText();
      });
    }

    for (const [scope, button] of scopeButtons) {
      const selected = scope === this.adviceScope;
      button.toggleClass('is-active', selected);
      button.setAttr('aria-pressed', String(selected));
    }

    this.questionEl = this.createTextArea(
      this.t('questionLabel'),
      this.t('questionPlaceholder'),
      false,
    );
    this.descriptionEl = this.createTextArea(
      this.t('descriptionLabel'),
      this.t('descriptionPlaceholder'),
      true,
    );

    this.privacyEl = this.contentEl.createDiv({ cls: 'ai-advice-privacy' });
    this.updatePrivacyText();

    this.errorEl = this.contentEl.createDiv({
      cls: 'ai-advice-error is-hidden',
      attr: { role: 'alert', 'aria-live': 'polite' },
    });

    const submitRow = this.contentEl.createDiv({ cls: 'ai-advice-submit-row' });
    this.submitButton = submitRow.createEl('button', {
      text: this.t('send'),
      cls: 'ai-advice-primary-button',
      attr: { type: 'button' },
    });
    this.submitButton.addEventListener('click', () => void this.submit());

    this.resultSection = this.contentEl.createDiv({ cls: 'ai-advice-result-section is-hidden' });
    this.resultSection.createEl('div', { text: this.t('resultTitle'), cls: 'ai-advice-result-title' });
    this.resultContent = this.resultSection.createDiv({ cls: 'ai-advice-result-content markdown-rendered' });

    this.questionEl.focus();
  }

  private createTextArea(label: string, placeholder: string, optional: boolean): HTMLTextAreaElement {
    const field = this.contentEl.createDiv({ cls: 'ai-advice-field' });
    const labelEl = field.createEl('label', { text: label, cls: 'ai-advice-label' });
    const textarea = field.createEl('textarea', {
      cls: optional ? 'ai-advice-textarea is-compact' : 'ai-advice-textarea',
      attr: { placeholder, rows: optional ? '2' : '3' },
    });
    const id = `ai-advice-${optional ? 'description' : 'question'}`;
    textarea.id = id;
    labelEl.htmlFor = id;
    return textarea;
  }

  private updatePrivacyText(): void {
    if (!this.privacyEl) return;
    const contentLength = contentForScope(this.snapshot, this.adviceScope).length;
    const key: TranslationKey = this.adviceScope === 'selection'
      ? 'privacySelection'
      : this.adviceScope === 'note' ? 'privacyNote' : 'privacyInput';
    this.privacyEl.setText(this.t(key, { count: contentLength }));
  }

  private async submit(): Promise<void> {
    if (this.submitting) return;
    const question = this.questionEl.value.trim();
    if (!question) {
      this.setError(this.t('emptyQuestion'));
      this.questionEl.focus();
      return;
    }

    this.setError('');
    this.setSubmitting(true);
    this.resultSection.addClass('is-hidden');

    try {
      this.result = await this.client.generate({
        scope: this.adviceScope,
        question,
        description: this.descriptionEl.value,
        sourceContent: contentForScope(this.snapshot, this.adviceScope),
        responseLanguage: this.locale,
      });
      if (this.closed) return;
      await this.renderResult();
    } catch (error) {
      if (this.closed) return;
      const key = error instanceof AdviceError ? ERROR_KEYS[error.code] : 'requestFailed';
      this.setError(this.t(key));
    } finally {
      if (!this.closed) this.setSubmitting(false);
    }
  }

  private async renderResult(): Promise<void> {
    this.resultContent.empty();
    await MarkdownRenderer.render(
      this.app,
      this.result,
      this.resultContent,
      this.snapshot.filePath,
      this.renderComponent,
    );
    this.resultSection.removeClass('is-hidden');

    const oldActions = this.resultSection.querySelector('.ai-advice-result-actions');
    oldActions?.remove();
    const actions = this.resultSection.createDiv({ cls: 'ai-advice-result-actions' });
    const copyButton = actions.createEl('button', {
      text: this.t('copy'),
      cls: 'ai-advice-secondary-button',
      attr: { type: 'button' },
    });
    copyButton.addEventListener('click', () => void this.copyResult(copyButton));

    const insertLabel = this.snapshot.editorMode === 'source'
      ? this.t('insertAtCursor')
      : this.t('appendToNote');
    const insertButton = actions.createEl('button', {
      text: insertLabel,
      cls: 'ai-advice-primary-button',
      attr: { type: 'button' },
    });
    insertButton.addEventListener('click', () => void this.insertResult(insertButton));
  }

  private async copyResult(button: HTMLButtonElement): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.result);
      button.setText(this.t('copied'));
    } catch {
      new Notice(this.t('copyFailed'));
    }
  }

  private async insertResult(button: HTMLButtonElement): Promise<void> {
    const outcome = await insertAdvice(
      this.app,
      this.snapshot,
      this.result,
      this.t('adviceHeading'),
    );
    if (outcome === 'unavailable') {
      new Notice(this.t('insertUnavailable'));
      return;
    }
    button.setText(this.t(outcome));
    button.disabled = true;
  }

  private setSubmitting(submitting: boolean): void {
    this.submitting = submitting;
    this.submitButton.disabled = submitting;
    this.submitButton.setText(this.t(submitting ? 'sending' : 'send'));
  }

  private setError(message: string): void {
    this.errorEl.setText(message);
    this.errorEl.toggleClass('is-hidden', message.length === 0);
  }
}
