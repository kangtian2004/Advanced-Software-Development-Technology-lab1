import { DOMParser, XMLSerializer, type Element, type Document as XmlDocument } from '@xmldom/xmldom';
import { Group } from '../domain/Group.js';
import { ShapeFactory } from '../domain/ShapeFactory.js';
import type { Shape } from '../domain/Shape.js';
import { SvgDocument } from '../domain/SvgDocument.js';
import { Validation } from '../domain/Validation.js';
import type { SvgCodec } from '../ports/SvgCodec.js';

export class XmlSvgCodec implements SvgCodec {
  private readonly namespace = 'http://www.w3.org/2000/svg';
  constructor(private readonly factory: ShapeFactory) {}
  decode(source: string): { document: SvgDocument; warnings: string[] } {
    Validation.xml(source);
    if (/<!DOCTYPE|<!ENTITY/iu.test(source)) throw new Error('invalid SVG: DTD and entities are not supported');
    let xml: XmlDocument;
    try {
      xml = new DOMParser({ onError: (_level, message) => { throw new Error(message); } }).parseFromString(source, 'image/svg+xml');
    } catch { throw new Error('invalid SVG: malformed XML'); }
    const root = xml.documentElement;
    if (!root || root.localName !== 'svg' || (root.namespaceURI && root.namespaceURI !== this.namespace)) {
      throw new Error('invalid SVG: expected <svg> root');
    }
    this.assertNoText(root);
    const view = root.getAttribute('viewBox');
    let viewBox: string | undefined;
    let viewWidth = 800, viewHeight = 600;
    if (view !== null) {
      const parts = view.trim().split(/[\s,]+/u).map(value => Validation.number(value, 'viewBox'));
      if (parts.length !== 4) throw new Error('invalid SVG: viewBox needs four numbers');
      Validation.positive(parts[2]!, 'viewBox width'); Validation.positive(parts[3]!, 'viewBox height');
      viewWidth = parts[2]!; viewHeight = parts[3]!; viewBox = parts.join(' ');
    }
    const document = new SvgDocument(
      this.dimension(root.getAttribute('width'), viewWidth, 'width'),
      this.dimension(root.getAttribute('height'), viewHeight, 'height'), viewBox,
    );
    for (const [key, value] of Object.entries(this.attributes(root))) {
      if (!['width', 'height', 'viewBox', 'version'].includes(key)) document.root.importPresentation(key, value);
    }
    const reserved = new Set<string>();
    this.reserveIds(root, reserved);
    const warnings: string[] = [];
    for (const element of this.elements(root)) document.add(this.readShape(element, reserved, warnings));
    return { document, warnings };
  }
  encode(document: SvgDocument): string {
    const xml = new DOMParser().parseFromString(`<svg xmlns="${this.namespace}"/>`, 'image/svg+xml');
    const root = xml.documentElement!;
    root.setAttribute('width', String(document.width)); root.setAttribute('height', String(document.height));
    root.setAttribute('viewBox', document.viewBox);
    this.writeAttributes(root, document.root.attributes);
    for (const shape of document.root.children) {
      root.appendChild(xml.createTextNode('\n  '));
      root.appendChild(this.writeShape(xml, shape, 1));
    }
    if (document.root.children.length) root.appendChild(xml.createTextNode('\n'));
    return '<?xml version="1.0" encoding="UTF-8"?>\n' + new XMLSerializer().serializeToString(xml) + '\n';
  }
  private dimension(value: string | null, fallback: number, label: string): number {
    return value === null ? fallback : Validation.positive(value.replace(/px$/u, ''), label);
  }
  private attributes(element: Element): Record<string, string> {
    const result: Record<string, string> = Object.create(null) as Record<string, string>;
    for (let i = 0; i < element.attributes.length; i++) {
      const attr = element.attributes.item(i)!;
      if (attr.name !== 'id' && attr.name !== 'xmlns' && !attr.name.startsWith('xmlns:')) result[attr.name] = attr.value;
    }
    return result;
  }
  private reserveIds(element: Element, reserved: Set<string>): void {
    const id = element.getAttribute('id');
    if (id !== null) {
      Validation.id(id);
      if (reserved.has(id)) throw new Error(`id already exists: ${id}`);
      reserved.add(id);
    }
    for (const child of this.elements(element)) this.reserveIds(child, reserved);
  }
  private elements(element: Element): Element[] {
    const children: Element[] = [];
    for (let node = element.firstChild; node; node = node.nextSibling) {
      if (node.nodeType === 1) children.push(node as Element);
    }
    return children;
  }
  private assertNoText(element: Element): void {
    for (let node = element.firstChild; node; node = node.nextSibling) {
      if ((node.nodeType === 3 || node.nodeType === 4) && node.nodeValue?.trim()) {
        throw new Error(`invalid SVG: unexpected text inside <${element.localName}>`);
      }
    }
  }
  private readShape(element: Element, reserved: Set<string>, warnings: string[]): Shape {
    if (element.namespaceURI && element.namespaceURI !== this.namespace) throw new Error('invalid SVG: unsupported namespace');
    const type = element.localName ?? element.tagName;
    let id = element.getAttribute('id');
    if (id === null) {
      let n = 1;
      while (reserved.has(`${type}${n}`)) n++;
      id = `${type}${n}`; reserved.add(id);
      warnings.push(`warning: assigned id ${id} to unnamed <${type}>`);
    }
    const shape = this.factory.read(type, id, this.attributes(element), element.textContent ?? '');
    const children = this.elements(element);
    if (shape.text === undefined) this.assertNoText(element);
    if (shape instanceof Group) for (const child of children) shape.insert(this.readShape(child, reserved, warnings));
    else if (children.length) throw new Error(`invalid SVG: unsupported child inside <${type}>`);
    return shape;
  }
  private writeShape(xml: XmlDocument, shape: Shape, depth: number): Element {
    const element = xml.createElementNS(this.namespace, shape.kind);
    element.setAttribute('id', shape.id); this.writeAttributes(element, shape.attributes);
    if (shape.text !== undefined) {
      Validation.xml(shape.text);
      element.appendChild(xml.createTextNode(shape.text));
    }
    if (shape instanceof Group && shape.children.length) {
      for (const child of shape.children) {
        element.appendChild(xml.createTextNode('\n' + '  '.repeat(depth + 1)));
        element.appendChild(this.writeShape(xml, child, depth + 1));
      }
      element.appendChild(xml.createTextNode('\n' + '  '.repeat(depth)));
    }
    return element;
  }
  private writeAttributes(element: Element, attributes: Readonly<Record<string, string>>): void {
    for (const [key, value] of Object.entries(attributes)) { Validation.xml(value); element.setAttribute(key, value); }
  }
}
