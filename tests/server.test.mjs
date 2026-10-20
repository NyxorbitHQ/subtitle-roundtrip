import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

test('preview serves allowlisted pages and media with byte ranges and method restrictions', async () => {
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
    for (const route of ['/', '/en.html', '/cuebridge.zh-CN.html', '/cuebridge.en.html', '/demo/', '/demo/en.html']) {
      const response = await fetch(base + route); const body = await response.text();
      assert.equal(response.status, 200); assert.match(response.headers.get('content-type'), /^text\/html/);
      assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
      const head = await fetch(base + route, { method: 'HEAD' });
      assert.equal(await head.text(), ''); assert.equal(Number(head.headers.get('content-length')), new TextEncoder().encode(body).length);
    }
    assert.equal((await fetch(base + '/demo', { redirect: 'manual' })).status, 308);
    for (const lang of ['en', 'zh-CN']) for (const [ext, type] of [['mp4', 'video/mp4'], ['gif', 'image/gif'], ['jpg', 'image/jpeg'], ['vtt', 'text/vtt; charset=utf-8']]) {
      const response = await fetch(`${base}/media/cuebridge-demo.${lang}.${ext}`, { method: 'HEAD' });
      assert.equal(response.status, 200); assert.equal(response.headers.get('content-type'), type);
      assert.ok(Number(response.headers.get('content-length')) > 0);
      assert.equal(await response.text(), '');
    }
    const videoUrl = base + '/media/cuebridge-demo.en.mp4';
    const full = new Uint8Array(await (await fetch(videoUrl)).arrayBuffer());
    for (const [range, start, end] of [['bytes=0-31', 0, 31], ['bytes=-16', full.length - 16, full.length - 1], [`bytes=${full.length - 12}-`, full.length - 12, full.length - 1]]) {
      const partial = await fetch(videoUrl, { headers: { Range: range } });
      assert.equal(partial.status, 206);
      assert.equal(partial.headers.get('content-range'), `bytes ${start}-${end}/${full.length}`);
      assert.deepEqual(new Uint8Array(await partial.arrayBuffer()), full.slice(start, end + 1));
    }
    for (const range of ['bytes=1-0', 'bytes=-0', 'bytes=0-1,4-5', `bytes=${full.length}-`, 'nonsense']) {
      const response = await fetch(videoUrl, { headers: { Range: range } });
      assert.equal(response.status, 416); assert.equal(response.headers.get('content-range'), `bytes */${full.length}`);
    }
    const headWithRange = await fetch(videoUrl, { method: 'HEAD', headers: { Range: 'bytes=0-1' } });
    assert.equal(headWithRange.status, 200); assert.equal(Number(headWithRange.headers.get('content-length')), full.length);
    for (const route of ['/src/core.mjs', '/README.md', '/.git/config', '/examples/demo.srt', '/missing']) assert.equal((await fetch(base + route)).status, 404);
    assert.equal((await fetch(base + '/', { method: 'POST', body: 'not a subtitle' })).status, 405);
    assert.equal((await fetch(base + '/favicon.ico')).status, 204);
  } finally {
    child.kill();
  }
});
