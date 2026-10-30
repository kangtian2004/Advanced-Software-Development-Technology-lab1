import type { SvgDocument } from '../domain/SvgDocument.js';
import type { Command } from './Command.js';
import type { Editor } from './Editor.js';

/** Command + Memento: publish the candidate only after the full edit succeeds. */
export abstract class EditCommand implements Command {
  private before: SvgDocument | undefined;
  private after: SvgDocument | undefined;
  private feedback = '';
  execute(editor: Editor): string {
    const before = editor.document.clone();
    const candidate = before.clone();
    const feedback = this.apply(candidate);
    this.before = before; this.after = candidate.clone(); this.feedback = feedback;
    editor.commitEdit(candidate, this);
    return feedback;
  }
  undo(): SvgDocument { if (!this.before) throw new Error('command was not executed'); return this.before.clone(); }
  redo(): SvgDocument { if (!this.after) throw new Error('command was not executed'); return this.after.clone(); }
  get summary(): string { return this.feedback; }
  protected abstract apply(document: SvgDocument): string;
}
