import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { Tokenizer } from '../src/cli/Tokenizer.js';
import { DiskFileStore } from '../src/infrastructure/DiskFileStore.js';

const nodeArgs = ['--import', 'tsx', 'src/main.ts'];

test('tokenizer retains hex, Unicode, empty text, quoted escapes and Windows paths', () => {
  const tokenizer = new Tokenizer();
  assert.deepEqual(tokenizer.tokenize('  # comment'), []);
  assert.deepEqual(tokenizer.tokenize('create rect r 0 0 2 3 #ff00ff'), ['create', 'rect', 'r', '0', '0', '2', '3', '#ff00ff']);
  assert.deepEqual(tokenizer.tokenize('create text t 1 2 ""'), ['create', 'text', 't', '1', '2', '']);
  assert.deepEqual(tokenizer.tokenize(String.raw`set t text "say \"Hi\" 世界"`), ['set', 't', 'text', 'say "Hi" 世界']);
  assert.deepEqual(tokenizer.tokenize(String.raw`read "C:\Users\me\image.svg"`), ['read', String.raw`C:\Users\me\image.svg`]);
  assert.throws(() => tokenizer.tokenize('create text "oops'), /unterminated/);
});

test('piped CLI accepts comments, CRLF and final line without newline', () => {
  const result = spawnSync(process.execPath, nodeArgs, {
    input: '# example\r\ninit\r\ncreate text t 1 2 "CLI 世界"\r\nshow t', encoding: 'utf8',
  });
  assert.equal(result.status, 0, result.stderr); assert.equal(result.stderr, '');
  assert.match(result.stdout, /canvas 800x600 created/); assert.match(result.stdout, /text="CLI 世界"/);
  assert.doesNotMatch(result.stdout, /svg> /);
});

test('CLI reports one-line errors to stderr, continues processing, exits nonzero', () => {
  const result = spawnSync(process.execPath, nodeArgs, {
    input: 'init\ncreate g a\ncreate g a\ncreate g b\ntree\n', encoding: 'utf8',
  });
  assert.equal(result.status, 1); assert.equal(result.stderr, 'error: id already exists: a\n');
  assert.match(result.stdout, /g#b created/);
});

test('script option, save/read on real disk, escaping, repeated atomic writes and cleanup', () => {
  const dir = mkdtempSync(join(tmpdir(), 'svg-lab-'));
  try {
    const svg = join(dir, 'a diagram.svg'), script = join(dir, 'session.commands');
    writeFileSync(script, `init 400 300\ncreate text t 10 20 "<Hello & 世界>"\nsave "${svg}"\nread "${svg}"\nset t text "Updated"\nsave\n`);
    const result = spawnSync(process.execPath, [...nodeArgs, '--script', script], { encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr); assert.match(readFileSync(svg, 'utf8'), />Updated<\/text>/);
    assert.deepEqual(readdirSync(dir).sort(), ['a diagram.svg', 'session.commands']);
    const disk = new DiskFileStore();
    assert.throws(() => disk.read(join(dir, 'missing.svg')), /cannot read file/);
    assert.throws(() => disk.write(join(dir, 'missing', 'out.svg'), 'oops'), /cannot write file/);
    assert.equal(readdirSync(dir).length, 2);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('missing scripts and invalid CLI options exit nonzero with normalized errors', () => {
  for (const args of [['--bad'], ['--script', 'no-such-script.commands']]) {
    const result = spawnSync(process.execPath, [...nodeArgs, ...args], { encoding: 'utf8' });
    assert.equal(result.status, 1); assert.match(result.stderr, /^error: [^\n]+\n$/);
  }
});
