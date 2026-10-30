import { Shape } from './Shape.js';
import { Validation } from './Validation.js';

export class Group extends Shape {
  private readonly nodes: Shape[] = [];
  constructor(id: string) { super('g', id); }
  get children(): readonly Shape[] { return [...this.nodes]; }
  insert(shape: Shape, index = this.nodes.length): void {
    if (shape.contains(this)) throw new Error(`cannot move a container into its own descendant: ${shape.id}`);
    shape.parent?.remove(shape);
    this.nodes.splice(Math.max(0, Math.min(index, this.nodes.length)), 0, shape);
    shape.attach(this);
  }
  remove(shape: Shape): number {
    const index = this.nodes.indexOf(shape);
    if (index < 0) throw new Error(`shape is not a child: ${shape.id}`);
    this.nodes.splice(index, 1);
    shape.attach(null);
    return index;
  }
  indexOf(shape: Shape): number { return this.nodes.indexOf(shape); }
  override move(dx: number, dy: number): void { for (const child of this.nodes) child.move(dx, dy); }
  override scale(factor: number): void {
    Validation.positive(factor, 'scale factor');
    for (const child of this.nodes) child.scale(factor);
  }
  override clone(): Group {
    const copy = this.copyPresentation(new Group(this.id));
    for (const child of this.nodes) copy.insert(child.clone());
    return copy;
  }
  override *walk(): IterableIterator<Shape> { yield this; for (const child of this.nodes) yield* child.walk(); }
  override contains(shape: Shape): boolean { return this === shape || this.nodes.some(child => child.contains(shape)); }
}
