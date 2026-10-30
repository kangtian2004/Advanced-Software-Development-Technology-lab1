import test from 'node:test';
import assert from 'node:assert/strict';
import { Harness } from './Harness.js';
import { Group } from '../src/domain/Group.js';

const creations = [
  ['rect', '1 2 30 40 red', { x: '1', y: '2', width: '30', height: '40', fill: 'red' }],
  ['circle', '1 2 3 blue', { cx: '1', cy: '2', r: '3', fill: 'blue' }],
  ['ellipse', '1 2 3 4 green', { cx: '1', cy: '2', rx: '3', ry: '4', fill: 'green' }],
  ['line', '1 2 3 4 black', { x1: '1', y1: '2', x2: '3', y2: '4', stroke: 'black' }],
  ['text', '1 2 "hello 世界"', { x: '1', y: '2' }],
  ['g', '', {}],
] as const;
for (const [type, params, expected] of creations) {
  test(`${type}: creation, nested ownership, clone, edit, undo, redo`, () => {
    const h = new Harness(); h.ok('init'); h.ok('create g owner');
    const before = h.snapshot(); h.ok(`create ${type} item ${params} in owner`);
    const shape = h.editor.document.require('item');
    assert.deepEqual(shape.attributes, expected); assert.equal(shape.parent?.id, 'owner');
    if (type === 'text') assert.equal(shape.text, 'hello 世界');
    const created = h.snapshot(); h.ok('undo'); assert.equal(h.snapshot(), before);
    h.ok('redo'); assert.equal(h.snapshot(), created);
    h.ok('set item fill gold'); assert.equal(h.editor.document.require('item').attributes.fill, 'gold');
    h.ok('delete owner'); assert.deepEqual(h.ids(), []);
    h.ok('undo'); assert.equal(h.editor.document.require('item').parent?.id, 'owner');
  });
}

test('defaults, case-sensitive IDs, floats, signed coordinates and no default styles', () => {
  const h = new Harness(); h.ok('init 400'); assert.match(h.ok('canvas'), /400x600/);
  h.ok('create rect R -1.5 +2e1 0 4'); h.ok('create g r');
  assert.deepEqual(h.editor.document.require('R').attributes, { x: '-1.5', y: '20', width: '0', height: '4' });
  h.error('create g R', 'id already exists: R');
});

test('Composite move/scale visits nested descendants exactly once', () => {
  const h = new Harness(); h.ok('init'); h.ok('create g a'); h.ok('create g b in a');
  h.ok('create rect r 1 2 3 4 in b'); h.ok('create line l 1 2 3 4 in a'); h.ok('create text t 3 4 "T" in b');
  h.ok('move a 10 -2'); h.ok('scale a 2');
  assert.deepEqual(h.editor.document.require('r').attributes, { x: '22', y: '0', width: '6', height: '8' });
  assert.deepEqual(h.editor.document.require('l').attributes, { x1: '22', y1: '0', x2: '26', y2: '4' });
  assert.deepEqual(h.editor.document.require('t').attributes, { x: '26', y: '4' });
  h.ok('undo'); h.ok('undo'); assert.equal(h.editor.document.require('r').attributes.x, '1');
});

test('all geometry attributes can be set and survive undo', () => {
  const h = new Harness(); h.ok('init');
  for (const [type, params, attrs] of creations) {
    h.ok(`create ${type} ${type} ${params}`);
    for (const key of Object.keys(attrs).filter(k => !['fill', 'stroke'].includes(k))) {
      const before = h.snapshot(); h.ok(`set ${type} ${key} 7`);
      assert.equal(h.editor.document.require(type).attributes[key], '7'); h.ok('undo'); assert.equal(h.snapshot(), before);
    }
  }
  h.ok('set text text "a new label"'); assert.equal(h.editor.document.require('text').text, 'a new label');
  h.ok('set g stroke black'); h.ok('set g stroke-width 2.5');
});

test('group uses original order, undo restores all old parents and indices', () => {
  const h = new Harness(); h.ok('init');
  for (const id of ['a', 'b', 'c', 'd']) h.ok(`create g ${id}`);
  const before = h.snapshot(); h.ok('group picked d b');
  assert.deepEqual(h.ids(), ['a', 'picked', 'b', 'd', 'c']);
  h.ok('undo'); assert.equal(h.snapshot(), before); h.ok('redo'); assert.equal(h.editor.document.require('b').parent?.id, 'picked');
});

test('cross-parent grouping chooses lowest common ancestor and preserves traversal order', () => {
  const h = new Harness(); h.ok('init'); h.ok('create g world');
  h.ok('create g a in world'); h.ok('create g b in world');
  h.ok('create g x in a'); h.ok('create g y in b');
  const before = h.snapshot(); h.ok('group combined y x');
  assert.equal(h.editor.document.require('combined').parent?.id, 'world');
  assert.deepEqual((h.editor.document.require('combined') as Group).children.map(c => c.id), ['x', 'y']);
  h.ok('undo'); assert.equal(h.snapshot(), before);
});

test('nested ungroup splices children into the former position and is one undo unit', () => {
  const h = new Harness(); h.ok('init'); h.ok('create g outer'); h.ok('create g before in outer');
  h.ok('create g inner in outer'); h.ok('create g a in inner'); h.ok('create g b in inner'); h.ok('create g after in outer');
  const before = h.snapshot(); h.ok('ungroup inner');
  assert.deepEqual((h.editor.document.require('outer') as Group).children.map(c => c.id), ['before', 'a', 'b', 'after']);
  h.ok('undo'); assert.equal(h.snapshot(), before);
  h.error('ungroup outer', 'cannot ungroup top-level container: outer');
});

