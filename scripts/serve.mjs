import http from 'node:http';
import { readFile } from 'node:fs/promises';
const args = process.argv.slice(2);
if (args.length && !(args.length === 2 && args[0] === '--port')) { console.error('Usage: npm start -- --port 4180'); process.exit(1); }
const port = args.length ? Number(args[1]) : 4180;
if (!Number.isInteger(port) || port < 0 || port > 65535) { console.error('Invalid port'); process.exit(1); }
const routes = new Map([['/', 'index.html'], ...['index.html', 'en.html', 'cuebridge.zh-CN.html', 'cuebridge.en.html'].map(name => [`/${name}`, name])]);
try { await readFile(new URL('../dist/index.html', import.meta.url)); }
catch { console.error('Run npm run build first.'); process.exit(1); }
const server = http.createServer(async (request, response) => {
  const headers = { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer', 'X-Frame-Options': 'DENY' };
  if (!['GET', 'HEAD'].includes(request.method)) { response.writeHead(405, { ...headers, Allow: 'GET, HEAD' }); response.end(); return; }
  let pathname;
  try { pathname = new URL(request.url, 'http://localhost').pathname; }
  catch { response.writeHead(400, headers); response.end(); return; }
  if (pathname === '/favicon.ico') { response.writeHead(204, headers); response.end(); return; }
  const filename = routes.get(pathname);
  if (!filename) { response.writeHead(404, headers); response.end('Not found'); return; }
  try {
    const file = await readFile(new URL(`../dist/${filename}`, import.meta.url));
    response.writeHead(200, { ...headers, 'Content-Type': 'text/html; charset=utf-8', 'Content-Length': file.length });
    response.end(request.method === 'HEAD' ? undefined : file);
  } catch { response.writeHead(500, headers); response.end('Unable to read built page'); }
});
server.on('error', error => { console.error(error.message); process.exitCode = 1; });
server.listen(port, '127.0.0.1', () => console.log(`Local: http://127.0.0.1:${server.address().port}`));
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close(() => process.exit(0)));
