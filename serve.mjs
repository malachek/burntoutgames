#!/usr/bin/env node
/**
 * Tiny preview server for dist/.  No dependencies.
 *
 *   node serve.mjs            -> http://localhost:4321
 *   node serve.mjs 8080       -> http://localhost:8080
 */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIST = path.join(path.dirname(fileURLToPath(import.meta.url)), 'dist');
const PORT = Number(process.argv[2]) || 4321;

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp', '.gif': 'image/gif', '.ico': 'image/x-icon', '.xml': 'application/xml',
  '.txt': 'text/plain; charset=utf-8', '.woff2': 'font/woff2', '.zip': 'application/zip',
  '.pdf': 'application/pdf', '.mp4': 'video/mp4', '.webm': 'video/webm', '.yml': 'text/yaml',
};

async function resolve(urlPath) {
  const clean = decodeURIComponent(urlPath.split('?')[0]);
  const rel = path.normalize(clean).replace(/^(\.\.[/\\])+/, '');
  let file = path.join(DIST, rel);
  try {
    if ((await stat(file)).isDirectory()) file = path.join(file, 'index.html');
    return file;
  } catch {
    if (!path.extname(file)) {
      const alt = path.join(file, 'index.html');
      try { await stat(alt); return alt; } catch { /* fall through */ }
    }
    return null;
  }
}

createServer(async (req, res) => {
  const file = await resolve(req.url || '/');
  if (!file) {
    try {
      const body = await readFile(path.join(DIST, '404.html'));
      res.writeHead(404, { 'Content-Type': TYPES['.html'] }).end(body);
    } catch {
      res.writeHead(404).end('Not found');
    }
    return;
  }
  try {
    const body = await readFile(file);
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' }).end(body);
  } catch {
    res.writeHead(500).end('Server error');
  }
}).listen(PORT, () => console.log(`\n  Preview running at http://localhost:${PORT}\n  Ctrl-C to stop.\n`));
