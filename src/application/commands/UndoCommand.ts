import type { Command } from '../Command.js';
import type { Editor } from '../Editor.js';
import { Arguments } from '../Arguments.js';
export class UndoCommand implements Command {
  constructor(private readonly args: Arguments) {}
  execute(editor: Editor): string {
    this.args.count(0); return editor.undo();
  }
}
