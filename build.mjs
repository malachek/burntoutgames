#!/usr/bin/env node
/**
 * Burnt Out Games — static site build.
 *
 *   node build.mjs
 *
 * Reads JSON from content/, copies everything in public/, and writes a complete
 * static site into dist/. No dependencies, no install step, no lockfile.
 * Node 18 or newer is the only requirement.
 */

import { readFile, readdir, mkdir, writeFile, copyFile, rm, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

import {
  homePage, gamesIndexPage, gamePage, studioPage,
  devlogIndexPage, postPage, contactPage, notFoundPage,
} from './lib/templates.mjs';
import { toPlainText, escapeHtml } from './lib/markdown.mjs';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const CONTENT = path.join(ROOT, 'content');
const PUBLIC = path.join(ROOT, 'public');
const DIST = path.join(ROOT, 'dist');

const log = (...a) => console.log('  ', ...a);

/* ------------------------------------------------------------------ utils */

async function readJson(file) {
  try {
    return JSON.parse(await readFile(file, 'utf8'));
  } catch (err) {
    throw new Error(`Could not read ${path.relative(ROOT, file)}\n     ${err.message}`);
  }
}

async function readCollection(dir) {
  const full = path.join(CONTENT, dir);
  if (!existsSync(full)) return [];
  const files = (await readdir(full)).filter((f) => f.endsWith('.json'));
  const items = [];
  for (const f of files) {
    const data = await readJson(path.join(full, f));
    if (!data.slug) data.slug = f.replace(/\.json$/, '');
    items.push(data);
  }
  return items;
}

async function copyDir(src, dest) {
  await mkdir(dest, { recursive: true });
  for (const entry of await readdir(src, { withFileTypes: true })) {
    if (entry.name === '.DS_Store') continue;
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) await copyDir(s, d);
    else await copyFile(s, d);
  }
}

