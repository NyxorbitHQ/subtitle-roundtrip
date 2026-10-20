import test from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

test('every explanatory document has a complete language pair and valid same-language local links', async () => {
  const root = fileURLToPath(new URL('../', import.meta.url));
  async function walk(folder) {
    const entries = await readdir(folder, { withFileTypes: true });
    const nested = await Promise.all(entries.filter(entry => !['.git', 'node_modules', 'dist'].includes(entry.name)).map(entry => {
      const full = path.join(folder, entry.name);
      return entry.isDirectory() ? walk(full) : entry.name.endsWith('.md') ? [full] : [];
    }));
    return nested.flat();
  }
  const files = await walk(root);
  assert.ok(files.length >= 20);
  for (const filename of files) {
    const name = path.basename(filename), chinese = name.endsWith('.zh-CN.md');
    const sibling = chinese ? name.replace('.zh-CN.md', '.md') : name.replace(/\.md$/, '.zh-CN.md');
    assert.ok((await stat(path.join(path.dirname(filename), sibling))).isFile(), `Missing language pair: ${name}`);
    const text = await readFile(filename, 'utf8');
    assert.ok(text.startsWith('# '), name);
    assert.ok(text.includes('[English](') && text.includes('[简体中文]('), `Missing language switch: ${name}`);
    assert.equal((text.match(/^```/gm) || []).length % 2, 0, `Unclosed code block: ${name}`);
    if (!chinese) for (const line of text.split('\n')) {
      if (/\p{Script=Han}/u.test(line)) assert.ok(line.startsWith('[English]('), `Mixed-language prose: ${name}`);
    }
    for (const match of text.matchAll(/!?\[[^\]]*\]\(([^)]+)\)/g)) {
      const target = match[1];
      if (/^https?:|^#/.test(target)) continue;
      const [link, fragment] = target.split('#');
      const resolved = path.resolve(path.dirname(filename), link);
      assert.ok(resolved.startsWith(path.resolve(root) + path.sep), `Outside repository: ${target}`);
      assert.ok((await stat(resolved)).isFile(), `Broken link: ${name} -> ${target}`);
      if (chinese && resolved.endsWith('.md') && !match[0].startsWith('[English](')) assert.ok(resolved.endsWith('.zh-CN.md'), `Wrong language: ${name} -> ${target}`);
      if (fragment) {
        const destination = await readFile(resolved, 'utf8');
        const slugs = Array.from(destination.matchAll(/^#+ (.+)$/gm), heading => heading[1].toLowerCase().replace(/[^\p{L}\p{N}_ -]/gu, '').replace(/ /g, '-'));
        assert.ok(slugs.includes(fragment), `Broken fragment: ${name} -> ${target}`);
      }
    }
  }
});
