import type { SvgDocument } from '../domain/SvgDocument.js';
export interface SvgCodec {
  decode(source: string): { document: SvgDocument; warnings: string[] };
  encode(document: SvgDocument): string;
}
