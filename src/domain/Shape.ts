import type { Group } from './Group.js';
import { Validation } from './Validation.js';

/** Encapsulates attributes; callers receive copies, never mutable state. */
export abstract class Shape {
  private owner: Group | null = null;
  private readonly geometry = new Map<string, number>();
  private readonly presentation = new Map<string, string>();
  protected constructor(readonly kind: string, readonly id: string, geometry: Record<string, number> = {}) {
    Validation.id(id);
    for (const [key, value] of Object.entries(geometry)) this.geometry.set(key, this.validateGeometry(key, value));
  }
  get parent(): Group | null { return this.owner; }
  /** Ownership is changed exclusively by Group.insert/remove. */
  attach(parent: Group | null): void { this.owner = parent; }
  get attributes(): Readonly<Record<string, string>> {
    return Object.fromEntries([...Array.from(this.geometry, ([k, v]) => [k, String(v)]), ...this.presentation]);
  }
  get text(): string | undefined { return undefined; }
  abstract move(dx: number, dy: number): void;
  scale(factor: number): void {
    Validation.positive(factor, 'scale factor');
    for (const [key, value] of this.geometry) this.geometry.set(key, this.validateGeometry(key, value * factor));
  }
  set(attribute: string, value: string): void {
    Validation.xml(value);
    if (this.geometry.has(attribute)) this.geometry.set(attribute, this.validateGeometry(attribute, value));
    else if (['fill', 'stroke', 'stroke-width'].includes(attribute)) {
      if (attribute === 'stroke-width') value = String(Validation.nonnegative(value, attribute));
      if (/[\r\n]/u.test(value)) throw new Error('attribute must fit on one line');
      this.presentation.set(attribute, value);
    } else throw new Error(`unknown attribute: ${attribute}`);
  }
  /** Import-only presentation metadata; CLI set retains its strict whitelist. */
  importPresentation(attribute: string, value: string): void {
    Validation.xml(value);
    if (['fill', 'stroke', 'stroke-width'].includes(attribute)) this.set(attribute, value);
    else if (['transform', 'font-size', 'font-family', 'font-weight', 'text-anchor', 'dominant-baseline', 'opacity', 'fill-opacity', 'stroke-opacity', 'stroke-linecap', 'stroke-linejoin', 'data-kind'].includes(attribute)) {
      if (/[\r\n]/u.test(value)) throw new Error('attribute must fit on one line');
      this.presentation.set(attribute, value);
    } else throw new Error(`unsupported SVG attribute: ${attribute}`);
  }
  inheritContainer(group: Group): void {
    for (const [key, value] of Object.entries(group.attributes)) {
      if (key === 'transform') {
        this.presentation.set(key, `${value} ${this.presentation.get(key) ?? ''}`.trim());
      } else if (key !== 'data-kind' && !this.presentation.has(key)) this.presentation.set(key, value);
    }
  }
  abstract clone(): Shape;
  *walk(): IterableIterator<Shape> { yield this; }
  contains(shape: Shape): boolean { return this === shape; }
  summary(): string {
    const attrs = Object.entries(this.attributes).map(([key, value]) => `${key}=${value}`).join(' ');
    return `${this.kind}#${this.id}${attrs ? '  ' + attrs : ''}${this.text === undefined ? '' : ' ' + JSON.stringify(this.text)}`;
  }
  protected shift(x: string, y: string, dx: number, dy: number): void {
    this.geometry.set(x, Validation.number(this.number(x) + dx, x));
    this.geometry.set(y, Validation.number(this.number(y) + dy, y));
  }
  protected number(key: string): number { return this.geometry.get(key)!; }
  protected copyPresentation<T extends Shape>(copy: T): T {
    for (const [k, v] of this.presentation) copy.presentation.set(k, v);
    return copy;
  }
  private validateGeometry(key: string, value: string | number): number {
    return ['width', 'height', 'r', 'rx', 'ry'].includes(key)
      ? Validation.nonnegative(value, key) : Validation.number(value, key);
  }
}
