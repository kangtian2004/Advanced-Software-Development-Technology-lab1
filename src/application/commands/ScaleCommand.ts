import { EditCommand } from '../EditCommand.js';
import { Arguments } from '../Arguments.js';
import type { SvgDocument } from '../../domain/SvgDocument.js';
export class ScaleCommand extends EditCommand {
  constructor(private readonly args: Arguments) { super(); }
  protected override apply(document: SvgDocument): string {
    this.args.count(2); const shape = document.require(this.args.at(0));
    const factor = this.args.number(1, 'scale factor'); shape.scale(factor);
    return `${shape.kind}#${shape.id} scaled by ${factor}`;
  }
}
