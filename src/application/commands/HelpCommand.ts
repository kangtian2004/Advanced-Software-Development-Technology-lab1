import type { Command } from '../Command.js';
import type { Editor } from '../Editor.js';
import { Arguments } from '../Arguments.js';
export class HelpCommand implements Command {
  constructor(private readonly args: Arguments, private readonly usage: string) {}
  execute(_editor: Editor): string { this.args.count(0); return this.usage; }
}
