# Clay design system

A condensed English reference for the tokens and the rules that govern them.

This is **not** a translation of [`docs/DESIGN.md`](../DESIGN.md). That file is the working
research log — how the values were extracted from `claude.com`, what was measured, what was tried
and rejected — and it stays in Chinese. This file is the part you need in order to change
something without breaking the resemblance.

Where a number appears in both files, `docs/DESIGN.md` is authoritative.

## 1. Where the values came from

Not reconstructed from memory or matched by eye: `curl https://claude.com/` for the raw HTML
(209 KB) → follow its 5 CSS chunk references → download all of them (327 KB) → extract custom
properties, `@font-face`, `border-radius`, `letter-spacing` and `cubic-bezier` declarations, then
rank by frequency. Contrast ratios were computed in-page with canvas so that computed values like
`color-mix(in oklab, …)` normalize correctly.

## 2. Color

### The grays are warm

21 neutral steps, all shifted yellow, running `#faf9f5` → `#141413`. **Substituting neutral grays
breaks the resemblance more than any other single change.** If you change one thing in this
document, do not let it be this.

### The six token sources

Each preset is a single `:root` block of exactly 12 semantic tokens, under
`src/templates/_runtime/styles/themes/`. `src/scripts/theme-tokens.ts` parses them and requires
that exact shape with properties in alphabetical order.

| Source | Meaning | `base-100` | `primary` | `accent` |
| --- | --- | --- | --- | --- |
| `theme-light.css` | Clay light (signature) | `#faf9f5` | `#c0502b` | `#9f4224` |
| `theme-dark.css` | Clay dark (signature) | `#141413` | `#d97757` | `#de8b6f` |
| `theme-light-blue.css` | Blue light | `#faf9f5` | `#3c76b0` | `#326292` |
| `theme-dark-blue.css` | Blue dark | `#141413` | `#6a9bcc` | `#88afd6` |
| `theme-light-gray.css` | Gray light | `#faf9f5` | `#73726c` | `#5e5d59` |
| `theme-dark-gray.css` | Gray dark | `#141413` | `#9c9a92` | `#b0aea5` |

The three `auto-*` presets are synthesised from a light + dark pair and have no source file of
their own. `COLOR_PRESETS` in `src/scripts/theme-tokens.ts` is the single source of truth for
*which* presets exist; both the theme-CSS generator and the cursor generator read it.

### Semantics

- **`primary` is the resting interactive color, `accent` is the hover step.** All 20 uses of
  `--color-accent` in the theme are hover states.
- The direction rule: **darken on light backgrounds, lighten on dark ones.** "Brighter on hover"
  on a light ground means lower contrast, which reads as the link going away.
- **`secondary` carries the near-black primary button** (`#141413` light / `#f5f4ed` dark).
  Anthropic's own semantic layer reads `--theme-button-primary-bg: var(--color-gray-950)`.
  **Filling a primary button with clay `#d97757` is the obvious wrong guess** — it shifts the whole
  feel toward promotional.
- **Only 7 of the 12 tokens are referenced anywhere.** `primary-content`, `accent-content`,
  `neutral`, `neutral-content` and `secondary-content` have zero uses; they exist to satisfy the
  generator's fixed shape. So a preset's real reach is narrower than its token diff suggests — the
  blue presets change exactly `primary` and `accent`.
- **A preset that leaves `accent` alone is half a preset.** The gray preset shipped for a long time
  with a gray `primary` but clay's `accent`, so the nav went gray while icon hovers, heading-link
  hovers, post-title hovers and tag underlines stayed orange.

### Contrast (measured, not estimated)

| | on `#faf9f5` | on `#141413` |
| --- | --- | --- |
| `#d97757` pure clay | **2.96** ✗ | 5.90 ✓ |
| `#c6613f` | **3.85** ✗ | 4.55 ✓ |
| `#c0502b` (light `primary`) | 4.51 ✓ | — |
| `#9f4224` (light `accent`) | 6.08 ✓ | — |
| `#de8b6f` (dark `accent`) | — | 7.05 ✓ |

Pure clay does not even reach 3:1 on a light ground, so it cannot carry light-background text.
The light presets use darkened values of the same hue instead: still recognisably clay, and every
text use passes.

## 3. Type

Three font roles, in `src/templates/_runtime/global/fonts/font-family.css`:

| Token | Family |
| --- | --- |
| `--clay-font-sans` | Inter → system sans → CJK system sans |
| `--clay-font-serif` | Source Serif 4 → `Clay Serif SC` → system serif |
| `--clay-font-mono` | JetBrains Mono → system mono |

