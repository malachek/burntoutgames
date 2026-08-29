# Burnt Out Games — Web Brand System

The rules the website is built from. Everything here traces back to `references/BOG Brand Guide/`.
If you change a value here, change it in `public/styles/tokens.css` too, since that file is the one
the site actually reads. Voice and copy live in `VOICE-AND-MESSAGING.md`.

---

## 1. Color

### The palette, as given

| Token | Name | Hex | Tier |
|---|---|---|---|
| `--fiery-red` | Fiery Red | `#E34521` | Primary |
| `--firewood` | Firewood | `#532111` | Primary |
| `--warm-peach` | Warm Peach | `#F9CA96` | Primary |
| `--golden-ember` | Golden Ember | `#F59D24` | Secondary |
| `--burnt-orange` | Burnt Orange | `#DB7727` | Secondary |
| `--light-glow` | Light Glow | `#FEF5EB` | Tertiary |
| `--white` | White | `#FFFFFF` | Tertiary |
| `--black` | Black | `#000000` | Tertiary |

**Brand guide rule, carried over verbatim:** every layout must include at least one of Fiery Red,
Firewood, or Warm Peach. Every page on this site does.

### Three colors the guide doesn't have, and why they exist

The print palette has a contrast problem on screen. Fiery Red on Light Glow measures **3.79:1**, and
white on Fiery Red measures **4.09:1** — both below the 4.5:1 that WCAG AA requires for body text.
That is fine on a poster and not fine on a web page, where people read paragraphs and some of them
have low vision. So the system adds three derived colors. All three are the same hue and saturation
as Fiery Red, moved only in lightness — they are the brand red at different temperatures, not new
colors.

| Token | Hex | What it's for | Measured |
|---|---|---|---|
| `--red-deep` | `#B53417` | Button fills, links and small red text on light backgrounds | white on it: **6.05:1** · on Light Glow: **5.62:1** |
| `--red-bright` | `#E8674A` | Red text on dark backgrounds | on Ink: **5.86:1** |
| `--ink` | `#1A0D07` | The dark page background | Light Glow on it: **17.63:1** |
| `--ash` | `#2B1710` | Raised dark surfaces — cards, nav on scroll | Light Glow on it: **15.80:1** |

`--ink` and `--ash` are Firewood taken darker. The guide's layouts use near-black backgrounds
constantly (see *Ad Layout Inspo*, page 7); these give that black a warm cast so it sits in the
family instead of going cold and generic.

### Where each color is allowed

- **Fiery Red `#E34521`** — display type at 32px and above, large shapes, rules and borders, pattern
  fills, focus rings. Never body text. Never a button label's only contrast.
- **`--red-deep`** — every primary button, every inline link on a light background.
- **`--red-bright`** — inline links and accent text on dark backgrounds.
- **Firewood** — body text on light backgrounds (12.22:1). The workhorse reading color.
- **Warm Peach** — body text on dark backgrounds (12.60:1 on Ink). The dark-mode reading color.
- **Golden Ember** — secondary accents, "in development" status pills, hover glows. Passes on dark
  (8.81:1) and on Firewood (6.11:1). Do not put it on Light Glow.
- **Burnt Orange** — gradient midpoints and pattern fills only. It fails against every light
  background (2.92:1 on Light Glow) and must never carry text on one.
- **Light Glow** — the light page background, and body text on dark.

### Contrast rule of thumb

Light section: Firewood text, `--red-deep` links and buttons.
Dark section: Warm Peach or Light Glow text, `--red-bright` links, Fiery Red display type.

---

## 2. Type

The guide specifies **Nexa Rust Slab** for headlines and **Roboto** for body.

**Nexa Rust Slab is a commercial Fontfabric typeface and needs a paid webfont licence to embed on a
site.** Until that licence exists, the site ships with **Alfa Slab One** — a free Google Fonts heavy
slab with the same job: geometric, very heavy, built for uppercase display. It is a stand-in, and it
is marked as one.

**To swap in the real font later**, put the `.woff2` files in `public/assets/fonts/` and change one
line in `public/styles/tokens.css`:

```css
--font-display: 'Nexa Rust Slab', 'Alfa Slab One', Georgia, serif;
```

...plus the matching `@font-face` block. Nothing else in the site needs to change — every headline
reads the variable.

| Token | Family | Used for |
|---|---|---|
| `--font-display` | Alfa Slab One → Nexa Rust Slab | H1–H3, game titles, big numbers |
| `--font-body` | Roboto | All body copy, buttons, nav |
| `--font-label` | Roboto Condensed | Eyebrow labels, tags, metadata — uppercase, tracked out |

### Scale

Fluid, `clamp()`-based, so it works from a 320px phone to a 2560px monitor without breakpoints.

| Step | Mobile → Desktop | Use |
|---|---|---|
| `--fs-display` | 44 → 104px | Homepage H1 only |
| `--fs-h1` | 34 → 64px | Page titles |
| `--fs-h2` | 27 → 42px | Section headings |
| `--fs-h3` | 21 → 27px | Card titles |
| `--fs-lead` | 18 → 22px | Intro paragraphs |
| `--fs-body` | 16 → 17px | Body copy |
| `--fs-small` | 14 → 15px | Captions, footnotes |
| `--fs-label` | 12 → 13px | Eyebrows, tags |

Display type is uppercase with `letter-spacing: -0.01em` and `line-height: 0.95`. Slab faces at
display size need tighter leading than the browser default or the lines drift apart.

Body copy caps at **68 characters** per line (`--measure`). Past that, people lose their place
between lines.