test('addto, front, back preserve sibling order through undo/redo', () => {
  const h = new Harness(); h.ok('init'); h.ok('create g p');
  for (const id of ['a', 'b', 'c']) h.ok(`create g ${id} in p`);
  const before = h.snapshot(); h.ok('front a'); assert.deepEqual(h.ids(), ['p', 'b', 'c', 'a']);
  h.ok('back a'); assert.deepEqual(h.ids(), ['p', 'a', 'b', 'c']);
  h.ok('addto b a'); assert.equal(h.editor.document.require('a').parent?.id, 'b');
  h.ok('undo'); h.ok('undo'); h.ok('undo'); assert.equal(h.snapshot(), before);
});

test('history branching: failed edits and display queries preserve redo; successful edit clears it', () => {
  const h = new Harness(); h.ok('init'); h.ok('create g a'); h.ok('create g b'); h.ok('undo');
  h.error('move missing 1 2'); h.ok('tree'); h.ok('show a'); h.ok('help'); h.ok('canvas'); h.ok('redo');
  assert.ok(h.editor.document.find('b')); h.ok('undo'); h.ok('create g c'); h.error('redo', 'nothing to redo');
});

for (const barrier of ['init', 'read test.svg', 'save out.svg', 'canvas 100 200']) {
  test(`${barrier} blocks history and the next edit starts a fresh history`, () => {
    const h = new Harness(); h.files.files.set('test.svg', '<svg/>');
    h.ok('init'); h.ok('create g old'); h.ok(barrier);
    h.error('undo', 'undo not allowed after io command'); h.error('redo', 'undo not allowed after io command');
    h.ok('create g next'); h.ok('undo'); h.error('undo', 'nothing to undo'); h.ok('redo');
  });
}

const failures: [string, string?][] = [
 ['create rect a 0 0 1 1', 'id already exists: a'],
 ['create g x in absent', 'no such container: absent'], ['create g x in r', 'not a container: r'],
 ['create box x 0 0 1 1 "B"', 'unknown shape type: box (is the plugin loaded?)'],
 ['delete absent', 'no such shape: absent'], ['move r NaN 1'], ['move r 1foo 2'], ['move r Infinity 1'],
 ['scale r 0', 'scale factor must be positive'], ['scale a -1', 'scale factor must be positive'],
 ['set r id bad', 'unknown attribute: id'], ['set r width -1'], ['set r stroke-width -1'], ['set r cx 1'],
 ['set a x 2'], ['create circle x 0 0 -1'], ['create ellipse x 0 0 -1 3'], ['create g "bad id"'],
 ['group x a r', 'cannot group a container into its own descendant: a'], ['group x a a', 'duplicate group member'],
 ['group x a absent'], ['addto a a'], ['addto child a'], ['ungroup a', 'cannot ungroup top-level container: a'],
 ['canvas 0 3'], ['canvas 3'], ['init 0 1'], ['init 1 2 3'], ['read missing.svg', 'cannot read file: missing.svg'],
 ['nonsense'], ['set r fill "unterminated'], ['front absent'], ['back absent'], ['create g x extra'], ['delete r extra'],
];
for (const [line, expected] of failures) {
  test(`failure is atomic, including redo history: ${line}`, () => {
    const h = new Harness(); h.ok('init'); h.ok('create g a'); h.ok('create g child in a'); h.ok('create rect r 1 2 3 4 in a');
    h.ok('create g temporary'); h.ok('undo'); const before = h.snapshot();
    const output = h.error(line, expected); assert.match(output, /^error: [^\r\n]*$/u);
    assert.equal(h.snapshot(), before); h.ok('redo'); assert.ok(h.editor.document.find('temporary'));
  });
}

test('overflow halfway through a container edit is atomic', () => {
  const h = new Harness(); h.ok('init'); h.ok('create g g');
  h.ok('create rect good 1 2 3 4 in g'); h.ok('create rect huge 1e308 2 3 4 in g');
  const before = h.snapshot(); h.error('scale g 10'); assert.equal(h.snapshot(), before);
});

test('before init only help and empty/comment lines succeed', () => {
  const h = new Harness(); h.ok('help'); h.ok(''); h.ok('  # comment');
  for (const line of ['tree', 'show a', 'create g a', 'undo', 'redo', 'save', 'canvas']) {
    h.error(line, "no document. use 'init' or 'read' first");
  }
});

test('tree includes geometry, hierarchy; show includes parent and text; subtree is restricted', () => {
  const h = new Harness(); h.ok('init'); h.ok('create g group'); h.ok('create text t 1 2 "hello" in group'); h.ok('create g outside');
  assert.match(h.ok('tree'), /└── text#t.*x=1 y=2 "hello"/);
  assert.doesNotMatch(h.ok('tree group'), /outside/); assert.match(h.ok('show t'), /parent=g#group/);
  assert.match(h.ok('show t'), /text="hello"/); assert.match(h.ok('show group'), /parent=svg/);
});

for (const [type, params] of creations) {
  test(`undo-redo restores ${type} move and scale together with style`, () => {
    const h = new Harness(); h.ok('init'); h.ok(`create ${type} s ${params}`); h.ok('set s stroke-width 3');
    const before = h.snapshot(); h.ok('move s 2.5 -3'); h.ok('scale s .5'); const after = h.snapshot();
    assert.equal(h.editor.document.require('s').attributes['stroke-width'], '3');
    h.ok('undo'); h.ok('undo'); assert.equal(h.snapshot(), before);
    h.ok('redo'); h.ok('redo'); assert.equal(h.snapshot(), after);
  });
}
