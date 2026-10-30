import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Harness } from './Harness.js';

test('assignment external SVG: missing id warning and seven elements', () => {
  const h = new Harness(); h.files.files.set('other.svg', readFileSync('examples/other.svg', 'utf8'));
  const feedback = h.ok('read other.svg');
  assert.match(feedback, /warning: assigned id rect1 to unnamed <rect>/); assert.match(feedback, /7 elements/);
  assert.deepEqual(h.ids(), ['rect1', 't1', 'c1', 'g1', 'r2', 'c2', 'e1']);
});

test('auto IDs reserve all explicit IDs before allocating even across nested or later siblings', () => {
  const h = new Harness();
  h.files.files.set('in.svg', '<svg><rect/><g><rect id="rect1"/><rect/></g><rect id="rect3"/></svg>');
  const output = h.ok('read in.svg');
  assert.deepEqual(h.ids(), ['rect2', 'g1', 'rect1', 'rect4', 'rect3']);
  assert.match(output, /assigned id rect4/);
});

test('save/read round trip preserves six shapes, child order, text, styles and viewBox', () => {
  const h = new Harness(); h.ok('init 400 300'); h.ok('create g g'); h.ok('set g fill red');
  h.ok('create rect r 1 2 3 4 in g'); h.ok('create circle c 5 6 7 in g'); h.ok('create ellipse e 1 2 3 4 in g');
  h.ok('create line l 1 2 3 4 black in g'); h.ok('create text t 1 2 "<Hello & 世界>" in g');
  h.ok('set t stroke-width .25'); const before = h.snapshot(); h.ok('save "round trip.svg"');
  assert.match(h.files.files.get('round trip.svg')!, /&lt;Hello &amp; 世界&gt;/);
  h.ok('init'); h.ok('read "round trip.svg"'); assert.equal(h.snapshot(), before);
  h.ok('save'); assert.equal(h.files.files.get('round trip.svg'), before);
});

test('read path defaults for save; save-as updates the path', () => {
  const h = new Harness(); h.ok('init'); h.error('save', 'no file path. use save <file.svg>');
  h.ok('save first.svg'); h.ok('create g a'); h.ok('save'); assert.match(h.files.files.get('first.svg')!, /id="a"/);
  h.ok('save second.svg'); h.ok('create g b'); h.ok('save'); assert.match(h.files.files.get('second.svg')!, /id="b"/);
  assert.doesNotMatch(h.files.files.get('first.svg')!, /id="b"/);
  h.ok('init'); h.error('save', 'no file path. use save <file.svg>');
});

test('failed I/O preserves document, current path and undo/redo', () => {
  const h = new Harness(); h.ok('init'); h.ok('save before.svg'); h.ok('create g a');
  const before = h.snapshot(); h.files.failWrite = true; h.error('save failed.svg');
  assert.equal(h.snapshot(), before); h.ok('undo'); assert.deepEqual(h.ids(), []);
  h.files.failWrite = false; h.ok('redo'); h.ok('save'); assert.match(h.files.files.get('before.svg')!, /id="a"/);
});

test('preserves imported viewBox, transforms, root fill, and text presentation', () => {
  const h = new Harness();
  h.files.files.set('x.svg', '<svg viewBox="10 20 400 300" fill="blue"><g id="g" transform="translate(60,40)"><text id="t" x="1" y="2" text-anchor="middle" font-size="16">A</text></g></svg>');
  h.ok('read x.svg'); assert.equal(h.editor.document.width, 400); assert.equal(h.editor.document.height, 300);
  const before = h.snapshot(); assert.match(before, /viewBox="10 20 400 300"/); assert.match(before, /fill="blue"/);
  h.ok('move g 1 2'); h.ok('undo'); assert.equal(h.snapshot(), before);
  h.ok('save out.svg'); h.ok('read out.svg'); assert.equal(h.snapshot(), before);
  h.ok('canvas 800 600'); assert.match(h.snapshot(), /viewBox="0 0 800 600"/);
});

test('nested ungroup transfers inherited styles and composes transforms; undo is exact', () => {
  const h = new Harness();
  h.files.files.set('x.svg', '<svg><g id="p"><g id="g" fill="red" transform="translate(5,6)"><rect id="r" width="2" height="2" transform="scale(2)"/><rect id="b" fill="blue"/></g></g></svg>');
  h.ok('read x.svg'); const before = h.snapshot(); h.ok('ungroup g');
  assert.equal(h.editor.document.require('r').attributes.transform, 'translate(5,6) scale(2)');
  assert.equal(h.editor.document.require('r').attributes.fill, 'red'); assert.equal(h.editor.document.require('b').attributes.fill, 'blue');
  h.ok('undo'); assert.equal(h.snapshot(), before);
});

test('unknown plugin marker degrades to regular g and remains serializable', () => {
  const h = new Harness(); h.files.files.set('x.svg', '<svg><g id="outer"><g id="box" data-kind="box"><rect id="r"/></g></g></svg>');
  h.ok('read x.svg'); h.ok('move box 1 2'); h.ok('ungroup box'); assert.equal(h.editor.document.require('r').parent?.id, 'outer');
});

for (const xml of [
  '<svg><rect></svg>', '<svg><rect id="x"/><circle id="x"/></svg>', '<svg><rect id=""/></svg>',
  '<svg><path id="p" d="M0 0"/></svg>', '<html/>', '<svg xmlns="urn:not-svg"/>', '<svg><script/></svg>',
  '<!DOCTYPE svg [<!ENTITY x "bad">]><svg/>', '<svg width="NaN"/>', '<svg width="0"/>',
  '<svg viewBox="0 0 1"/>', '<svg viewBox="0 0 -1 2"/>', '<svg><rect width="-1"/></svg>',
  '<svg><rect onclick="evil()"/></svg>', '<svg><rect><circle/></rect></svg>', '<svg><text><tspan>no</tspan></text></svg>',
  '<svg>unexpected</svg>', '<svg><g xmlns="urn:foreign"/></svg>', '<svg><rect fill="red></svg>',
]) {
  test(`invalid/unsupported SVG rejects atomically: ${xml.slice(0, 65)}`, () => {
    const h = new Harness(); h.ok('init'); h.ok('create g original'); h.ok('save original.svg'); h.ok('create g undoable');
    const before = h.snapshot(); h.files.files.set('bad.svg', xml); h.error('read bad.svg'); assert.equal(h.snapshot(), before);
    h.ok('undo'); assert.deepEqual(h.ids(), ['original']); h.ok('save'); assert.ok(h.files.files.has('original.svg'));
  });
}


test('control characters in imported XML are rejected before publication', () => {
  const h = new Harness(); h.ok('init'); const before = h.snapshot();
  h.files.files.set('bad.svg', '<svg><text id="t">bad\u0000</text></svg>');
  h.error('read bad.svg', 'invalid XML character'); assert.equal(h.snapshot(), before);
});
