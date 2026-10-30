import { Shape } from './Shape.js';
export class Rect extends Shape {
  constructor(id: string, x: number, y: number, width: number, height: number) { super('rect', id, { x, y, width, height }); }
  override move(dx: number, dy: number): void { this.shift('x', 'y', dx, dy); }
  override clone(): Rect { return this.copyPresentation(new Rect(this.id, this.number('x'), this.number('y'), this.number('width'), this.number('height'))); }
}
