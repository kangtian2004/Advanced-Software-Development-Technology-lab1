import { SvgDocument } from '../domain/SvgDocument.js';
import type { FileStore } from '../ports/FileStore.js';
import type { SvgCodec } from '../ports/SvgCodec.js';
import type { EditCommand } from './EditCommand.js';

export class Editor {
  private current: SvgDocument | undefined;
  private path: string | undefined;
  private past: EditCommand[] = [];
  private future: EditCommand[] = [];
  private ioBarrier = false;
  constructor(private readonly files: FileStore, private readonly codec: SvgCodec) {}
  get document(): SvgDocument {
    if (!this.current) throw new Error("no document. use 'init' or 'read' first");
    return this.current;
  }
  init(width = 800, height = 600): string {
    const next = new SvgDocument(width, height);
    this.current = next; this.path = undefined; this.blockHistory();
    return `canvas ${width}x${height} created`;
  }
  read(path: string): string {
    const { document, warnings } = this.codec.decode(this.files.read(path));
    this.current = document; this.path = path; this.blockHistory();
    return [...warnings, `read ${path} (${Array.from(document.shapes()).length} elements)`].join('\n');
  }
  save(path = this.path): string {
    const document = this.document;
    if (!path) throw new Error('no file path. use save <file.svg>');
    this.files.write(path, this.codec.encode(document));
    this.path = path; this.blockHistory();
    return `saved to ${path} (${Array.from(document.shapes()).length} elements)`;
  }
  canvas(width?: number, height?: number): string {
    const document = this.document;
    if (width !== undefined && height !== undefined) {
      const next = document.clone(); next.resize(width, height);
      this.current = next; this.blockHistory();
    }
    return `canvas ${this.document.width}x${this.document.height}`;
  }
  commitEdit(document: SvgDocument, command: EditCommand): void {
    this.current = document; this.past.push(command); this.future = []; this.ioBarrier = false;
  }
  undo(): string {
    this.assertHistory();
    const command = this.past.at(-1);
    if (!command) throw new Error('nothing to undo');
    this.current = command.undo(); this.past.pop(); this.future.push(command);
    return `undone: ${command.summary}`;
  }
  redo(): string {
    this.assertHistory();
    const command = this.future.at(-1);
    if (!command) throw new Error('nothing to redo');
    this.current = command.redo(); this.future.pop(); this.past.push(command);
    return `redone: ${command.summary}`;
  }
  private assertHistory(): void {
    void this.document;
    if (this.ioBarrier) throw new Error('undo not allowed after io command');
  }
  private blockHistory(): void { this.past = []; this.future = []; this.ioBarrier = true; }
}
