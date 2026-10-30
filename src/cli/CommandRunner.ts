import type { Editor } from '../application/Editor.js';
import type { CommandRegistry } from '../application/CommandRegistry.js';
import { Tokenizer } from './Tokenizer.js';
export class CommandRunner {
  private readonly tokenizer = new Tokenizer();
  constructor(private readonly editor: Editor, private readonly registry: CommandRegistry) {}
  run(line: string): { output: string; failed: boolean } {
    try {
      const [name, ...args] = this.tokenizer.tokenize(line);
      if (name === undefined) return { output: '', failed: false };
      return { output: this.registry.create(name, args).execute(this.editor), failed: false };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { output: 'error: ' + message.replace(/[\r\n]+/gu, ' '), failed: true };
    }
  }
}
