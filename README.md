# AI Advice

AI Advice is a bilingual Obsidian plugin that sends the text you explicitly choose to DeepSeek, previews the response, and lets you copy it or insert it into the original note.

AI Advice 是一个中英文 Obsidian 插件。它可以把你明确选择的文本发送给 DeepSeek，预览返回结果，然后复制或插回原笔记。

## Features / 功能

- A translucent purple “AI advice / AI 建议” button in the active Markdown note.
- A mobile-friendly bottom sheet on desktop, iOS, and Android.
- Analyze selected text, the current note, or only your own input.
- Copy the response, insert it at the editor cursor, or append it in reading mode.
- Follow the Obsidian interface language automatically, with Chinese and English overrides.
- Store the API key through Obsidian SecretStorage rather than plugin `data.json`.

## Privacy / 隐私

- The plugin has no telemetry and stores no chat history.
- It does not use a proxy or developer-owned server.
- Only content selected in the request sheet is sent directly to `https://api.deepseek.com` after the user presses the submit button.
- A DeepSeek Open Platform account, API key, network connection, and sufficient API balance are required. The plugin is free; any API usage charges are billed by DeepSeek, not by the plugin developer.
- DeepSeek processes requests under its [Open Platform Terms](https://cdn.deepseek.com/policies/en-US/deepseek-open-platform-terms-of-service.html) and [Privacy Policy](https://cdn.deepseek.com/policies/en-US/deepseek-privacy-policy.html).
- Secrets are local to Obsidian SecretStorage. Configure or select the key on each device as needed.
- Review the selected content before sending it, and avoid submitting confidential or highly sensitive note content unless doing so is appropriate for your use case.

插件不收集遥测、不保存聊天记录，也不经过开发者服务器。只有点击“获取建议”后，本次选择的内容才会直接发送到 `https://api.deepseek.com`。使用本插件需要 DeepSeek 开放平台账号、API Key、网络连接和可用余额；插件本身免费，API 费用由 DeepSeek 收取。DeepSeek 会依据其[开放平台服务协议](https://cdn.deepseek.com/policies/zh-CN/deepseek-open-platform-terms-of-service.html)和[隐私政策](https://cdn.deepseek.com/policies/zh-CN/deepseek-privacy-policy.html)处理请求。发送前请检查所选内容，避免在不适当的情况下提交机密或高度敏感的笔记。

## Installation / 安装

Open the [AI Advice community listing](https://community.obsidian.md/plugins/ai-advice) and select **Add to Obsidian**, or search for **AI Advice** under **Settings → Community plugins → Browse**.

打开 [AI Advice 社区页面](https://community.obsidian.md/plugins/ai-advice)，点击 **Add to Obsidian**；也可以在 **设置 → 第三方插件 → 浏览** 中搜索 **AI Advice**。

### Manual installation / 手动安装

1. Build the plugin with `npm install && npm run build`.
2. Create `<your-vault>/.obsidian/plugins/ai-advice/`.
3. Copy `main.js`, `manifest.json`, and `styles.css` into that folder.
4. Reload Obsidian, open **Settings → Community plugins**, and enable **AI Advice**.
5. Open **Settings → AI Advice**, create or select a DeepSeek API key, then run the connection test.

手机端需要启用社区插件，并在该设备的 Obsidian SecretStorage 中选择或创建 API Key。

## Development

```bash
npm install
npm run lint
npm test
npm run build
```

Requires Obsidian 1.11.4 or later because the plugin uses the official SecretStorage API. The runtime bundle does not use Node.js or Electron APIs.
