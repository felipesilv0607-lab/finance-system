import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

// Garante que os textos (pt-BR) do frontend não foram corrompidos ao salvar:
// arquivo precisa ser UTF-8 válido e não conter o caractere de substituição
// U+FFFD, que é o que sobra quando um "ã" é gravado com a codificação errada.

const root = fileURLToPath(new URL('..', import.meta.url));
const extensions = new Set(['.js', '.jsx', '.css', '.html']);

function listFiles(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);

    return statSync(path).isDirectory() ? listFiles(path) : [path];
  });
}

const files = [join(root, 'index.html'), ...listFiles(join(root, 'src'))].filter((file) =>
  extensions.has(extname(file))
);

test('arquivos do frontend são UTF-8 válido, sem caractere de substituição', () => {
  assert.ok(files.length > 20, 'a busca de arquivos não encontrou o frontend');

  for (const file of files) {
    const name = relative(root, file);
    let text;

    try {
      text = new TextDecoder('utf-8', { fatal: true }).decode(readFileSync(file));
    } catch {
      assert.fail(`${name} não é UTF-8 válido`);
    }

    const line = text.split('\n').findIndex((content) => content.includes('\uFFFD'));

    assert.equal(line, -1, `${name}:${line + 1} contém U+FFFD (texto corrompido)`);
  }
});
