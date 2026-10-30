export class Validation {
  static number(value: string | number, label: string): number {
    if (typeof value === 'string' && !/^[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?$/.test(value)) {
      throw new Error(`invalid number: ${label}`);
    }
    const n = Number(value);
    if (!Number.isFinite(n)) throw new Error(`invalid number: ${label}`);
    return Object.is(n, -0) ? 0 : n;
  }
  static nonnegative(value: string | number, label: string): number {
    const n = this.number(value, label);
    if (n < 0) throw new Error(`${label} must be non-negative`);
    return n;
  }
  static positive(value: string | number, label: string): number {
    const n = this.number(value, label);
    if (n <= 0) throw new Error(`${label} must be positive`);
    return n;
  }
  static xml(value: string): void {
    if (/[^\u0009\u000A\u000D\u0020-\uD7FF\uE000-\uFFFD\u{10000}-\u{10FFFF}]/u.test(value)) {
      throw new Error('invalid XML character');
    }
  }
  static id(id: string): void {
    this.xml(id);
    if (!id || /[\s<>"'&]/u.test(id)) throw new Error(`invalid id: ${id}`);
  }
}
