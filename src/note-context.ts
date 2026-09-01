import { App, MarkdownView } from 'obsidian';
import { appendAdviceToNote, formatAdviceInsertion } from './format';
import type { AdviceScope, NoteSnapshot } from './types';

export async function captureActiveNote(app: App): Promise<NoteSnapshot | null> {
  const view = app.workspace.getActiveViewOfType(MarkdownView);
  const file = view?.file;
  if (!view || !file) return null;

  const editorMode = view.getMode();
  const selection = editorMode === 'source' ? view.editor.getSelection() : '';
  return {
    filePath: file.path,
    fileName: file.name,
    noteContent: await app.vault.cachedRead(file),
    selection,
    editorMode,
  };
}

export function contentForScope(snapshot: NoteSnapshot, scope: AdviceScope): string {
  if (scope === 'selection') return snapshot.selection;
  if (scope === 'note') return snapshot.noteContent;
  return '';
}

export function defaultScope(snapshot: NoteSnapshot): AdviceScope {
  return snapshot.selection.trim() ? 'selection' : 'note';
}

export async function insertAdvice(
  app: App,
  snapshot: NoteSnapshot,
  result: string,
  heading: string,
): Promise<'inserted' | 'appended' | 'unavailable'> {
  const activeView = app.workspace.getActiveViewOfType(MarkdownView);
  if (!activeView?.file || activeView.file.path !== snapshot.filePath) return 'unavailable';

  if (activeView.getMode() === 'source') {
    activeView.editor.replaceRange(
      formatAdviceInsertion(result, heading),
      activeView.editor.getCursor(),
    );
    return 'inserted';
  }

  const file = app.vault.getFileByPath(snapshot.filePath);
  if (!file) return 'unavailable';
  await app.vault.process(file, (current) => appendAdviceToNote(current, result, heading));
  return 'appended';
}

