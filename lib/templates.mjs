import { renderMarkdown, escapeHtml as esc, toPlainText } from './markdown.mjs';

/* Alfa Slab One is NOT requested here — it is served from this site (see the
   @font-face in tokens.css). The display face carries the brand on every
   heading, so it must not depend on Google being reachable. Body text still
   comes from Google, where the fallback is the system sans and a failure is
   invisible. Drop Roboto woff2 files in public/assets/fonts/ to remove this
   last third-party request entirely. */
const FONTS =
  'https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&family=Roboto+Condensed:wght@700&display=swap';

/* Four pages. Press used to be its own page and overlapped Contact almost
   entirely, so its fact sheet and boilerplate now live at the bottom of
   Contact instead. */
const NAV = [
  { label: 'Games', href: '/games/' },
  { label: 'Studio', href: '/studio/' },
  { label: 'Devlog', href: '/devlog/' },
  { label: 'Contact', href: '/contact/' },
];

const EXO_STEAM = 'https://store.steampowered.com/app/4587490/EXO/';

const pat = (name) => `--pattern-url: url('/assets/patterns/${name}.svg')`;

/** A full-height pattern divider. Never carries text. */
const band = (name) => `<div class="band" style="${pat(name)}" aria-hidden="true"></div>`;
/** A thin pattern rule that closes a surface. */
const seam = (name) => `<div class="seam" style="${pat(name)}" aria-hidden="true"></div>`;

/* Discord's own mark, verified by rendering it before it shipped. Other
   platform marks are pending: the icon source rate-limited, and an approximated
   brand logo is worse than a text label. */
/* Hand-drawn so a fetch can't silently corrupt the paths (that happened once).
   Globe = website, the LinkedIn "in" square. Both sized by CSS. */
const GLOBE_MARK = `<svg class="imark" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="9.2"/><ellipse cx="12" cy="12" rx="4.1" ry="9.2"/><path d="M2.9 12h18.2M4.7 6.7h14.6M4.7 17.3h14.6"/></svg>`;
const LINKEDIN_MARK = `<svg class="imark" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><rect width="24" height="24" rx="3.4" fill="currentColor"/><circle cx="6.4" cy="6.3" r="1.95" fill="#0E0906"/><rect x="4.55" y="9.5" width="3.7" height="10" fill="#0E0906"/><path d="M10.9 9.5h3.55v1.45c.52-.92 1.66-1.66 3.15-1.66 2.55 0 3.9 1.55 3.9 4.35v5.86h-3.7v-5.3c0-1.3-.5-2.1-1.7-2.1-1 0-1.6.68-1.83 1.4-.08.22-.1.55-.1.9v5.1h-3.7z" fill="#0E0906"/></svg>`;

const DISCORD_MARK =
  '<svg class="btn__icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">' +
  '<path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515a.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914a.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z"/></svg>';

/** Turn a game's theme block into inline custom properties. */
function themeVars(game) {
  const t = game.theme || {};
  const map = {
    '--g-bg': t.bg, '--g-surface': t.surface, '--g-text': t.text, '--g-muted': t.muted,
    '--g-accent': t.accent, '--g-button': t.button, '--g-on-button': t.onButton, '--g-border': t.border,
    '--g-focus': game.coverFocus,
  };
  return Object.entries(map).filter(([, v]) => v).map(([k, v]) => `${k}:${v}`).join(';');
}

/* ---------------------------------------------------------------- layout */

