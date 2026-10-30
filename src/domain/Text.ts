import { Shape } from './Shape.js';
export class Text extends Shape {
  private content: string;
  constructor(id: string, x: number, y: number, text: string) {
    super('text', id, { x, y }); this.content = text;
  }
  override get text(): string { return this.content; }
  override move(dx: number, dy: number): void { this.shift('x', 'y', dx, dy); }
  override set(attribute: string, value: string): void {
    if (attribute === 'text') this.content = value;
    else super.set(attribute, value);
  }
  override clone(): Text { return this.copyPresentation(new Text(this.id, this.number('x'), this.number('y'), this.text)); }
}
