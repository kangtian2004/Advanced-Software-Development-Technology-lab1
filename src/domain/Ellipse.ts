import { Shape } from './Shape.js';
export class Ellipse extends Shape {
  constructor(id: string, cx: number, cy: number, rx: number, ry: number) { super('ellipse', id, { cx, cy, rx, ry }); }
  override move(dx: number, dy: number): void { this.shift('cx', 'cy', dx, dy); }
  override clone(): Ellipse { return this.copyPresentation(new Ellipse(this.id, this.number('cx'), this.number('cy'), this.number('rx'), this.number('ry'))); }
}
