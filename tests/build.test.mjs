import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdtemp, cp, rm } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

test('builds both languages with matching CSP, no external runtime and reproducible CRLF-safe output', async () => {
  const root = fileURLToPath(new URL('../', import.meta.url));
  const temp = await mkdtemp(path.join(tmpdir(), 'cuebridge-build-'));
  try {
    for (const name of ['src', 'scripts', 'docs/assets']) await cp(path.join(root, name), path.join(temp, name), { recursive: true });
    const build = () => {
      const result = spawnSync(process.execPath, ['scripts/build.mjs'], { cwd: temp, encoding: 'utf8' });
      assert.equal(result.status, 0, result.stderr);
    };
    build();
    const names = ['index.html', 'en.html', 'cuebridge.zh-CN.html', 'cuebridge.en.html'];
    const first = new Map();
    for (const name of names) {
      const html = await readFile(path.join(temp, 'dist', name), 'utf8'); first.set(name, html);
      const script = html.match(/<script type="module">([\s\S]*?)<\/script>/)[1];
      const style = html.match(/<style>([\s\S]*?)<\/style>/)[1];
      const hash = value => createHash('sha256').update(value).digest('base64');
      assert.ok(html.includes(`script-src 'sha256-${hash(script)}'`));
      assert.ok(html.includes(`style-src 'sha256-${hash(style)}'`));
      assert.ok(html.includes("connect-src 'none'"));
      assert.ok(!/<script[^>]+src=|<link[^>]+href=/i.test(html));
      assert.ok(!/^import |^export /m.test(script));
      assert.ok(!/\.innerHTML\s*=|insertAdjacentHTML|fetch\(|XMLHttpRequest|sendBeacon|WebSocket|localStorage|sessionStorage|indexedDB/.test(script));
      assert.ok(!/\{\{\w+\}\}/.test(html));
      const syntax = spawnSync(process.execPath, ['--input-type=module', '--check'], { input: script, encoding: 'utf8' });
      assert.equal(syntax.status, 0, syntax.stderr);
    }
    assert.ok(first.get('index.html').includes('<html lang="zh-CN">'));
    assert.ok(first.get('en.html').includes('<html lang="en">'));
    assert.ok(first.get('cuebridge.en.html').includes('href="https://nyxorbithq.github.io/subtitle-roundtrip/index.html"'));
    for (const [lang, filename] of [['en', 'en.html'], ['zh-CN', 'index.html']]) {
      const html = await readFile(path.join(temp, 'dist/demo', filename), 'utf8');
      const style = html.match(/<style>([\s\S]*?)<\/style>/)[1];
      assert.ok(html.includes(`style-src 'sha256-${createHash('sha256').update(style).digest('base64')}'`));
      assert.ok(html.includes(`<html lang="${lang}">`));
      assert.match(html, /media-src 'self'/);
      assert.match(html, /<video controls playsinline preload="metadata"/);
      assert.ok(!/autoplay|<script/.test(html));
      for (const ext of ['mp4', 'gif', 'jpg', 'vtt']) {
        const asset = `cuebridge-demo.${lang}.${ext}`;
        assert.ok(html.includes(`../media/${asset}`));
        assert.deepEqual(await readFile(path.join(temp, 'dist/media', asset)), await readFile(path.join(root, 'docs/assets', asset)));
      }
    }
    for (const name of ['index.html', 'style.css', 'core.mjs', 'demo.mjs', 'messages.mjs', 'app.mjs']) {
      const filename = path.join(temp, 'src', name);
      await writeFile(filename, (await readFile(filename, 'utf8')).replace(/\r?\n/g, '\r\n'));
    }
    build();
    for (const name of names) assert.equal(await readFile(path.join(temp, 'dist', name), 'utf8'), first.get(name));
  } finally {
    if (!path.resolve(temp).startsWith(`${path.resolve(tmpdir())}${path.sep}cuebridge-build-`)) throw new Error('Unexpected temporary path');
    await rm(temp, { recursive: true, force: true });
  }
});
