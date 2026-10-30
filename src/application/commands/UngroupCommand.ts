import { EditCommand } from '../EditCommand.js';
import { Arguments } from '../Arguments.js';
import type { SvgDocument } from '../../domain/SvgDocument.js';
export class UngroupCommand extends EditCommand {
  constructor(private readonly args: Arguments) { super(); }
  protected override apply(document: SvgDocument): string {
    this.args.count(1);
    const group = document.container(this.args.at(0));
    const parent = group.parent!;
    if (parent === document.root) throw new Error(`cannot ungroup top-level container: ${group.id}`);
    let index = parent.remove(group);
    for (const child of group.children) { child.inheritContainer(group); parent.insert(child, index++); }
    return `g#${group.id} ungrouped`;
  }
}