export function layout({ site, title, description, path = '/', image = '', jsonLd = null, content }) {
  const fullTitle = path === '/' ? `${site.studioName} — ${site.tagline}` : `${title} · ${site.studioName}`;
  const desc = description || site.descriptor;
  const base = site.url.replace(/\/$/, '');
  const ogImage = base + (image || '/assets/og-default.png');

  const navHtml = NAV.map(
    (n) => `<a href="${n.href}"${path === n.href || (n.href !== '/' && path.startsWith(n.href)) ? ' aria-current="page"' : ''}>${esc(n.label)}</a>`
  ).join('\n          ');

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<script>document.documentElement.className+=' js';</script>
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(fullTitle)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${esc(base + path)}">
<meta name="theme-color" content="#1A0D07">

<meta property="og:type" content="website">
<meta property="og:site_name" content="${esc(site.studioName)}">
<meta property="og:title" content="${esc(fullTitle)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${esc(base + path)}">
<meta property="og:image" content="${esc(ogImage)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(fullTitle)}">
<meta name="twitter:description" content="${esc(desc)}">
<meta name="twitter:image" content="${esc(ogImage)}">

<link rel="icon" href="/assets/logo/bog-logomark.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/assets/logo/bog-logomark.svg">

<link rel="preload" href="/assets/fonts/alfa-slab-one-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${FONTS}">
<link rel="stylesheet" href="/styles/tokens.css">
<link rel="stylesheet" href="/styles/site.css">
<link rel="alternate" type="application/rss+xml" title="${esc(site.studioName)} devlog" href="/devlog/rss.xml">
${jsonLd ? `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>` : ''}
</head>
<body>
<a class="skip-link" href="#main">Skip to content</a>

<header class="site-header on-ink">
  <div class="wrap site-header__inner">
    <a class="site-header__logo" href="/" aria-label="${esc(site.studioName)} home">
      <img src="/assets/logo/bog-secondary-white-text.svg" alt="${esc(site.studioName)}" width="118" height="48">
    </a>
    <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="primary-nav" aria-label="Menu">
      <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" aria-hidden="true">
        <path d="M3 6h18M3 12h18M3 18h18"/>
      </svg>
    </button>
    <nav class="nav" id="primary-nav" aria-label="Primary">
          ${navHtml}
      <a class="btn btn--primary btn--sm" href="${EXO_STEAM}" target="_blank" rel="noopener noreferrer">Wishlist EXO</a>
    </nav>
  </div>
</header>

<main id="main">
${content}
</main>

${footer(site)}
<script src="/scripts/site.js" defer></script>
</body>
</html>`;
}

function footer(site) {
  const community = site.discordUrl || site.linktreeUrl;
  const instagram = (site.socials.find((s) => /instagram/i.test(s.label)) || {}).url || '#';
  // Everything that isn't already one of the three priority calls to action.
  const rest = site.socials.filter((s) => !/^(instagram|linktree)$/i.test(s.label));

  return `${seam('triangles-colorful')}
<footer class="site-footer on-ink">
  <div class="wrap">
    <div class="site-footer__grid">
      <div>
        <a class="site-footer__logo" href="/" aria-label="${esc(site.studioName)} home">
          <img src="/assets/logo/bog-primary-white-text.svg" alt="${esc(site.studioName)}" width="160" height="115">
        </a>
        <p class="small muted" style="margin-top:var(--s-4);max-width:26ch">${esc(site.tagline)}</p>
      </div>
      <div>
        <h2>Games</h2>
        <ul>
          <li><a href="/games/exo/">EXO</a></li>
          <li><a href="/games/kawaiian-isolation/">Kawai'ian Isolation</a></li>
          <li><a href="/games/burning-out/">Burning Out</a></li>
        </ul>
      </div>
      <div>
        <h2>Studio</h2>
        <ul>
          <li><a href="/studio/">About us</a></li>
          <li><a href="/studio/#team">The team</a></li>
          <li><a href="/devlog/">Devlog</a></li>
          <li><a href="/contact/">Contact &amp; press</a></li>
        </ul>
      </div>
      <div>
        <h2>Follow</h2>
        <div class="follow-ctas">
          <a class="btn btn--primary btn--sm" href="${EXO_STEAM}" target="_blank" rel="noopener noreferrer">Wishlist EXO on Steam</a>
          <a class="btn btn--ghost btn--sm" href="${esc(instagram)}" target="_blank" rel="noopener noreferrer">Follow us on Instagram</a>
          <a class="btn btn--ghost btn--sm" href="${esc(site.linktreeUrl)}" target="_blank" rel="noopener noreferrer">Linktree</a>
        </div>
        <ul class="small" style="margin-top:var(--s-5);display:flex;flex-wrap:wrap;gap:var(--s-2) var(--s-4)">
          ${rest.map((s) => `<li style="margin-top:0"><a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.label)}</a></li>`).join('\n          ')}
          <li style="margin-top:0"><a href="mailto:${esc(site.email)}">Email</a></li>
        </ul>
      </div>
    </div>
    <div class="site-footer__base">
      <p><a href="mailto:${esc(site.email)}">${esc(site.email)}</a></p>
      <p>&copy; ${new Date().getFullYear()} ${esc(site.studioName)}, LLC. All rights reserved.</p>
    </div>
  </div>
</footer>`;
}

/* ------------------------------------------------------------- fragments */

function artPlate(game, label) {
  return `<div class="art-plate" style="${pat(game.pattern || 'flame-black')}" role="img" aria-label="${esc(label)}">
      <img src="/assets/logo/bog-logomark-white.svg" alt="" aria-hidden="true" width="95" height="140">
    </div>`;
}

function gameWordmark(game, cls) {
  return game.logo
    ? `<img class="${cls}" src="${esc(game.logo)}" alt="${esc(game.title)}" loading="lazy" decoding="async">`
    : `<span class="${cls} ${cls}--text">${esc(game.title)}</span>`;
}

function badges(game) {
  const out = [`<span class="badge badge--${game.statusType === 'dev' ? 'dev' : 'out'}">${esc(game.status)}</span>`];
  if (game.price) out.push(`<span class="badge badge--price">${esc(game.price)}</span>`);
  out.push(`<span class="badge badge--genre">${esc(game.genre)}</span>`);
  return out.join('');
}

function gameCard(game, level = 3) {
  return `<article class="gcard reveal" style="${themeVars(game)}">
      <a class="gcard__art" href="/games/${esc(game.slug)}/" tabindex="-1" aria-hidden="true">
        ${game.cover
          ? `<img class="gcard__cover" src="${esc(game.cover)}" alt="" loading="lazy" decoding="async" width="1440" height="480">`
          : artPlate(game, '')}
        <span class="gcard__scrim"></span>
        ${game.mark ? `<img class="gmark" src="${esc(game.mark)}" alt="" aria-hidden="true" loading="lazy">` : ''}
        ${gameWordmark(game, 'gcard__logo')}
      </a>
      <div class="gcard__body">
        <div class="badges">${badges(game)}</div>
        <h${level} class="gcard__title"><a href="/games/${esc(game.slug)}/">${esc(game.title)}</a></h${level}>
        <p class="gcard__blurb">${esc(game.cardBlurb)}</p>
        <div class="gcard__foot">
          <a class="btn btn--game" href="${esc(game.primaryCta.url)}" target="_blank" rel="noopener noreferrer">${esc(game.primaryCta.label)}</a>
          <a class="gcard__more" href="/games/${esc(game.slug)}/">More on ${esc(game.title)}</a>
        </div>
      </div>
    </article>`;
}

function communitySection(site) {
  const url = site.discordUrl || site.linktreeUrl;
  const label = site.communityCtaLabel || 'Join our Discord';
  return `${band('triangles-colorful')}
<section class="section on-peach">
  <div class="wrap center">
    <div class="section-head measure">
      <span class="eyebrow">Community</span>
      <h2>${esc(site.communityHeading)}</h2>
      <p class="lead" style="margin-top:var(--s-4)">${esc(site.communityBlurb)}</p>
    </div>
    <div class="cluster" style="justify-content:center">
      <a class="btn btn--primary btn--lg" href="${esc(url)}" target="_blank" rel="noopener noreferrer">${DISCORD_MARK}${esc(label)}</a>
    </div>
  </div>
</section>`;
}

/* ----------------------------------------------------------------- pages */

export function homePage({ site, games, team }) {
  const featured = games.find((g) => g.featured) || games[0];
  const jsonLd = {
    '@context': 'https://schema.org', '@type': 'Organization',
    name: site.studioName, url: site.url, email: site.email,
    foundingDate: site.founded, description: site.descriptor,
    logo: `${site.url.replace(/\/$/, '')}/assets/logo/bog-primary.svg`,
    sameAs: site.socials.map((s) => s.url),
  };

  const content = `
<section class="hero">
  <span class="hero__strip" aria-hidden="true"></span>
  <span class="hero__veil" aria-hidden="true"></span>
  <img class="hero__mark" src="/assets/logo/bog-logomark-white.svg" alt="" aria-hidden="true">
  <div class="wrap hero__inner">
    <h1 class="hero__title">${esc(site.heroLineOne)} <span class="flare">${esc(site.heroLineTwo)}</span></h1>
    <p class="hero__sub">${esc(site.heroSub)}</p>
    <div class="cluster hero__actions">
      <a class="btn btn--primary btn--lg" href="${EXO_STEAM}" target="_blank" rel="noopener noreferrer">Wishlist EXO on Steam</a>
      <a class="btn btn--ghost btn--lg" href="${esc(site.discordUrl || site.linktreeUrl)}" target="_blank" rel="noopener noreferrer">${DISCORD_MARK}Join our Discord</a>
      <a class="btn btn--ghost btn--lg" href="/games/">Our games</a>
    </div>
  </div>
</section>

<section class="showcase" style="${themeVars(featured)}">
  ${featured.cover ? `<img class="showcase__art" src="${esc(featured.cover)}" alt="" aria-hidden="true" loading="lazy">` : ''}
  <span class="showcase__veil" aria-hidden="true"></span>
  <div class="wrap showcase__inner">
    <div class="showcase__copy">
      <span class="eyebrow">Now in development</span>
      <h2 class="showcase__title">${gameWordmark(featured, 'showcase__logo')}</h2>
      <p class="showcase__tagline">${esc(featured.tagline)}</p>
      <p>${esc(featured.heroPitch)}</p>
      <div class="cluster" style="margin-top:var(--s-6)">
        <a class="btn btn--game btn--lg" href="${esc(featured.primaryCta.url)}" target="_blank" rel="noopener noreferrer">${esc(featured.primaryCta.label)}</a>
        <a class="btn btn--game-ghost btn--lg" href="/games/${esc(featured.slug)}/">More on ${esc(featured.title)}</a>
      </div>
    </div>
    ${featured.mark ? `<img class="showcase__mark" src="${esc(featured.mark)}" alt="" aria-hidden="true" loading="lazy">` : ''}
  </div>
</section>

${band('pixels-dark')}

<section class="section on-firewood">
  <div class="wrap">
    <div class="grid grid--2" style="gap:var(--s-8);align-items:center">
      <div>
        <span class="eyebrow">The studio</span>
        <h2>${esc(site.aboutHeading || 'We game')}</h2>
        <p class="lead" style="margin-top:var(--s-5)">${esc(site.aboutShort)}</p>
        <div class="cluster" style="margin-top:var(--s-6)">
          <a class="btn btn--ghost" href="/studio/">Meet the team</a>
        </div>
      </div>
      <figure class="figure figure--crop">
        <img src="/assets/team/team-photo.jpg" alt="The Burnt Out Games team and EXO contributors at a Riot Games event" width="1800" height="1200" loading="lazy" decoding="async">
        <figcaption class="small muted">${esc(site.teamPhotoCaption || '')}</figcaption>
      </figure>
    </div>
  </div>
</section>

${communitySection(site)}
`;
  return layout({ site, title: 'Home', description: site.descriptor, path: '/', jsonLd, content });
}

export function gamesIndexPage({ site, games }) {
  const content = `
<section class="section section--tight on-ink">
  <div class="wrap">
    <span class="eyebrow">Burnt Out Games</span>
    <h1>The games</h1>
    <p class="lead measure" style="margin-top:var(--s-4)">${esc(site.gamesIntro || site.aboutShort)}</p>
  </div>
</section>
${band('pixels-dark')}

<section class="section on-peach">
  <div class="wrap">
    <h2 class="visually-hidden">All games</h2>
    <div class="grid grid--2">
      ${games.map((g) => gameCard(g, 3)).join('\n      ')}
    </div>
  </div>
</section>

${communitySection(site)}
`;
  return layout({
    site, title: 'Games',
    description: `Every game from ${site.studioName}: EXO, Kawai'ian Isolation and Burning Out.`,
    path: '/games/', content,
  });
}

