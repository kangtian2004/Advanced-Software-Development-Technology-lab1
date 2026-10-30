import type { Shape } from './Shape.js';
import { Validation } from './Validation.js';
export class ShapeDefinition {
  constructor(
    private readonly geometry: readonly string[],
    private readonly build: (id: string, values: number[], text: string) => Shape,
    private readonly style?: string,
    private readonly hasText = false,
  ) {}
  create(id: string, params: readonly string[]): Shape {
    const required = this.geometry.length + Number(this.hasText);
    if (params.length < required || params.length > required + Number(!!this.style)) {
      throw new Error(`expected ${required}${this.style ? ' or ' + (required + 1) : ''} shape parameters`);
    }
    const values = this.geometry.map((key, index) => Validation.number(params[index]!, key));
    const shape = this.build(id, values, this.hasText ? params[this.geometry.length]! : '');
    if (this.style && params[required] !== undefined) shape.set(this.style, params[required]!);
    return shape;
  }
  read(id: string, attributes: Readonly<Record<string, string>>, text: string): Shape {
    const values = this.geometry.map(key => Validation.number(attributes[key] ?? '0', key));
    const shape = this.build(id, values, text);
    for (const [key, value] of Object.entries(attributes)) {
      if (key !== 'id' && !this.geometry.includes(key)) shape.importPresentation(key, value);
    }
    return shape;
  }
}
