import { EditCommand } from '../EditCommand.js';
import { Arguments } from '../Arguments.js';
import type { SvgDocument } from '../../domain/SvgDocument.js';
export class MoveCommand extends EditCommand {
  constructor(private readonly args: Arguments) { super(); }
  protected override apply(document: SvgDocument): string {
    this.args.count(3); const shape = document.require(this.args.at(0));
    const dx = this.args.number(1, 'dx'), dy = this.args.number(2, 'dy');
    shape.move(dx, dy); return `${shape.kind}#${shape.id} moved by (${dx},${dy})`;
  }
}