export function gamePage({ site, game }) {
  const jsonLd = {
    '@context': 'https://schema.org', '@type': 'VideoGame',
    name: game.title, description: game.tagline, genre: game.genre, gamePlatform: 'PC',
    author: { '@type': 'Organization', name: site.studioName, url: site.url },
    publisher: { '@type': 'Organization', name: site.studioName, url: site.url },
    url: `${site.url.replace(/\/$/, '')}/games/${game.slug}/`,
  };
  const shots = (game.screenshots || []).filter(Boolean);

  const content = `
<div class="game" style="${themeVars(game)}">

<section class="ghero">
  ${game.cover ? `<img class="ghero__art" src="${esc(game.cover)}" alt="" aria-hidden="true" fetchpriority="high">` : ''}
  <span class="ghero__veil" aria-hidden="true"></span>
  ${game.mark ? `<img class="gmark" src="${esc(game.mark)}" alt="" aria-hidden="true">` : ''}
  <div class="wrap ghero__inner">
    <div class="badges">${badges(game)}</div>
    <h1 class="ghero__title">${gameWordmark(game, 'ghero__logo')}</h1>
    <p class="ghero__tagline">${esc(game.tagline)}</p>
    <p class="ghero__pitch">${esc(game.heroPitch)}</p>
    <div class="cluster" style="margin-top:var(--s-6)">
      <a class="btn btn--game btn--lg" href="${esc(game.primaryCta.url)}" target="_blank" rel="noopener noreferrer">${esc(game.primaryCta.label)}</a>
    </div>
  </div>
</section>

<section class="gbody">
  <div class="wrap game-layout">
    <div class="prose">${renderMarkdown(game.body)}</div>
    <aside class="gpanel">
      <h2 class="gpanel__head">At a glance</h2>
      <dl class="game-facts">
        ${game.facts.map((f) => `<div><dt>${esc(f.label)}</dt><dd>${esc(f.value)}</dd></div>`).join('\n        ')}
      </dl>
      <div class="gpanel__links">
        <h3>Where to find it</h3>
        <ul>
          ${game.links.map((l) => `<li><a href="${esc(l.url)}" target="_blank" rel="noopener noreferrer">${esc(l.label)}</a></li>`).join('\n          ')}
        </ul>
      </div>
    </aside>
  </div>
</section>

${shots.length ? `<section class="gshots">
  <div class="wrap">
    <h2 class="gshots__head">Screens</h2>
    <div class="shot-grid">
      ${shots.map((s, n) => `<img src="${esc(s)}" alt="${esc(game.title)} screenshot ${n + 1}" loading="lazy" decoding="async" width="1400" height="1078">`).join('\n      ')}
    </div>
  </div>
</section>` : ''}

</div>

${communitySection(site)}
`;
  return layout({
    site, title: game.title,
    description: `${game.title}. ${game.tagline} ${game.cardBlurb}`.slice(0, 300),
    path: `/games/${game.slug}/`, image: game.cover || '', jsonLd, content,
  });
}

