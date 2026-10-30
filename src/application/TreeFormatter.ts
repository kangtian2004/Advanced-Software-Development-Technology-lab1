import { Group } from '../domain/Group.js';
import type { Shape } from '../domain/Shape.js';
import type { SvgDocument } from '../domain/SvgDocument.js';
export class TreeFormatter {
  format(document: SvgDocument, id?: string): string {
    const root = id === undefined ? document.root : document.require(id);
    const lines = [id === undefined ? `svg (${document.width}x${document.height})` : root.summary()];
    this.children(root, '', lines);
    return lines.join('\n');
  }
  private children(shape: Shape, prefix: string, lines: string[]): void {
    if (!(shape instanceof Group)) return;
    const children = shape.children;
    children.forEach((child, index) => {
      const last = index === children.length - 1;
      lines.push(prefix + (last ? '└── ' : '├── ') + child.summary());
      this.children(child, prefix + (last ? '    ' : '│   '), lines);
    });
  }
}
