import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const base = path.join(root, 'dist');
try { await stat(path.join(base, 'index.html')); } catch { console.error('No production build found. Run npm run build first, or use a static file server.'); process.exit(1); }
const types = { '.html':'text/html; charset=utf-8', '.css':'text/css; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.json':'application/json; charset=utf-8', '.svg':'image/svg+xml' };
const server = http.createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const requested = path.resolve(base, `.${pathname === '/' ? '/index.html' : pathname}`);
    if (!requested.startsWith(base)) { res.writeHead(403); return res.end('Forbidden'); }
    const data = await readFile(requested);
    res.writeHead(200, { 'Content-Type': types[path.extname(requested)] || 'application/octet-stream', 'Cache-Control':'no-cache' }); res.end(data);
  } catch { res.writeHead(404, { 'Content-Type':'text/plain; charset=utf-8' }); res.end('Not found'); }
});
server.listen(4173, '0.0.0.0', () => console.log('The Last Train Home is running at http://localhost:4173'));