export function studioPage({ site, team, games }) {
  const content = `
<figure class="team-hero on-ink">
  <img class="band-photo" src="/assets/team/team-photo.jpg" alt="The Burnt Out Games team and EXO contributors at a Riot Games event" width="1800" height="1200" fetchpriority="high">
  <figcaption class="team-hero__cap wrap">${esc(site.teamPhotoCaption || '')}</figcaption>
</figure>
${seam('triangles-colorful')}

<section class="section on-ink">
  <div class="wrap">
    <span class="eyebrow">The studio</span>
    <h1>${esc(site.aboutHeading || 'We game')}</h1>
    <div class="prose lead" style="margin-top:var(--s-5)">${renderMarkdown(site.aboutLong)}</div>
  </div>
</section>
${band('flame-black')}

${team.length ? `<section class="section on-firewood" id="team">
  <div class="wrap">
    <div class="section-head"><span class="eyebrow">The team</span><h2>Meet the team</h2></div>
    <ul class="team-grid">
      ${team.map((p) => {
        // Name splits onto two lines the way the old site set it: given name
        // over family name. Everything after the first word is the second line.
        const parts = String(p.name).trim().split(/\s+/);
        const first = parts.shift();
        const rest = parts.join(' ');
        return `<li class="person reveal">
        <div class="person__photo">${p.photo
          ? `<img src="${esc(p.photo)}" alt="${esc(p.name)}" width="560" height="700" loading="lazy" decoding="async">`
          : `<div class="art-plate" style="${pat('spark-colorful')}"><img src="/assets/logo/bog-logomark-white.svg" alt="" aria-hidden="true"></div>`}</div>
        <span class="person__fade" aria-hidden="true"></span>
        <div class="person__body">
          <p class="person__name"><span>${esc(first)}</span>${rest ? `<span>${esc(rest)}</span>` : ''}</p>
          <div class="person__meta">
          <p class="person__links">${[
            p.website ? `<a href="${esc(p.website)}" target="_blank" rel="noopener noreferrer" aria-label="${esc(p.name)} — website">${GLOBE_MARK}</a>` : '',
            p.linkedin ? `<a href="${esc(p.linkedin)}" target="_blank" rel="noopener noreferrer" aria-label="${esc(p.name)} — LinkedIn">${LINKEDIN_MARK}</a>` : '',
          ].filter(Boolean).join('')}</p>
          <p class="person__role">${esc(p.role)}</p>
          </div>
        </div>
      </li>`;
      }).join('\n      ')}
    </ul>
  </div>
</section>` : ''}

<section class="section on-peach">
  <div class="wrap">
    <div class="section-head"><span class="eyebrow">Track record</span><h2>What we've shipped</h2></div>
    <div class="table-scroll">
      <table class="fact-table">
        <caption class="visually-hidden">Games released and in development by ${esc(site.studioName)}</caption>
        <thead><tr><th scope="col">Title</th><th scope="col">Genre</th><th scope="col">Status</th></tr></thead>
        <tbody>
          ${games.map((g) => `<tr><td><a href="/games/${esc(g.slug)}/">${esc(g.title)}</a></td><td>${esc(g.genre)}</td><td>${esc(g.status)}${g.price ? ` (${esc(g.price)})` : ''}</td></tr>`).join('\n          ')}
        </tbody>
      </table>
    </div>
  </div>
</section>

${communitySection(site)}
`;
  return layout({
    site, title: 'Studio',
    description: `About ${site.studioName}, an independent studio founded in ${site.founded}, and the ${team.length} people who build the games.`,
    path: '/studio/', image: '/assets/team/team-photo.jpg', content,
  });
}

