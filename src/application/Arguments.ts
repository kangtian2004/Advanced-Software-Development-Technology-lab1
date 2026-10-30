import { Validation } from '../domain/Validation.js';
export class Arguments {
  constructor(private readonly values: readonly string[]) {}
  count(min: number, max = min): void {
    if (this.values.length < min || this.values.length > max) throw new Error('invalid arguments; use help for syntax');
  }
  at(index: number): string {
    const value = this.values[index];
    if (value === undefined) throw new Error('missing argument; use help for syntax');
    return value;
  }
  optional(index: number): string | undefined { return this.values[index]; }
  number(index: number, name: string): number { return Validation.number(this.at(index), name); }
  rest(index: number): string[] { return this.values.slice(index); }
}