async function writePage(routePath, html) {
  const out =
    routePath === '/404.html'
      ? path.join(DIST, '404.html')
      : path.join(DIST, routePath.replace(/^\//, ''), 'index.html');
  await mkdir(path.dirname(out), { recursive: true });
  await writeFile(out, html, 'utf8');
  return out;
}

/* ------------------------------------------------------------- validation */

function validate(site, games, posts) {
  const problems = [];
  const need = (obj, keys, where) =>
    keys.forEach((k) => {
      if (obj[k] === undefined || obj[k] === null || obj[k] === '') problems.push(`${where}: missing "${k}"`);
    });

  need(site, ['studioName', 'url', 'email', 'tagline', 'descriptor'], 'content/site.json');

  const slugs = new Set();
  for (const g of games) {
    const where = `content/games/${g.slug}.json`;
    need(g, ['title', 'slug', 'status', 'genre', 'tagline', 'cardBlurb', 'body'], where);
    if (!g.primaryCta?.url) problems.push(`${where}: missing "primaryCta.url"`);
    if (slugs.has(g.slug)) problems.push(`${where}: duplicate slug "${g.slug}"`);
    slugs.add(g.slug);
  }

  const postSlugs = new Set();
  for (const p of posts) {
    const where = `content/posts/${p.slug}.json`;
    need(p, ['title', 'date', 'body'], where);
    if (!/^\d{4}-\d{2}-\d{2}/.test(p.date || '')) problems.push(`${where}: date must be YYYY-MM-DD`);
    if (postSlugs.has(p.slug)) problems.push(`${where}: duplicate slug "${p.slug}"`);
    postSlugs.add(p.slug);
  }
  return problems;
}

/* ------------------------------------------------------------------ feeds */

function sitemap(site, routes) {
  const base = site.url.replace(/\/$/, '');
  const today = new Date().toISOString().slice(0, 10);
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes
  .filter((r) => r !== '/404.html')
  .map((r) => `  <url><loc>${base}${r}</loc><lastmod>${today}</lastmod></url>`)
  .join('\n')}
</urlset>
`;
}

function rss(site, posts) {
  const base = site.url.replace(/\/$/, '');
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel>
  <title>${escapeHtml(site.studioName)} — Devlog</title>
  <link>${base}/devlog/</link>
  <description>${escapeHtml(site.descriptor)}</description>
  <language>en</language>
${posts
  .map(
    (p) => `  <item>
    <title>${escapeHtml(p.title)}</title>
    <link>${base}/devlog/${p.slug}/</link>
    <guid>${base}/devlog/${p.slug}/</guid>
    <pubDate>${new Date(p.date + 'T12:00:00Z').toUTCString()}</pubDate>
    <description>${escapeHtml(p.summary || toPlainText(p.body, 240))}</description>
  </item>`
  )
  .join('\n')}
</channel></rss>
`;
}

/* ------------------------------------------------------------------ build */

async function build() {
  const t0 = Date.now();
  console.log('\nBurnt Out Games — building site\n');

  const site = await readJson(path.join(CONTENT, 'site.json'));
  const press = await readJson(path.join(CONTENT, 'press.json'));
  const games = (await readCollection('games')).sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
  const team = (await readCollection('team')).sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
  const posts = (await readCollection('posts'))
    .filter((p) => !p.draft)
    .sort((a, b) => String(b.date).localeCompare(String(a.date)));

  const problems = validate(site, games, posts);
  if (problems.length) {
    console.error('\n  Build stopped. Fix these in the content files:\n');
    problems.forEach((p) => console.error('   - ' + p));
    console.error('');
    process.exit(1);
  }

  // Some environments (a synced folder, a read-only mount) don't allow deleting
  // files. Clearing dist/ is a convenience, not a requirement: every file the
  // build produces is written fresh below, so a failed clean is a warning.
  try {
    await rm(DIST, { recursive: true, force: true });
  } catch {
    log('note: could not clear dist/ (no delete permission here). Files will be overwritten in place.');
  }
  await mkdir(DIST, { recursive: true });

  if (existsSync(PUBLIC)) {
    await copyDir(PUBLIC, DIST);
    log('copied public/');
  }

  // Cloudflare Pages compiles functions/ from the REPO ROOT, not from the build
  // output, so there is nothing to copy. Just confirm it is there.
  if (existsSync(path.join(ROOT, 'functions'))) {
    log('functions/ present — Cloudflare will build /api/contact from it');
  }

  // ---- Cache busting -----------------------------------------------------
  // Every deploy writes the same /styles/site.css path. With a long
  // Cache-Control that means the CDN keeps serving the PREVIOUS deploy's file
  // until the TTL expires — the page updates, the stylesheet does not, and the
  // site renders with old CSS. Hashing the filename makes each build a new URL,
  // so "immutable" is finally true and a deploy is picked up immediately.
  const fingerprint = async (rel) => {
    const abs = path.join(DIST, rel);
    if (!existsSync(abs)) return null;
    const buf = await readFile(abs);
    const hash = createHash('sha256').update(buf).digest('hex').slice(0, 10);
    const ext = path.extname(rel);
    const hashed = rel.slice(0, -ext.length) + '.' + hash + ext;
    await writeFile(path.join(DIST, hashed), buf);
    return ['/' + rel, '/' + hashed];
  };

  const assetMap = (
    await Promise.all(['styles/tokens.css', 'styles/site.css', 'scripts/site.js'].map(fingerprint))
  ).filter(Boolean);
  for (const [from, to] of assetMap) log(`hashed ${from} -> ${to}`);

  const bust = (html) => {
    let out = html;
    for (const [from, to] of assetMap) out = out.split(from + '"').join(to + '"');
    return out;
  };

  const routes = [];
  const emit = async (route, html) => {
    await writePage(route, bust(html));
    routes.push(route);
  };

  await emit("/", homePage({ site, games, team }));
  await emit('/games/', gamesIndexPage({ site, games }));
  for (const game of games) await emit(`/games/${game.slug}/`, gamePage({ site, game }));
  await emit('/team/', studioPage({ site, team, games }));
  await emit('/devlog/', devlogIndexPage({ site, posts }));
  for (const post of posts) await emit(`/devlog/${post.slug}/`, postPage({ site, post }));
  await emit('/contact/', contactPage({ site, press }));
  await emit('/404.html', notFoundPage({ site }));

  await writeFile(path.join(DIST, 'sitemap.xml'), sitemap(site, routes), 'utf8');
  await mkdir(path.join(DIST, 'devlog'), { recursive: true });
  await writeFile(path.join(DIST, 'devlog', 'rss.xml'), rss(site, posts), 'utf8');
  await writeFile(
    path.join(DIST, 'robots.txt'),
    `User-agent: *\nAllow: /\n\nSitemap: ${site.url.replace(/\/$/, '')}/sitemap.xml\n`,
    'utf8'
  );
  await writeFile(path.join(DIST, '_headers'), HEADERS, 'utf8');

  let bytes = 0;
  const walk = async (dir) => {
    for (const e of await readdir(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) await walk(p);
      else bytes += (await stat(p)).size;
    }
  };
  await walk(DIST);

  log(`${routes.length} pages · ${games.length} games · ${posts.length} devlog posts · ${team.length} team members`);
  log(`dist/ is ${(bytes / 1024 / 1024).toFixed(2)} MB`);
  console.log(`\nDone in ${Date.now() - t0}ms. Open dist/index.html, or run: node serve.mjs\n`);
}

const HEADERS = `/*
  X-Frame-Options: SAMEORIGIN
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: geolocation=(), microphone=(), camera=()
  Cache-Control: public, max-age=0, must-revalidate

/styles/*
  Cache-Control: public, max-age=31536000, immutable

/scripts/*
  Cache-Control: public, max-age=31536000, immutable

/assets/fonts/*
  Cache-Control: public, max-age=31536000, immutable

/assets/*
  Cache-Control: public, max-age=86400
`;

build().catch((err) => {
  console.error('\n  Build failed:\n  ' + err.message + '\n');
  process.exit(1);
});