export function devlogIndexPage({ site, posts }) {
  const content = `
<section class="section section--tight on-ink">
  <div class="wrap">
    <span class="eyebrow">Devlog</span>
    <h1>${esc(site.devlogHeading || 'What we\'re working on')}</h1>
    <p class="lead measure" style="margin-top:var(--s-4)">${esc(site.devlogIntro || '')}</p>
  </div>
</section>
${band('spark-colorful')}

<section class="section on-peach">
  <div class="wrap">
    ${posts.length ? `<h2 class="visually-hidden">All posts</h2>
    <div class="grid grid--3">
      ${posts.map((p) => `<article class="card reveal">
        ${p.cover ? `<div class="card__media"><img src="${esc(p.cover)}" alt="" loading="lazy" width="1280" height="720"></div>` : ''}
        <div class="card__body">
          <p class="eyebrow">${esc(formatDate(p.date))}</p>
          <h3 class="card__title"><a href="/devlog/${esc(p.slug)}/">${esc(p.title)}</a></h3>
          <p>${esc(p.summary || toPlainText(p.body, 160))}</p>
          <div class="card__foot"><a href="/devlog/${esc(p.slug)}/">Read it</a></div>
        </div>
      </article>`).join('\n      ')}
    </div>`
      : `<p class="lead">Nothing posted yet. Follow along on <a href="${esc(site.socials[0].url)}" target="_blank" rel="noopener noreferrer">${esc(site.socials[0].label)}</a> in the meantime.</p>`}
  </div>
</section>
`;
  return layout({ site, title: 'Devlog', description: site.devlogIntro || `Development notes from ${site.studioName}.`, path: '/devlog/', content });
}

