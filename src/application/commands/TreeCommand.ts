import type { Command } from '../Command.js';
import type { Editor } from '../Editor.js';
import { Arguments } from '../Arguments.js';
import { TreeFormatter } from '../TreeFormatter.js';
export class TreeCommand implements Command {
  constructor(private readonly args: Arguments) {}
  execute(editor: Editor): string {
    this.args.count(0, 1); return new TreeFormatter().format(editor.document, this.args.optional(0));
  }
}
