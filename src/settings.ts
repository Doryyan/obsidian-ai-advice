import { Notice, PluginSettingTab, SecretComponent, Setting } from 'obsidian';
import { AdviceError } from './deepseek-client';
import type AiAdvicePlugin from './main';
import type { LanguagePreference } from './types';

export class AiAdviceSettingTab extends PluginSettingTab {
  constructor(private readonly plugin: AiAdvicePlugin) {
    super(plugin.app, plugin);
  }

  display(): void {
    const { containerEl } = this;
    const t = this.plugin.t.bind(this.plugin);
    containerEl.empty();
    containerEl.createEl('p', { text: t('settingsIntro') });

    new Setting(containerEl)
      .setName(t('settingsLanguageName'))
      .setDesc(t('settingsLanguageDesc'))
      .addDropdown((dropdown) => dropdown
        .addOption('auto', t('languageAuto'))
        .addOption('zh', t('languageChinese'))
        .addOption('en', t('languageEnglish'))
        .setValue(this.plugin.settings.language)
        .onChange(async (value) => {
          this.plugin.settings.language = value as LanguagePreference;
          await this.plugin.saveSettings();
          this.plugin.refreshLanguage();
          this.display();
        }));

    new Setting(containerEl)
      .setName(t('settingsApiKeyName'))
      .setDesc(t('settingsApiKeyDesc'))
      .addComponent((element) => new SecretComponent(this.app, element)
        .setValue(this.plugin.settings.secretName)
        .onChange(async (value) => {
          this.plugin.settings.secretName = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName(t('settingsTestName'))
      .setDesc(t('settingsTestDesc'))
      .addButton((button) => button
        .setButtonText(t('testConnection'))
        .onClick(async () => {
          button.setDisabled(true).setButtonText(t('testingConnection'));
          try {
            await this.plugin.client.testConnection();
            new Notice(t('connectionSuccess'));
          } catch (error) {
            const message = error instanceof AdviceError
              ? this.plugin.errorMessage(error.code)
              : t('connectionFailed');
            new Notice(message);
          } finally {
            button.setDisabled(false).setButtonText(t('testConnection'));
          }
        }));

    containerEl.createDiv({ text: t('settingsPrivacy'), cls: 'ai-advice-settings-privacy' });
  }
}