export function postPage({ site, post }) {
  const jsonLd = {
    '@context': 'https://schema.org', '@type': 'BlogPosting',
    headline: post.title, datePublished: post.date,
    author: { '@type': 'Organization', name: post.author || site.studioName },
    publisher: { '@type': 'Organization', name: site.studioName },
    description: post.summary || toPlainText(post.body, 160),
    mainEntityOfPage: `${site.url.replace(/\/$/, '')}/devlog/${post.slug}/`,
  };
  const content = `
<section class="section section--tight on-ink">
  <div class="wrap">
    <p class="eyebrow"><a href="/devlog/" style="color:inherit">Devlog</a> &nbsp;<time datetime="${esc(post.date)}">${esc(formatDate(post.date))}</time></p>
    <h1>${esc(post.title)}</h1>
    ${post.summary ? `<p class="lead measure" style="margin-top:var(--s-4)">${esc(post.summary)}</p>` : ''}
  </div>
</section>
${seam('spark-colorful')}

<article class="section on-peach">
  <div class="wrap">
    ${post.cover ? `<img src="${esc(post.cover)}" alt="" style="border-radius:var(--r-md);margin-bottom:var(--s-7)" width="1280" height="720">` : ''}
    <div class="prose">${renderMarkdown(post.body)}</div>
    <p style="margin-top:var(--s-8)"><a href="/devlog/">All devlog posts</a></p>
  </div>
</article>

${communitySection(site)}
`;
  return layout({ site, title: post.title, description: post.summary || toPlainText(post.body, 160), path: `/devlog/${post.slug}/`, image: post.cover || '', jsonLd, content });
}

