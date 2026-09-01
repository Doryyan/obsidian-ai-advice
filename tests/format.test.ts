import { describe, expect, it } from 'vitest';
import { appendAdviceToNote, formatAdviceInsertion } from '../src/format';

describe('note formatting', () => {
  it('formats an insertion as Markdown', () => {
    expect(formatAdviceInsertion('  Improve the opening.  ', 'AI suggestion'))
      .toBe('\n\n## AI suggestion\n\nImprove the opening.\n');
  });

  it('appends without collapsing the existing note', () => {
    expect(appendAdviceToNote('# Note\nBody', 'Result', 'AI suggestion'))
      .toBe('# Note\nBody\n\n## AI suggestion\n\nResult\n');
  });

  it('does not add duplicate blank lines', () => {
    expect(appendAdviceToNote('# Note\n\n', 'Result', 'AI 建议'))
      .toBe('# Note\n\n## AI 建议\n\nResult\n');
  });
});

