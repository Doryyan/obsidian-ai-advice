import { App, requestUrl } from 'obsidian';
import { buildAdviceMessages } from './prompt';
import { extractResponseContent } from './deepseek-response';
import type { AdviceRequestInput, AiAdviceSettings } from './types';

const DEEPSEEK_BASE_URL = 'https://api.deepseek.com';
const DEEPSEEK_MODEL = 'deepseek-v4-flash';

export type AdviceErrorCode =
  | 'missing-key'
  | 'invalid-key'
  | 'insufficient-balance'
  | 'rate-limited'
  | 'invalid-response'
  | 'request-failed';

export class AdviceError extends Error {
  constructor(public readonly code: AdviceErrorCode) {
    super(code);
    this.name = 'AdviceError';
  }
}

function getStatus(error: unknown): number | null {
  if (typeof error !== 'object' || error === null || !('status' in error)) return null;
  return typeof error.status === 'number' ? error.status : null;
}

function errorForStatus(status: number): AdviceError {
  if (status === 401 || status === 403) return new AdviceError('invalid-key');
  if (status === 402) return new AdviceError('insufficient-balance');
  if (status === 429) return new AdviceError('rate-limited');
  return new AdviceError('request-failed');
}

export class DeepSeekClient {
  constructor(
    private readonly app: App,
    private readonly getSettings: () => AiAdviceSettings,
  ) {}

  private getApiKey(): string {
    const secretName = this.getSettings().secretName;
    const apiKey = secretName ? this.app.secretStorage.getSecret(secretName) : null;
    if (!apiKey) throw new AdviceError('missing-key');
    return apiKey;
  }

  async testConnection(): Promise<void> {
    const apiKey = this.getApiKey();
    try {
      const response = await requestUrl({
        url: `${DEEPSEEK_BASE_URL}/models`,
        method: 'GET',
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      if (response.status < 200 || response.status >= 300) throw errorForStatus(response.status);
    } catch (error) {
      if (error instanceof AdviceError) throw error;
      const status = getStatus(error);
      throw status === null ? new AdviceError('request-failed') : errorForStatus(status);
    }
  }

  async generate(input: AdviceRequestInput): Promise<string> {
    const apiKey = this.getApiKey();
    try {
      const response = await requestUrl({
        url: `${DEEPSEEK_BASE_URL}/chat/completions`,
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: DEEPSEEK_MODEL,
          messages: buildAdviceMessages(input),
          thinking: { type: 'disabled' },
          temperature: 0.3,
          max_tokens: 1800,
          stream: false,
        }),
      });
      if (response.status < 200 || response.status >= 300) throw errorForStatus(response.status);
      const content = extractResponseContent(response.json);
      if (!content) throw new AdviceError('invalid-response');
      return content;
    } catch (error) {
      if (error instanceof AdviceError) throw error;
      const status = getStatus(error);
      throw status === null ? new AdviceError('request-failed') : errorForStatus(status);
    }
  }
}
