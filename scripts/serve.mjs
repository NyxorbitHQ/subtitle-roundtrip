import http from 'node:http';
import { readFile } from 'node:fs/promises';
const args = process.argv.slice(2);
if (args.length && !(args.length === 2 && args[0] === '--port')) { console.error('Usage: npm start -- --port 4180'); process.exit(1); }
const port = args.length ? Number(args[1]) : 4180;
if (!Number.isInteger(port) || port < 0 || port > 65535) { console.error('Invalid port'); process.exit(1); }
const routes = new Map([['/', 'index.html'], ...['index.html', 'en.html', 'cuebridge.zh-CN.html', 'cuebridge.en.html'].map(name => [`/${name}`, name])]);
routes.set('/demo/', 'demo/index.html');
routes.set('/demo/index.html', 'demo/index.html');
routes.set('/demo/en.html', 'demo/en.html');
for (const lang of ['en', 'zh-CN']) for (const ext of ['mp4', 'gif', 'jpg', 'vtt']) {
  const file = `media/cuebridge-demo.${lang}.${ext}`;
  routes.set(`/${file}`, file);
}
const types = { html: 'text/html; charset=utf-8', mp4: 'video/mp4', gif: 'image/gif', jpg: 'image/jpeg', vtt: 'text/vtt; charset=utf-8' };
try { await readFile(new URL('../dist/index.html', import.meta.url)); }
catch { console.error('Run npm run build first.'); process.exit(1); }
const server = http.createServer(async (request, response) => {
  const headers = { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer', 'X-Frame-Options': 'DENY' };
  if (!['GET', 'HEAD'].includes(request.method)) { response.writeHead(405, { ...headers, Allow: 'GET, HEAD' }); response.end(); return; }
  let pathname;
  try { pathname = new URL(request.url, 'http://localhost').pathname; }
  catch { response.writeHead(400, headers); response.end(); return; }
  if (pathname === '/favicon.ico') { response.writeHead(204, headers); response.end(); return; }
  if (pathname === '/demo') { response.writeHead(308, { ...headers, Location: '/demo/' }); response.end(); return; }
  const filename = routes.get(pathname);
  if (!filename) { response.writeHead(404, headers); response.end('Not found'); return; }
  try {
    const file = await readFile(new URL(`../dist/${filename}`, import.meta.url));
    const media = filename.endsWith('.mp4');
    const fileHeaders = { ...headers, 'Content-Type': types[filename.split('.').at(-1)], 'Content-Length': file.length, ...(media ? { 'Accept-Ranges': 'bytes' } : {}) };
    // Range applies to GET only. Support a single range; reject ambiguous requests.
    if (media && request.method === 'GET' && request.headers.range) {
      const match = /^bytes=(\d*)-(\d*)$/.exec(request.headers.range);
      let start = NaN, end = NaN;
      if (match && (match[1] || match[2])) {
        if (!match[1]) { start = Math.max(0, file.length - Number(match[2])); end = file.length - 1; }
        else { start = Number(match[1]); end = match[2] ? Math.min(Number(match[2]), file.length - 1) : file.length - 1; }
      }
      if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < 0 || start >= file.length || end < start) {
        response.writeHead(416, { ...fileHeaders, 'Content-Length': 0, 'Content-Range': `bytes */${file.length}` }); response.end(); return;
      }
      response.writeHead(206, { ...fileHeaders, 'Content-Length': end - start + 1, 'Content-Range': `bytes ${start}-${end}/${file.length}` });
      response.end(file.subarray(start, end + 1)); return;
    }
    response.writeHead(200, fileHeaders);
    response.end(request.method === 'HEAD' ? undefined : file);
  } catch { response.writeHead(500, headers); response.end('Unable to read built page'); }
});
server.on('error', error => { console.error(error.message); process.exitCode = 1; });
server.listen(port, '127.0.0.1', () => console.log(`Local: http://127.0.0.1:${server.address().port}`));
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close(() => process.exit(0)));
