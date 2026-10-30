import { Shape } from './Shape.js';
export class Circle extends Shape {
  constructor(id: string, cx: number, cy: number, r: number) { super('circle', id, { cx, cy, r }); }
  override move(dx: number, dy: number): void { this.shift('cx', 'cy', dx, dy); }
  override clone(): Circle { return this.copyPresentation(new Circle(this.id, this.number('cx'), this.number('cy'), this.number('r'))); }
}
