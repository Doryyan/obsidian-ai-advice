import { describe, expect, it } from 'vitest';
import { extractResponseContent } from '../src/deepseek-response';

describe('extractResponseContent', () => {
  it('extracts a valid DeepSeek response', () => {
    expect(extractResponseContent({
      choices: [{ message: { content: '  Useful advice  ' } }],
    })).toBe('Useful advice');
  });

  it('rejects malformed responses', () => {
    expect(extractResponseContent({ choices: [] })).toBeNull();
    expect(extractResponseContent({ choices: [null] })).toBeNull();
    expect(extractResponseContent({ choices: [{ message: null }] })).toBeNull();
    expect(extractResponseContent({ choices: [{ message: { content: 42 } }] })).toBeNull();
    expect(extractResponseContent(null)).toBeNull();
  });
});
