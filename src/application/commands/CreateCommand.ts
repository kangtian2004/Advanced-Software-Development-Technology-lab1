import { EditCommand } from '../EditCommand.js';
import { Arguments } from '../Arguments.js';
import type { ShapeFactory } from '../../domain/ShapeFactory.js';
import type { SvgDocument } from '../../domain/SvgDocument.js';
export class CreateCommand extends EditCommand {
  constructor(private readonly args: Arguments, private readonly factory: ShapeFactory) { super(); }
  protected override apply(document: SvgDocument): string {
    this.args.count(2, Number.MAX_SAFE_INTEGER);
    const type = this.args.at(0), id = this.args.at(1), params = this.args.rest(2);
    let parent = document.root;
    if (params.at(-2) === 'in') {
      parent = document.container(params.at(-1)!); params.splice(-2);
    }
    document.ensureAvailable(id);
    const shape = this.factory.create(type, id, params);
    document.add(shape, parent);
    return `${type}#${id} created${parent === document.root ? '' : ' in g#' + parent.id}`;
  }
}
