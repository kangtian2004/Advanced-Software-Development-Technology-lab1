import type { Command } from '../Command.js';
import type { Editor } from '../Editor.js';
import { Arguments } from '../Arguments.js';
export class CanvasCommand implements Command {
  constructor(private readonly args: Arguments) {}
  execute(editor: Editor): string {
    this.args.count(0, 2);
    if (this.args.optional(0) === undefined) return editor.canvas();
    this.args.count(2); return editor.canvas(this.args.number(0, 'width'), this.args.number(1, 'height'));
  }
}