/* Contact absorbed the press page: same contact details, same boilerplate, one
   destination instead of two nearly identical ones. No downloadable assets. */
export function contactPage({ site, press }) {
  const community = site.discordUrl || site.linktreeUrl;
  const content = `
<section class="section section--tight on-ink">
  <div class="wrap">
    <span class="eyebrow">${esc(site.contactEyebrow || 'Say hi')}</span>
    <h1>${esc(site.contactHeading || 'Contact')}</h1>
    <p class="lead measure" style="margin-top:var(--s-4)">${esc(site.contactBlurb || '')}</p>
  </div>
</section>
${band('flame-black')}

<section class="section on-peach">
  <div class="wrap">
    <div class="grid grid--2" style="gap:var(--s-8);align-items:start">
      <div>
        <h2>Send us a message</h2>
        <form class="form" id="contact-form" method="POST" action="/api/contact" style="margin-top:var(--s-5)">
          <div class="field">
            <label for="cf-name">Your name</label>
            <input id="cf-name" name="name" type="text" required autocomplete="name" maxlength="120">
          </div>
          <div class="field">
            <label for="cf-email">Email</label>
            <input id="cf-email" name="email" type="email" required autocomplete="email" maxlength="200">
          </div>
          <div class="field">
            <label for="cf-topic">What's this about?</label>
            <select id="cf-topic" name="topic">
              <option>Just saying hi</option>
              <option>Feedback</option>
              <option>Press</option>
              <option>Publishing</option>
              <option>Playtesting</option>
              <option>Feedback</option>
            </select>
          </div>
          <div class="field">
            <label for="cf-message">Message</label>
            <textarea id="cf-message" name="message" required maxlength="4000"></textarea>
          </div>
          <div class="field field--hp" aria-hidden="true">
            <label for="cf-company">Leave this empty</label>
            <input id="cf-company" name="company" type="text" tabindex="-1" autocomplete="off">
          </div>
          <div class="cluster">
            <button class="btn btn--primary" type="submit">Send it</button>
            <p class="form__status" id="cf-status" role="status" aria-live="polite"></p>
          </div>
          <p class="form__note">Goes straight to ${esc(site.email)}. We read all of it.</p>
        </form>
      </div>

      <div class="copy-block stack-sm">
        <h2 class="fact-title">Find us elsewhere</h2>
        <ul class="link-list">
          ${site.socials.map((s) => `<li><a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.label)}</a></li>`).join('\n          ')}
        </ul>
        <p class="small muted" style="margin-top:var(--s-4)">Prefer email? <a href="mailto:${esc(site.email)}">${esc(site.email)}</a></p>
      </div>
    </div>
  </div>
</section>
${band('zigzag-black')}

<section class="section on-firewood" id="press">
  <div class="wrap stack-lg">
    <div class="section-head"><span class="eyebrow">For press &amp; publishers</span><h2>The short version</h2></div>

    <div class="copy-block">
      <p class="eyebrow">Boilerplate, ${press.boilerplate.split(/\s+/).length} words</p>
      <p>${esc(press.boilerplate)}</p>
    </div>

    <div class="table-scroll">
      <table class="fact-table">
        <caption class="visually-hidden">Studio fact sheet</caption>
        <tbody>
          ${press.facts.map((f) => `<tr><th scope="row">${esc(f.label)}</th><td>${esc(f.value)}</td></tr>`).join('\n          ')}
        </tbody>
      </table>
    </div>

    <p class="measure">${esc(press.usageNote)}</p>
  </div>
</section>
`;
  return layout({
    site, title: 'Contact',
    description: `Contact ${site.studioName} for press, publishing and playtests.`,
    path: '/contact/', content,
  });
}

export function notFoundPage({ site }) {
  const content = `
<section class="hero" style="text-align:center">
  <span class="hero__strip" aria-hidden="true"></span>
  <span class="hero__veil" aria-hidden="true"></span>
  <div class="wrap hero__inner">
    <h1 class="hero__title">Nothing <span class="flare">here.</span></h1>
    <p class="hero__sub" style="margin-inline:auto">This page doesn't exist. The rest of the site is very much on.</p>
    <div class="cluster hero__actions" style="justify-content:center">
      <a class="btn btn--primary btn--lg" href="/">Back to the front</a>
      <a class="btn btn--ghost btn--lg" href="/games/">See the games</a>
    </div>
  </div>
</section>`;
  return layout({ site, title: 'Page not found', description: 'Page not found.', path: '/404.html', content });
}

/* ---------------------------------------------------------------- helpers */

export function formatDate(iso) {
  const d = new Date(iso + (iso.length === 10 ? 'T12:00:00Z' : ''));
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
}
