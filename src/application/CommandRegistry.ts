import type { Command } from './Command.js';
import { Arguments } from './Arguments.js';
import type { ShapeFactory } from '../domain/ShapeFactory.js';
import { InitCommand } from './commands/InitCommand.js';
import { ReadCommand } from './commands/ReadCommand.js';
import { SaveCommand } from './commands/SaveCommand.js';
import { CanvasCommand } from './commands/CanvasCommand.js';
import { CreateCommand } from './commands/CreateCommand.js';
import { DeleteCommand } from './commands/DeleteCommand.js';
import { MoveCommand } from './commands/MoveCommand.js';
import { ScaleCommand } from './commands/ScaleCommand.js';
import { SetCommand } from './commands/SetCommand.js';
import { GroupCommand } from './commands/GroupCommand.js';
import { UngroupCommand } from './commands/UngroupCommand.js';
import { AddToCommand } from './commands/AddToCommand.js';
import { FrontCommand } from './commands/FrontCommand.js';
import { BackCommand } from './commands/BackCommand.js';
import { TreeCommand } from './commands/TreeCommand.js';
import { ShowCommand } from './commands/ShowCommand.js';
import { UndoCommand } from './commands/UndoCommand.js';
import { RedoCommand } from './commands/RedoCommand.js';
import { HelpCommand } from './commands/HelpCommand.js';

/** The only command-name dispatch point; Phase 2: external provider registration. */
export class CommandRegistry {
  private readonly builders: Map<string, (args: string[]) => Command>;
  private readonly syntax: readonly (readonly [string, string])[] = [
    ['init', '[w] [h]'],
    ['read', '<file.svg>'],
    ['save', '[file.svg]'],
    ['canvas', '[w h]'],
    ['create', '<type> <id> [params…] [in <containerId>]'],
    ['delete', '<id>'],
    ['move', '<id> <dx> <dy>'],
    ['scale', '<id> <factor>'],
    ['set', '<id> <attr> <value>'],
    ['group', '<newGid> <id1> <id2>…'],
    ['ungroup', '<gid>'],
    ['addto', '<gid> <id>'],
    ['front', '<id>'],
    ['back', '<id>'],
    ['tree', '[id]'],
    ['show', '<id>'],
    ['undo', ''],
    ['redo', ''],
    ['help', ''],
  ];
  constructor(factory: ShapeFactory) {
    this.builders = new Map<string, (args: string[]) => Command>([
      ['init', args => new InitCommand(new Arguments(args))],
      ['read', args => new ReadCommand(new Arguments(args))],
      ['save', args => new SaveCommand(new Arguments(args))],
      ['canvas', args => new CanvasCommand(new Arguments(args))],
      ['create', args => new CreateCommand(new Arguments(args), factory)],
      ['delete', args => new DeleteCommand(new Arguments(args))],
      ['move', args => new MoveCommand(new Arguments(args))],
      ['scale', args => new ScaleCommand(new Arguments(args))],
      ['set', args => new SetCommand(new Arguments(args))],
      ['group', args => new GroupCommand(new Arguments(args))],
      ['ungroup', args => new UngroupCommand(new Arguments(args))],
      ['addto', args => new AddToCommand(new Arguments(args))],
      ['front', args => new FrontCommand(new Arguments(args))],
      ['back', args => new BackCommand(new Arguments(args))],
      ['tree', args => new TreeCommand(new Arguments(args))],
      ['show', args => new ShowCommand(new Arguments(args))],
      ['undo', args => new UndoCommand(new Arguments(args))],
      ['redo', args => new RedoCommand(new Arguments(args))],
      ['help', args => new HelpCommand(new Arguments(args), this.help())],
    ]);
  }
  create(name: string, args: string[]): Command {
    const build = this.builders.get(name);
    if (!build) throw new Error(`unknown command: ${name}`);
    return build(args);
  }
  private help(): string {
    return this.syntax.map(([name, syntax]) => `${name} ${syntax}`.trimEnd()).join('\n') + `

create rect <id> <x> <y> <w> <h> [fill] [in <containerId>]
create circle <id> <cx> <cy> <r> [fill] [in <containerId>]
create ellipse <id> <cx> <cy> <rx> <ry> [fill] [in <containerId>]
create line <id> <x1> <y1> <x2> <y2> [stroke] [in <containerId>]
create text <id> <x> <y> "content" [in <containerId>]
create g <id> [in <containerId>]
# starts a full-line comment; use double quotes for spaces; Ctrl-D ends the session.`;
  }
}
