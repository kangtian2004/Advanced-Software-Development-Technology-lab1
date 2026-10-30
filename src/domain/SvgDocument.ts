import { Group } from './Group.js';
import type { Shape } from './Shape.js';
import { Validation } from './Validation.js';

export class SvgDocument {
  private canvasWidth: number;
  private canvasHeight: number;
  private view: string | undefined;
  private readonly scene = new Group('__document_root__');
  constructor(width = 800, height = 600, viewBox?: string) {
    this.canvasWidth = Validation.positive(width, 'width');
    this.canvasHeight = Validation.positive(height, 'height');
    this.view = viewBox;
  }
  get width(): number { return this.canvasWidth; }
  get height(): number { return this.canvasHeight; }
  get viewBox(): string { return this.view ?? `0 0 ${this.width} ${this.height}`; }
  get root(): Group { return this.scene; }
  resize(width: number, height: number): void {
    const w = Validation.positive(width, 'width'), h = Validation.positive(height, 'height');
    this.canvasWidth = w; this.canvasHeight = h; this.view = undefined;
  }
  *shapes(): IterableIterator<Shape> { for (const child of this.scene.children) yield* child.walk(); }
  find(id: string): Shape | undefined { return Array.from(this.shapes()).find(shape => shape.id === id); }
  require(id: string): Shape {
    const shape = this.find(id);
    if (!shape) throw new Error(`no such shape: ${id}`);
    return shape;
  }
  container(id: string): Group {
    const shape = this.find(id);
    if (!shape) throw new Error(`no such container: ${id}`);
    if (!(shape instanceof Group)) throw new Error(`not a container: ${id}`);
    return shape;
  }
  ensureAvailable(id: string): void {
    Validation.id(id);
    if (this.find(id)) throw new Error(`id already exists: ${id}`);
  }
  add(shape: Shape, parent = this.root): void {
    const subtree = new Set<string>();
    for (const node of shape.walk()) {
      this.ensureAvailable(node.id);
      if (subtree.has(node.id)) throw new Error(`id already exists: ${node.id}`);
      subtree.add(node.id);
    }
    parent.insert(shape);
  }
  clone(): SvgDocument {
    const copy = new SvgDocument(this.width, this.height, this.view);
    for (const child of this.root.children) copy.root.insert(child.clone());
    return copy;
  }
}
