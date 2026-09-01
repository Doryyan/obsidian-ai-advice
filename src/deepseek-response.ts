export function extractResponseContent(data: unknown): string | null {
  if (typeof data !== 'object' || data === null || !('choices' in data)) return null;
  if (!Array.isArray(data.choices) || data.choices.length === 0) return null;
  const first = data.choices[0];
  if (typeof first !== 'object' || first === null || !('message' in first)) return null;
  const message = first.message;
  if (typeof message !== 'object' || message === null || !('content' in message)) return null;
  return typeof message.content === 'string' && message.content.trim()
    ? message.content.trim()
    : null;
}

