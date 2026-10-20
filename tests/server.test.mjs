import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

test('preview serves only built HTML on loopback, with HEAD and method restrictions', async () => {
  const root = fileURLToPath(new URL('../', import.meta.url));
  const child = spawn(process.execPath, ['scripts/serve.mjs', '--port', '0'], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] });
  try {
    const base = await new Promise((resolve, reject) => {
      let output = '';
      const timer = setTimeout(() => reject(new Error('Preview did not start')), 10000);
      child.once('error', error => { clearTimeout(timer); reject(error); });
      child.once('exit', code => { clearTimeout(timer); reject(new Error(`Preview exited: ${code}`)); });
      child.stdout.on('data', data => {
        output += data.toString(); const match = output.match(/Local: (http:\/\/127\.0\.0\.1:\d+)/);
        if (match) { clearTimeout(timer); resolve(match[1]); }
      });
    });
    for (const route of ['/', '/en.html', '/cuebridge.zh-CN.html', '/cuebridge.en.html']) {
      const response = await fetch(base + route); const body = await response.text();
      assert.equal(response.status, 200); assert.match(response.headers.get('content-type'), /^text\/html/);
      assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
      const head = await fetch(base + route, { method: 'HEAD' });
      assert.equal(await head.text(), ''); assert.equal(Number(head.headers.get('content-length')), new TextEncoder().encode(body).length);
    }
    for (const route of ['/src/core.mjs', '/README.md', '/.git/config', '/examples/demo.srt', '/missing']) assert.equal((await fetch(base + route)).status, 404);
    assert.equal((await fetch(base + '/', { method: 'POST', body: 'not a subtitle' })).status, 405);
    assert.equal((await fetch(base + '/favicon.ico')).status, 204);
  } finally {
    child.kill();
  }
});
