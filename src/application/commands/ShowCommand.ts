import type { Command } from '../Command.js';
import type { Editor } from '../Editor.js';
import { Arguments } from '../Arguments.js';
export class ShowCommand implements Command {
  constructor(private readonly args: Arguments) {}
  execute(editor: Editor): string {
    this.args.count(1); const shape = editor.document.require(this.args.at(0));
    const parent = shape.parent === editor.document.root ? 'svg' : `g#${shape.parent!.id}`;
    const details = Object.entries(shape.attributes).map(([key, value]) => `  ${key}=${value}`);
    if (shape.text !== undefined) details.push(`  text=${JSON.stringify(shape.text)}`);
    return [`${shape.kind}#${shape.id}  parent=${parent}`, ...details].join('\n');
  }
}
