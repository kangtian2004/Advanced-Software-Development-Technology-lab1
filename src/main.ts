import { createInterface } from 'node:readline';
import { readFileSync } from 'node:fs';
import { Editor } from './application/Editor.js';
import { CommandRegistry } from './application/CommandRegistry.js';
import { ShapeFactory } from './domain/ShapeFactory.js';
import { XmlSvgCodec } from './infrastructure/XmlSvgCodec.js';
import { DiskFileStore } from './infrastructure/DiskFileStore.js';
import { CommandRunner } from './cli/CommandRunner.js';

const factory = new ShapeFactory();
const runner = new CommandRunner(new Editor(new DiskFileStore(), new XmlSvgCodec(factory)), new CommandRegistry(factory));
const args = process.argv.slice(2);
const print = (result: { output: string; failed: boolean }): void => {
  if (result.output) (result.failed ? process.stderr : process.stdout).write(result.output + '\n');
};
if (args.length) {
  if (args.length !== 2 || args[0] !== '--script') {
    console.error('error: usage: npm run cli -- [--script file.commands]'); process.exitCode = 1;
  } else {
    try {
      const lines = readFileSync(args[1]!, 'utf8').split(/\r?\n/u);
      for (const line of lines) { const result = runner.run(line); print(result); if (result.failed) process.exitCode = 1; }
    } catch { console.error(`error: cannot read file: ${args[1]}`); process.exitCode = 1; }
  }
} else {
  const interactive = Boolean(process.stdin.isTTY);
  if (interactive) console.log("svg-editor 0.1 — type 'help' for commands");
  const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: interactive });
  if (interactive) { rl.setPrompt('svg> '); rl.prompt(); }
  rl.on('line', line => {
    const result = runner.run(line); print(result);
    if (result.failed && !interactive) process.exitCode = 1;
    if (interactive) rl.prompt();
  });
}