`--clay-font-family` aliases sans and is what `body` uses.

**The serif/sans contrast is the core identifying trait**, and serif is only for display-level
headings (`h1`, `h2`) and blockquotes. Using it for body text loses the contrast just as surely as
dropping it entirely.

Responsive sizes, as measured on the live site:

```text
body       clamp(15px, 0.1878vw + 14.2958px, 17px)
heading    clamp(32px, 1.878vw + 24.9575px, 52px)
hero       clamp(42px, 7vw, 112px)
```

Line-width tokens follow the site's scale (`--text-width-narrow` 20ch … `--text-width-prose` 80ch);
the theme currently consumes headline / title / body. Body width is governed by the container's
`max_width` setting rather than overridden by a token — hardcoding it would take away the user's
configuration.

Letter-spacing is used only on small uppercase labels (`.05em` / `.04em`).

## 4. Metrics and motion

```text
radius   --clay-radius-xs 4px  sm 8px  md 12px  lg 16px  xl 24px  2xl 32px
borders  .5px / 1px / 1.5px / 2px
easing   cubic-bezier(.4, 0, .2, 1)   -- one easing everywhere
duration --clay-duration 0.2s
```

- **Hierarchy comes from type scale and weight, not from borders or shadows.** Avoid `box-shadow`.
- **One easing everywhere.** `--clay-ease` is `cubic-bezier(.4, 0, .2, 1)`, which dominated the
  extraction (15 occurrences). `--clay-ease-emphasized` exists for the rare entrance that needs it.
- `--clay-duration` reaches every `transition`, and the reduced-motion branch sets it to `1ms`.
  The four JS animation helpers (`fadeIn` / `fadeOut` / `slideDown` / `slideUp`) write
  `animationDuration` inline, so they run their value through `resolveAnimationDuration()` to pick
  the same behaviour up. **Anything new that sets `animationDuration` itself does not.**

### The link rule

Link hover is deliberately not carried by color alone — on the gray presets a hue change would be
nearly invisible. A link paints two background layers that tile the line between them: the solid
grows `0 → 100%` from the left while the dashes shrink `100% → 0` anchored right
(`--clay-rule-idle` / `--clay-rule-fill` / `--clay-rule-origins`). Broken rule becomes whole rule.

They tile rather than stack because two layers sharing a box edge both get antialiased into the
same device-pixel row at fractional zoom, and a partially covered pixel cannot mask another one —
the result was a faint shimmer along a rule that was supposed to be solid.

All four consumers (body links, footer links, blockquote footnotes, friend author) read the same
three tokens so they cannot drift apart.

## 5. Things that will bite you

- **A `var()` inside a token declared on `:root` is substituted at `:root`.** Descendants inherit
  the resolved literal, so "define a token that reads a second token, then override the second one
  further down" silently does nothing. `currentcolor` is a keyword, not a `var()`, and does survive
  substitution — that is what lets one dash token track two different text colors.
- **Every page and component template is a build entry**, enumerated in `getBuildInputs()` in
  `vite.config.ts`. Each setting is its own template fragment so Halo injects only the CSS the user
  selected; that is why a 2500-line settings surface still ships tens of KiB per page. A new
  template that is not registered will not be discovered.
- **Adding a color preset touches five places**: the token source, the `COLOR_PRESETS` table, a
  `components/theme-<name>/` trio, a `getBuildInputs()` entry, and two `th:if` lines in
  `base-layout` — plus the option lists in four selects × two languages.
- **The declared browser floor cannot be widened below Firefox 121.** Six stylesheets rely on
  `:has()`. A CSS selector list is non-forgiving, so on an older Firefox the whole rule drops and
  the serif hero silently vanishes with no console error.

## 6. What must never be bundled

Anthropic's `anthropicSans` / `anthropicSerif` / `anthropicMono` are proprietary. The open
substitutes are Inter, Source Serif 4, JetBrains Mono and Noto Serif SC — matching Anthropic's own
use of Noto for CJK fallback. See [`LICENSE`](../../LICENSE).

## 7. Further reading

- [`docs/DESIGN.md`](../DESIGN.md) — the full research log, including §15 on the self-hosted
  Chinese serif and its measurements (Chinese)
- [`docs/SETTINGS.en.md`](../SETTINGS.en.md) — every setting, generated from the English settings
- [`CLAUDE.md`](../../CLAUDE.md) — non-obvious build and runtime constraints (Chinese)
