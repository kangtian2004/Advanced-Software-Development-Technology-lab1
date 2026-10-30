import test from 'node:test';
import assert from 'node:assert/strict';
import { Harness } from './Harness.js';
import { Group } from '../src/domain/Group.js';

/** Independent history oracle: expected states are serialized before/after user actions. */
test('seeded mixed edits retain ownership, uniqueness, atomic failure and reversible history', () => {
  const h = new Harness(); h.ok('init');
  let seed = 20261030, serial = 0, cursor = 0;
  const random = (max: number): number => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed % max; };
  const states = [h.snapshot()];
  for (let step = 0; step < 250; step++) {
    const ids = h.ids(), id = ids.length ? ids[random(ids.length)]! : 'absent';
    const groups = Array.from(h.editor.document.shapes()).filter(shape => shape instanceof Group);
    const group = groups.length ? groups[random(groups.length)]!.id : 'absent';
    const commands = [
      `create rect shape${serial++} 1 2 3 4`, `create g group${serial++}`, `delete ${id}`,
      `move ${id} 2 -1`, `scale ${id} 1.5`, `set ${id} fill red`, `group group${serial++} ${id} ${ids.at(-1) ?? 'absent'}`,
      `addto ${group} ${id}`, `ungroup ${group}`, `front ${id}`, `back ${id}`, 'undo', 'redo',
    ];
    const line = commands[random(commands.length)]!, before = h.snapshot(), result = h.runner.run(line);
    if (result.failed) assert.equal(h.snapshot(), before, `failed edit changed document: ${line}`);
    else if (line === 'undo') { cursor--; assert.equal(h.snapshot(), states[cursor]); }
    else if (line === 'redo') { cursor++; assert.equal(h.snapshot(), states[cursor]); }
    else { states.splice(cursor + 1); states.push(h.snapshot()); cursor++; }
    assert.equal(h.snapshot(), states[cursor]);
    const nodes = Array.from(h.editor.document.shapes());
    assert.equal(new Set(nodes.map(node => node.id)).size, nodes.length);
    for (const shape of nodes) assert.ok(shape.parent?.children.includes(shape));
    const restored = h.codec.decode(h.snapshot()).document;
    assert.equal(h.codec.encode(restored), h.snapshot());
  }
  while (cursor > 0) { h.ok('undo'); cursor--; assert.equal(h.snapshot(), states[cursor]); }
  while (cursor + 1 < states.length) { h.ok('redo'); cursor++; assert.equal(h.snapshot(), states[cursor]); }
});
