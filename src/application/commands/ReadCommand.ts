import type { Command } from '../Command.js';
import type { Editor } from '../Editor.js';
import { Arguments } from '../Arguments.js';
export class ReadCommand implements Command {
  constructor(private readonly args: Arguments) {}
  execute(editor: Editor): string {
    this.args.count(1); return editor.read(this.args.at(0));
  }
}
