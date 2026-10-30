import { EditCommand } from '../EditCommand.js';
import { Arguments } from '../Arguments.js';
import type { SvgDocument } from '../../domain/SvgDocument.js';
export class SetCommand extends EditCommand {
  constructor(private readonly args: Arguments) { super(); }
  protected override apply(document: SvgDocument): string {
    this.args.count(3); const shape = document.require(this.args.at(0));
    shape.set(this.args.at(1), this.args.at(2));
    return `${shape.kind}#${shape.id} updated: ${this.args.at(1)}=${JSON.stringify(this.args.at(2))}`;
  }
}
