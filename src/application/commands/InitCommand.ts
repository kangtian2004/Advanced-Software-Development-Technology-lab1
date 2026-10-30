import type { Command } from '../Command.js';
import type { Editor } from '../Editor.js';
import { Arguments } from '../Arguments.js';
export class InitCommand implements Command {
  constructor(private readonly args: Arguments) {}
  execute(editor: Editor): string {
    this.args.count(0, 2);
    return editor.init(this.args.optional(0) === undefined ? 800 : this.args.number(0, 'width'), this.args.optional(1) === undefined ? 600 : this.args.number(1, 'height'));
  }
}
