import { Shape } from './Shape.js';
export class Line extends Shape {
  constructor(id: string, x1: number, y1: number, x2: number, y2: number) { super('line', id, { x1, y1, x2, y2 }); }
  override move(dx: number, dy: number): void { this.shift('x1', 'y1', dx, dy); this.shift('x2', 'y2', dx, dy); }
  override clone(): Line { return this.copyPresentation(new Line(this.id, this.number('x1'), this.number('y1'), this.number('x2'), this.number('y2'))); }
}
