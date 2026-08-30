#!/usr/bin/env node
/**
 * One-off: fold whatever link field a team file happens to carry into the two
 * the site now reads.
 *
 *   node normalize-team-links.mjs
 *
 * The deployed /admin was still running the old single "url" field when the
 * team's links were entered, so the real URLs live under `url` (and older files
 * used `website`). This maps any of them to `portfolio`, keeps `linkedin`, and
 * drops the dead keys. Safe to run twice.
 */
import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const DIR = 'content/team';
const ORDER = ['name', 'role', 'order', 'bio', 'photo', 'portfolio', 'linkedin'];

for (const f of (await readdir(DIR)).filter((n) => n.endsWith('.json'))) {
  const p = path.join(DIR, f);
  const d = JSON.parse(await readFile(p, 'utf8'));
  const portfolio = [d.portfolio, d.url, d.website].find((v) => v && v.trim()) || '';
  const next = { ...d, portfolio, linkedin: d.linkedin || '' };
  delete next.url;
  delete next.website;
  const out = {};
  for (const k of ORDER) if (k in next) out[k] = next[k];
  for (const k of Object.keys(next)) if (!(k in out)) out[k] = next[k];
  await writeFile(p, JSON.stringify(out, null, 2) + '\n');
  console.log(`${f.padEnd(24)} portfolio=${portfolio || '—'}  linkedin=${out.linkedin || '—'}`);
}
