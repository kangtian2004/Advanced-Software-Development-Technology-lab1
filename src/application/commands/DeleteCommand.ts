import { EditCommand } from '../EditCommand.js';
import { Arguments } from '../Arguments.js';
import type { SvgDocument } from '../../domain/SvgDocument.js';
export class DeleteCommand extends EditCommand {
  constructor(private readonly args: Arguments) { super(); }
  protected override apply(document: SvgDocument): string {
    this.args.count(1); const shape = document.require(this.args.at(0));
    shape.parent!.remove(shape); return `${shape.kind}#${shape.id} deleted`;
  }
}
