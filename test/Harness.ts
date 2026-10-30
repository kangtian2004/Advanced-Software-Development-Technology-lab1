import assert from 'node:assert/strict';
import { Editor } from '../src/application/Editor.js';
import { CommandRegistry } from '../src/application/CommandRegistry.js';
import { ShapeFactory } from '../src/domain/ShapeFactory.js';
import { XmlSvgCodec } from '../src/infrastructure/XmlSvgCodec.js';
import { CommandRunner } from '../src/cli/CommandRunner.js';
import type { FileStore } from '../src/ports/FileStore.js';
export class MemoryFileStore implements FileStore {
  readonly files = new Map<string, string>();
  failWrite = false;
  read(path: string): string {
    const content = this.files.get(path);
    if (content === undefined) throw new Error(`cannot read file: ${path}`);
    return content;
  }
  write(path: string, content: string): void {
    if (this.failWrite) throw new Error(`cannot write file: ${path}`);
    this.files.set(path, content);
  }
}
export class Harness {
  readonly factory = new ShapeFactory();
  readonly files = new MemoryFileStore();
  readonly codec = new XmlSvgCodec(this.factory);
  readonly editor = new Editor(this.files, this.codec);
  readonly runner = new CommandRunner(this.editor, new CommandRegistry(this.factory));
  ok(line: string): string {
    const result = this.runner.run(line); assert.equal(result.failed, false, result.output); return result.output;
  }
  error(line: string, expected?: string): string {
    const result = this.runner.run(line); assert.equal(result.failed, true, `${line} should fail`);
    if (expected) assert.equal(result.output, 'error: ' + expected);
    return result.output;
  }
  snapshot(): string { return this.codec.encode(this.editor.document); }
  ids(): string[] { return Array.from(this.editor.document.shapes(), shape => shape.id); }
}