---

## 3. The logo

Three lockups exist and each has one correct use:

- **Primary** (stacked, flame above wordmark) — the footer, the press kit, anywhere it can be large.
  **Never below 72px wide.**
- **Secondary** (horizontal, flame beside wordmark) — the site header. **Never below 108px wide.**
- **Logomark** (flame alone) — favicon, social avatar, watermark, loading states. Only where "Burnt
  Out Games" is already established or irrelevant.

Clear space on all sides equals the height of the flame. On dark backgrounds use the white-text
variants (`-white-text.svg`), never the dark-text ones at reduced opacity.

Do not: recolor it, add effects, rotate it, stretch it, put it on a busy pattern without a solid
plate behind it, or reconstruct the wordmark in a different font.

---

## 4. Patterns

Nine repeatable patterns ship in `public/assets/patterns/`. There is exactly one
correct way to use them on the web, and it took a wrong turn to find it.

**Patterns are dividers, never backgrounds, and never overlays.**

The first build laid them over sections at 8–14% opacity. That washes the pattern
into mud and tints whatever is underneath: a spark pattern over EXO's violet key
art put orange haze across the whole hero. The second attempt ran them at full
strength as section backgrounds, which is legible (the dark patterns' brightest
pixel measures 0.0297 luminance, so Light Glow still reads at 12.2:1 on top) but
turns every paragraph into text on wallpaper.

So: a pattern appears only as a **band**, a full-strength strip between two
sections carrying no text. Saturation is free there, which is why the vivid ones
finally get to be vivid. This is the brand guide's own move, bottom edge of the
peach ad on page 7.

- One band per page transition, at most.
- Vivid patterns (`triangles-colorful`, `pixels-dark`, `spark-colorful`,
  `flame-red`) are band-only. They fail contrast against any text.
- Dark patterns (`flame-black`, `spark-black`, `zigzag-black`, `*-firewood`) work
  as bands too, and read as a quieter seam.
- `.art-plate` is the one exception: a full-strength pattern behind a game's
  logomark when that game has no key art.

**What replaced them.** The work patterns were being asked to do is now done by
actual artwork: the homepage hero is a collage of the three games' key art, and
every game capsule carries its own. That is stronger than texture ever was.

## 5. Layout

- Page max width **1240px**, gutters `clamp(20px, 5vw, 64px)`.
- Long-form text max width **68ch**.
- Vertical rhythm on an 8px base. Section padding `clamp(64px, 9vw, 136px)`.
- Sections alternate light (`--light-glow`) and dark (`--ink`) — the guide's layouts are built on
  exactly this contrast and it keeps a long page from flattening out.
- Corner radius: **4px** on small controls, **12px** on cards, **999px** on buttons and pills. The
  guide's "Action button" is a full pill; that carries through.

---

## 6. Motion

The brand is speed. The site should feel quick, not busy.

- Transitions **120–180ms**, `cubic-bezier(0.2, 0, 0, 1)`.
- Hover on a card: 2px lift plus a Golden Ember glow. It's an ember catching, not a drop shadow.
- Hover on a primary button: an ember ring, not a color change — the resting color already passes
  contrast and changing it would break that.
- Scroll-reveal is a 12px rise and a fade, once, never repeating.
- **Everything above is disabled under `prefers-reduced-motion: reduce`.** Not reduced. Off.

---

## 7. Accessibility floor

Non-negotiable, because this is a public company site.

- Text contrast meets WCAG AA (4.5:1 body, 3:1 for text ≥24px or ≥18.66px bold). Verified values are
  in section 1.
- Every interactive element has a visible focus ring: 3px Fiery Red, 2px offset.
- Every image has real alt text. Decorative patterns are `aria-hidden`.
- The page works at 200% zoom and in a 320px viewport.
- Tap targets ≥44×44px.
- Heading levels never skip.
- Color is never the only way information is conveyed — status pills carry text, not just a hue.

---

## 8. Per-game theming

The studio palette above owns the site. Each game owns its own capsule inside it.

Every game in `content/games/*.json` carries a `theme` block sampled from that
game's actual art, which the build writes onto the page as custom properties
(`--g-bg`, `--g-surface`, `--g-text`, `--g-muted`, `--g-accent`, `--g-button`,
`--g-on-button`, `--g-border`). The capsule, the game page, its buttons, badges
and links all read those variables, so a game arrives in its own colours without
a line of bespoke CSS.

| Game | Sampled from | Background | Accent | Button |
|---|---|---|---|---|
| EXO | violet nebula and the burning sun in its key art | `#10012B` | `#C08BFF` | `#6A2CC4` |
| Kawai'ian Isolation | the dusk-blue island, the hot pink of its logo | `#141F36` | `#FF8CC4` | `#B5185C` |
| Burning Out | near-black forest and ember orange | `#140A04` | `#FFA23A` | `#B23A0C` |

Two rules hold every theme together:

**Contrast is not optional per game.** Body text must clear 4.5:1 against its
background and button text 4.5:1 against its fill. All three themes above were
measured before they shipped; the lowest value in the set is 5.99:1. Anything
new gets checked the same way.

**The studio frame stays studio-coloured.** Header, footer, the community band
and everything on `/studio/`, `/press/` and `/devlog/` use the Burnt Out palette.
A game's colours start at its capsule and stop at the end of its page. That
contrast is what makes the games read as three distinct worlds under one roof.

Each game also carries `coverFocus`, a CSS `object-position` value deciding which
part of a wide key art survives cropping into a card or a page header.
