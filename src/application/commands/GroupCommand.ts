import { EditCommand } from '../EditCommand.js';
import { Arguments } from '../Arguments.js';
import { Group } from '../../domain/Group.js';
import type { SvgDocument } from '../../domain/SvgDocument.js';
export class GroupCommand extends EditCommand {
  constructor(private readonly args: Arguments) { super(); }
  protected override apply(document: SvgDocument): string {
    this.args.count(2, Number.MAX_SAFE_INTEGER);
    const id = this.args.at(0), ids = this.args.rest(1);
    document.ensureAvailable(id);
    if (new Set(ids).size !== ids.length) throw new Error('duplicate group member');
    const requested = ids.map(key => document.require(key));
    for (const shape of requested) {
      if (requested.some(other => other !== shape && shape.contains(other))) {
        throw new Error(`cannot group a container into its own descendant: ${shape.id}`);
      }
    }
    // Preserve document traversal order rather than argument order.
    const selected = Array.from(document.shapes()).filter(shape => requested.includes(shape));
    let parent = selected[0]!.parent!;
    while (!selected.every(shape => parent.contains(shape))) parent = parent.parent!;
    let branch = selected[0]!;
    while (branch.parent !== parent) branch = branch.parent!;
    const index = parent.indexOf(branch);
    const group = new Group(id);
    for (const shape of selected) group.insert(shape);
    parent.insert(group, index);
    return `g#${id} created with ${selected.length} children`;
  }
}
