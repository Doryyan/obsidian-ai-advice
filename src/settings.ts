import {
  Notice,
  PluginSettingTab,
  SecretComponent,
  Setting,
  type SettingDefinitionItem,
} from 'obsidian';
import { AdviceError } from './deepseek-client';
import type AiAdvicePlugin from './main';
import type { LanguagePreference } from './types';

export class AiAdviceSettingTab extends PluginSettingTab {
  constructor(private readonly plugin: AiAdvicePlugin) {
    super(plugin.app, plugin);
  }

  getSettingDefinitions(): SettingDefinitionItem[] {
    const t = this.plugin.t.bind(this.plugin);
    return [
      {
        name: t('settingsLanguageName'),
        desc: t('settingsLanguageDesc'),
        render: (setting) => this.configureLanguageSetting(setting),
      },
      {
        name: t('settingsApiKeyName'),
        desc: t('settingsApiKeyDesc'),
        render: (setting) => this.configureApiKeySetting(setting),
      },
      {
        name: t('settingsTestName'),
        desc: t('settingsTestDesc'),
        render: (setting) => this.configureTestSetting(setting),
      },
      {
        name: t('settingsPrivacyName'),
        desc: t('settingsPrivacy'),
        searchable: false,
        render: (setting) => setting.settingEl.addClass('ai-advice-settings-privacy'),
      },
    ];
  }

  display(): void {
    this.renderLegacySettings();
  }

  private renderLegacySettings(): void {
    const { containerEl } = this;
    const t = this.plugin.t.bind(this.plugin);
    containerEl.empty();
    containerEl.createEl('p', { text: t('settingsIntro') });

    this.configureLanguageSetting(new Setting(containerEl));
    this.configureApiKeySetting(new Setting(containerEl));
    this.configureTestSetting(new Setting(containerEl));
    containerEl.createDiv({ text: t('settingsPrivacy'), cls: 'ai-advice-settings-privacy' });
  }

  private configureLanguageSetting(setting: Setting): void {
    const t = this.plugin.t.bind(this.plugin);
    setting
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
        }));
  }

  private configureApiKeySetting(setting: Setting): void {
    const t = this.plugin.t.bind(this.plugin);
    setting
      .setName(t('settingsApiKeyName'))
      .setDesc(t('settingsApiKeyDesc'))
      .addComponent((element) => new SecretComponent(this.app, element)
        .setValue(this.plugin.settings.secretName)
        .onChange(async (value) => {
          this.plugin.settings.secretName = value;
          await this.plugin.saveSettings();
        }));
  }

  private configureTestSetting(setting: Setting): void {
    const t = this.plugin.t.bind(this.plugin);
    setting
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
  }
}
