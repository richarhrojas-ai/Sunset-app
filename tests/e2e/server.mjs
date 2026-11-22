// Servidor local para las pruebas de navegador: sirve public/ y responde /api/sync y /api/content
// con las mismas funciones de Netlify, guardando el progreso en memoria. Clave de prueba: clave123.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { handle } from '../../netlify/functions/sync.mjs';
import { handleContent } from '../../netlify/functions/content.mjs';
import { memoryStore } from '../helpers/memory-store.mjs';

export const KEY = 'clave123';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../public');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.webp': 'image/webp', '.png': 'image/png', '.json': 'application/json', '.webmanifest': 'application/manifest+json' };

export function start() {
  const store = memoryStore();
  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, 'http://localhost');
    if (url.pathname.startsWith('/api/')) {
      const body = ['GET', 'HEAD'].includes(req.method) ? undefined : await new Promise((r) => { let s = ''; req.on('data', (c) => { s += c; }); req.on('end', () => r(s)); });
      const rq = new Request(url, { method: req.method, headers: req.headers, body });
      const rs = url.pathname === '/api/sync' ? await handle(rq, store, KEY, 0) : await handleContent(rq, KEY, undefined, 0);
      res.writeHead(rs.status, Object.fromEntries(rs.headers));
      res.end(Buffer.from(await rs.arrayBuffer()));
      return;
    }
    const p = path.join(ROOT, url.pathname === '/' ? 'index.html' : decodeURIComponent(url.pathname));
    if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); res.end('no'); return; }
    res.writeHead(200, { 'content-type': TYPES[path.extname(p)] || 'application/octet-stream', 'cache-control': 'no-store' });
    res.end(fs.readFileSync(p));
  });
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => {
    resolve({ url: 'http://127.0.0.1:' + server.address().port + '/', close: () => new Promise((r) => server.close(r)) });
  }));
}
