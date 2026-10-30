/** Only full lines beginning with # are comments; #hex remains a normal argument. */
export class Tokenizer {
  tokenize(line: string): string[] {
    if (line.trimStart().startsWith('#')) return [];
    const tokens: string[] = [];
    let token = '', quoted = false, active = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]!;
      if (ch === '"') { quoted = !quoted; active = true; }
      else if (ch === '\\' && quoted && ['"', '\\'].includes(line[i + 1] ?? '')) { token += line[++i]!; }
      else if (/\s/u.test(ch) && !quoted) {
        if (active) { tokens.push(token); token = ''; active = false; }
      } else { token += ch; active = true; }
    }
    if (quoted) throw new Error('unterminated double quote');
    if (active) tokens.push(token);
    return tokens;
  }
}
