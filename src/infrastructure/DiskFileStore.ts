import { readFileSync, writeFileSync, renameSync, rmSync } from 'node:fs';
import { dirname, basename, join } from 'node:path';
import { randomUUID } from 'node:crypto';
import type { FileStore } from '../ports/FileStore.js';
export class DiskFileStore implements FileStore {
  read(path: string): string {
    try { return readFileSync(path, 'utf8'); }
    catch { throw new Error(`cannot read file: ${path}`); }
  }
  write(path: string, content: string): void {
    const temporary = join(dirname(path), `.${basename(path)}.${randomUUID()}.tmp`);
    try {
      writeFileSync(temporary, content, { encoding: 'utf8', flag: 'wx' });
      renameSync(temporary, path);
    } catch {
      throw new Error(`cannot write file: ${path}`);
    } finally { rmSync(temporary, { force: true }); }
  }
}
