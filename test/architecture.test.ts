import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

/** Check actual imports, including type-only dependencies, against the documented rules. */
test('all production imports obey the architecture dependency direction', () => {
  const allowed: Record<string, readonly string[]> = {
    domain: ['domain'], ports: ['domain', 'ports'], application: ['domain', 'ports', 'application'],
    infrastructure: ['domain', 'ports', 'infrastructure'], cli: ['cli', 'application'],
  };
  const files = readdirSync('src', { recursive: true }).filter((p): p is string => typeof p === 'string' && p.endsWith('.ts'));
  for (const path of files) {
    if (path === 'main.ts') continue;
    const layer = path.split('/')[0]!;
    const source = readFileSync(join('src', path), 'utf8');
    const imports = Array.from(source.matchAll(/from\s+['"]([^'"]+)['"]/gu), m => m[1]!);
    for (const target of imports) {
      if (target.startsWith('.')) {
        const destination = relative(resolve('src'), resolve('src', path, '..', target)).split('/')[0]!;
        assert.ok(allowed[layer]?.includes(destination), `${path} cannot import ${target}`);
      } else assert.equal(layer, 'infrastructure', `${path} cannot depend on external library ${target}`);
    }
    assert.doesNotMatch(source, /switch\s*\(/, `avoid tag-based or command-name switches in ${path}`);
  }
});

test('each production class lives in its own file named after the class', () => {
  for (const path of readdirSync('src', { recursive: true })) {
    if (typeof path !== 'string' || !path.endsWith('.ts')) continue;
    const classes = Array.from(readFileSync(join('src', path), 'utf8').matchAll(/export (?:abstract )?class (\w+)/gu), m => m[1]!);
    assert.ok(classes.length <= 1, `${path} has several classes`);
    if (classes.length) assert.equal(path.split('/').at(-1), `${classes[0]}.ts`);
  }
});
