export function formatAdviceInsertion(result: string, heading: string): string {
  return `\n\n## ${heading}\n\n${result.trim()}\n`;
}

export function appendAdviceToNote(existing: string, result: string, heading: string): string {
  const separator = existing.length === 0 || existing.endsWith('\n\n')
    ? ''
    : existing.endsWith('\n') ? '\n' : '\n\n';
  return `${existing}${separator}## ${heading}\n\n${result.trim()}\n`;
}

