#!/usr/bin/env node
/**
 * Writes COPY-REVIEW.md: every editable string on the site, in one file.
 *
 *   node copy-review.mjs
 *
 * Edit the text under any heading, send it back, and it can be applied to the
 * matching content file. Generated from content/, so it is never out of date.
 */
import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const CONTENT = path.join(ROOT, 'content');

const read = async (p) => JSON.parse(await readFile(path.join(CONTENT, p), 'utf8'));
const collection = async (dir) => {
  const files = (await readdir(path.join(CONTENT, dir))).filter((f) => f.endsWith('.json'));
  const out = [];
  for (const f of files) out.push(await read(path.join(dir, f)));
  return out.sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
};

const block = (label, field, value) =>
  `### ${label}\n\`${field}\`\n\n${String(value ?? '').trim() || '_(empty)_'}\n\n`;

const site = await read('site.json');
const press = await read('press.json');
const games = await collection('games');
const posts = (await collection('posts')).sort((a, b) => String(b.date).localeCompare(String(a.date)));
const team = await collection('team');

let md = `# Copy review — every word on the site

Generated from \`content/\` by \`node copy-review.mjs\`. Edit the text under any
heading and send this file back, or edit the matching field directly at
\`/admin\`. The backtick line under each heading is the field it maps to.

---

## Home

${block('Hero headline, line 1', 'site.json → heroLineOne', site.heroLineOne)}${block('Hero headline, line 2 (red)', 'site.json → heroLineTwo', site.heroLineTwo)}${block('Hero sub-paragraph', 'site.json → heroSub', site.heroSub)}${block('Studio heading', 'site.json → aboutHeading', site.aboutHeading)}${block('Studio paragraph', 'site.json → aboutShort', site.aboutShort)}${block('Team photo caption', 'site.json → teamPhotoCaption', site.teamPhotoCaption)}
---

## Community block (appears on most pages)

${block('Heading', 'site.json → communityHeading', site.communityHeading)}${block('Text', 'site.json → communityBlurb', site.communityBlurb)}${block('Button', 'site.json → communityCtaLabel', site.communityCtaLabel)}
---

## Games index

${block('Intro', 'site.json → gamesIntro', site.gamesIntro)}
---

`;

for (const g of games) {
  md += `## ${g.title}

${block('Genre badge', `games/${g.slug}.json → genre`, g.genre)}${block('Tagline', `games/${g.slug}.json → tagline`, g.tagline)}${block('Card blurb', `games/${g.slug}.json → cardBlurb`, g.cardBlurb)}${block('Hero paragraph', `games/${g.slug}.json → heroPitch`, g.heroPitch)}${block('Full description', `games/${g.slug}.json → body`, g.body)}**At a glance:** ${g.facts.map((f) => `${f.label}: ${f.value}`).join(' · ')}

**Button:** ${g.primaryCta.label} → ${g.primaryCta.url}

**Where to find it:** ${g.links.map((l) => l.label).join(', ')}

---

`;
}

md += `## Studio

${block('Heading', 'site.json → aboutHeading', site.aboutHeading)}${block('Body', 'site.json → aboutLong', site.aboutLong)}### The team
\`content/team/*.json\`

${team.map((p) => `- **${p.name}** — ${p.role}${p.portfolio ? ` · Portfolio: ${p.portfolio}` : ''}${p.linkedin ? ` · LinkedIn: ${p.linkedin}` : ''}`).join('\n')}

---

## Devlog

${block('Heading', 'site.json → devlogHeading', site.devlogHeading)}${block('Intro', 'site.json → devlogIntro', site.devlogIntro)}`;

for (const p of posts) {
  md += `### Post: ${p.title}
\`posts/${p.slug}.json\`

**Summary:** ${p.summary}

${p.body}

---

`;
}

md += `## Contact

${block('Eyebrow', 'site.json → contactEyebrow', site.contactEyebrow)}${block('Heading', 'site.json → contactHeading', site.contactHeading)}${block('Intro', 'site.json → contactBlurb', site.contactBlurb)}
---

## For press & publishers (bottom of Contact)

${block('Boilerplate', 'press.json → boilerplate', press.boilerplate)}${block('Short boilerplate', 'press.json → boilerplateShort', press.boilerplateShort)}**Fast facts:** ${press.facts.map((f) => `${f.label}: ${f.value}`).join(' · ')}

${block('Usage note', 'press.json → usageNote', press.usageNote)}
---

## Global

${block('Tagline (footer, browser tab)', 'site.json → tagline', site.tagline)}${block('Search-result description', 'site.json → descriptor', site.descriptor)}**Email:** ${site.email}

**Links, in order:** ${site.socials.map((s) => s.label).join(' · ')} · Email
`;

await writeFile(path.join(ROOT, 'COPY-REVIEW.md'), md, 'utf8');
console.log(`COPY-REVIEW.md written — ${md.split(/\s+/).length} words`);
