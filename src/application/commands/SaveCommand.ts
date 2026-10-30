import type { Command } from '../Command.js';
import type { Editor } from '../Editor.js';
import { Arguments } from '../Arguments.js';
export class SaveCommand implements Command {
  constructor(private readonly args: Arguments) {}
  execute(editor: Editor): string {
    this.args.count(0, 1); return editor.save(this.args.optional(0));
  }
}
