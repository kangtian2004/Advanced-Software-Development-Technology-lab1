import { EditCommand } from '../EditCommand.js';
import { Arguments } from '../Arguments.js';
import type { SvgDocument } from '../../domain/SvgDocument.js';
export class AddToCommand extends EditCommand {
  constructor(private readonly args: Arguments) { super(); }
  protected override apply(document: SvgDocument): string {
    this.args.count(2);
    const parent = document.container(this.args.at(0)), shape = document.require(this.args.at(1));
    parent.insert(shape);
    return `${shape.kind}#${shape.id} added to g#${parent.id}`;
  }
}
