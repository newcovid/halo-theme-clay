# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

`halo-theme-clay` — a Halo CMS theme replicating Anthropic/Claude's visual language.
It is a **hard fork of [HowieHz/halo-theme-higan-hz](https://github.com/HowieHz/halo-theme-higan-hz)** (MIT), taken at v1.72.3 and rebranded.
Upstream's engineering (build pipeline, plugin compatibility, i18n, per-setting CSS injection) is kept; its visual layer is being replaced.

The fork is intentional and one-way — the design layer has diverged, so upstream merges are not expected.
`LICENSE` carries the full attribution chain (Pieter Robberechts 2016 → Gabriela Thumé / Natalya Kosenko 2017 → guqing 2019 → HowieHz 2024) and must be preserved.

Read `docs/DESIGN.md` before changing anything visual — it holds the design tokens extracted from claude.com's live CSS.

## Commands

```bash
pnpm install --force   # NOT plain install — see below
pnpm watch             # dev loop: vite build --watch, BUILD_MODE=dev
pnpm build             # production: minify + Tailwind class mangling + brotli
pnpm build:dev         # one-shot unminified, with manifest
pnpm build:tiny        # minimal asset set
pnpm lint              # oxlint + eslint + stylelint + markdownlint + autocorrect
pnpm fmt               # oxfmt
```

Requires **Node ≥24** and **pnpm ^11.18** (`engineStrict: true` in `pnpm-workspace.yaml` enforces this).

The local Halo runtime lives **outside** this repo, in a sibling directory referred to below as
`<halo-runtime>/`:

```bash
java -jar <halo-runtime>/halo-2.25.4.jar \
  --halo.work-dir=<halo-runtime>/work \
  --server.port=8090 \
  --spring.thymeleaf.cache=false
```

`--spring.thymeleaf.cache=false` is mandatory in development. Console at `http://localhost:8090/console`.

Scripts under `scripts/regression/` authenticate with `HALO_USERNAME` / `HALO_PASSWORD` from the
environment — credentials are not committed. Set them to whatever the local instance was initialised with.

`halo-runtime/work/themes/halo-theme-clay` is a **junction pointing at this repo**, so `pnpm watch` output is picked up without reinstalling the theme.
If the theme ever needs reinstalling, package `theme.yaml` + `settings.yaml` + `annotation-settings.yaml` + `templates/` + `i18n/` into a zip and POST it to `/apis/api.console.halo.run/v1alpha1/themes/install`.

## Non-obvious constraints

**`pnpm install` silently omits rolldown's native binary.** Vite 8 bundles with rolldown, which ships per-platform optional deps.
On Windows a plain `pnpm install` exits 0, then the build dies with `Cannot find module '@rolldown/binding-win32-x64-msvc'`. Always `pnpm install --force`.

**`pnpm build:dev` over a `pnpm build` tree makes Halo 500 on already-served assets.**
The production build emits `.br` siblings; `build:dev` does not, and asset filenames are content-hashed
identically in both modes. Halo caches its resolved static resources, so any asset it already served from
`foo.css.br` keeps resolving to a file that no longer exists — the request returns **HTTP 500** whenever the
client sends `Accept-Encoding: br` (every browser). Measured after one `build:dev`: 23 of 40 CSS assets 500,
the 17 untouched ones fine. The page still returns 200; the stylesheets are simply missing, and
`link.sheet` is non-null with **zero `cssRules`** — so the `link.sheet === null` check for SRI failures does
*not* catch this one. Symptom: design tokens silently fall back (`--text-xs` unresolved → everything 16px).
Re-run `pnpm build` (restores the `.br` files) or restart Halo. Verify with
`curl -H "Accept-Encoding: br" -o /dev/null -w "%{http_code}"` over a handful of assets.

**Scripting the Halo API requires RSA-encrypting the password.** `/login` renders `password` as a *hidden* input; the page's inline JS encrypts the plaintext with a public key (jsencrypt, RSA PKCS#1 v1.5)
before submit.
Plaintext form login always returns `invalid-credential`. Working helper:
`scratchpad/halo-lib.mjs` — GET `/login`, scrape `_csrf` and `const publicKey = "..."` (unescape `\/`), `crypto.publicEncrypt` with `RSA_PKCS1_PADDING`, base64, POST as `password`.
State-changing API calls also need the `X-XSRF-TOKEN` header set to the `XSRF-TOKEN` cookie.

**Halo does not scan the themes directory.** Themes must be registered as Theme resources via the install API;
a directory dropped into `work/themes/` is invisible (the site silently falls back to the bundled `theme-earth`).
Verify with `GET /apis/api.console.halo.run/v1alpha1/themes`.

**Renaming the theme touches five coupled places.** `theme.yaml` `metadata.name`, the theme folder name,
`spec.settingName` ↔ `settings.yaml` `metadata.name`, `spec.configMapName`, and `themeBase` in `vite.config.ts`
(`/themes/<name>/`). A mismatch makes assets 404 or settings silently fail to bind.
Annotation keys are namespaced `halo-theme-clay/...`.

**Never call the theme upgrade/install API while `work/themes/halo-theme-clay` is the junction.**
Halo *empties the theme directory* before extracting the zip — through the junction that deletes
repo files that aren't in the package (dotfiles, tooling directories, … 51 files).
Everything tracked is recoverable with `git restore .`, but untracked local files are not.
To refresh the installed *Setting* definition, package to a throwaway directory and point Halo there,
or accept that `settings.yaml` edits only reach the Console after a real (non-junction) install.

**The Console's Setting resource and the theme directory drift apart.** Templates are read from disk
through the junction, but `halo-theme-clay-setting` lives in Halo's DB and is written only at
install/upgrade time. Installing the `-en` package leaves the Console showing English group labels
while `settings.yaml` on disk is Chinese — the two are independent.
Check with `GET /api/v1alpha1/settings/halo-theme-clay-setting` (note: `/api/`, not `/apis/`;
`/apis/v1alpha1/settings/...` 404s, and `themes/<name>/reload-setting` no longer exists in 2.25).

**Conditional settings fields only appear after save + reload.** A `switch` with dependents gated on
`$field === true` updates its own model immediately (`data-checked="true"` on the wrapper) but does not
mount the dependent fields until the form is saved and the page reloaded. Verified on Halo 2.25.4 —
it is Console behaviour, not a schema error; `key:` is present on all 151 conditional fields.
Don't chase it as a theme bug, and don't judge "the toggle does nothing" from one click.

**`Theme.status.screenshot` is computed at startup/install, not on file change.** Dropping a new
`screenshot.png` into the theme root does nothing until Halo restarts (or the theme is reinstalled).
Verify with `GET /apis/api.console.halo.run/v1alpha1/themes` and check `status.screenshot`.

**The declared browser floor cannot be widened below Firefox 121.** Six stylesheets rely on `:has()`, which
Firefox only shipped in 121. A CSS selector list is non-forgiving: one unparseable selector drops the *whole*
rule, so on an older Firefox the homepage serif hero and the empty-`#about` collapse simply vanish — silently,
with no console error. `browserslist` in `package.json` and `build.target` in `vite.config.ts` must stay in
step; lowering either to advertise broader support makes the claim false rather than making the theme work.

**`pnpm lint` rewrites CJK data files unless they are excluded.** The `autocorrect` step treats every file as
prose: it inserts spaces at CJK/Latin boundaries and normalises full-width punctuation. Run against
`scripts/fonts/noto-serif-sc.order.txt` (a bare character-frequency list) it silently reordered the data and
injected space characters, changing the generated font tiers on the next build. Anything under `scripts/fonts/`
or `src/templates/_runtime/global/fonts/clay-cjk/` is data, not copy — it is listed in `.autocorrectignore`, and
new data files need the same treatment. The symptom is a *successful* lint followed by a build whose numbers
quietly moved.

**Halo's template/Finder APIs shift between minor versions.** Don't write field accesses from memory —
check them against the Halo docs for the exact minor version you target.
In particular, list templates get `ListedPostVo`, which has **no** `content`
field; SpEL's `?.` guards null but not a missing property, so `post.content?.content` throws EL1008E and
truncates the response mid-stream. Use `postFinder.content(post.metadata.name)` in list context.

**A `var()` inside a token declared on `:root` is substituted *at* `:root`; descendants inherit the resolved
literal.** Custom properties substitute at computed-value time on the element the *declaration* matched, so
"define a token that reads a second token, then override the second one further down" silently does nothing.
This has bitten twice:

- `cursor: var(--clay-cursor-*)` — the dark-mode override has to redefine the variables on `html`, the same
  element `:root { cursor: … }` matches. Redefining them on a wrapper changes nothing for anything that merely
  *inherits* the root cursor; elements with their own `cursor` declaration (like `a`) *do* pick it up, which
  makes the bug look like "only some cursors are broken".
- `--clay-rule-solid: linear-gradient(var(--clay-rule-color) 0 0)` — the nav set `--clay-rule-color:
  var(--color-primary)` on the link and still painted `--color-accent`, because the gradient had already
  been resolved at `:root`. Fixed by dropping the indirection: sites needing a different colour write
  `linear-gradient(var(--color-primary) 0 0)` themselves.

`currentcolor` is **not** subject to this — it is a keyword, not a `var()`, so it survives substitution and
resolves against the element that finally uses the value. That is what lets one `--clay-rule-dashes` token
track the footer's 80% dimmed text colour and the article's full-strength one.

**Custom property values are not validated at parse time, so `image-set` cannot be feature-degraded by
declaring the property twice.** The later declaration always wins, even in a browser that cannot parse it,
and `cursor` then falls to invalid-at-computed-value-time → inherit. `generate-cursor-css.ts` therefore emits
the whole retina layer inside `@supports`. The same trap applies to any future `var()`-delivered value that
needs a capability fallback.

**A background layer cannot reliably hide another layer that shares its edge.** The link rule used to paint
a 1px dashed layer across the full width and slide an opaque 2px solid layer over it. Both layers are
bottom-anchored to the same box edge, and at any non-integer zoom that edge falls between device pixels — so
*both* get antialiased into the same pixel row. A partially covered pixel cannot be masked by another
partially covered pixel: the row composites to `a·solid + (1−a)·(a·dash + (1−a)·bg)`, which differs between
dash and gap columns. The result is a faint 6-on-3-off shimmer along the bottom of a rule that is supposedly
solid — visible at some zoom levels and not others, which makes it read as a rendering glitch rather than a
CSS one. Raising the top layer's height, its opacity, or its z-order does not help; only removing the
overlap does.

The two layers now tile the line instead of stacking: the solid grows `0 → 100%` from the left while the
dashes shrink `100% → 0` anchored right (`--clay-rule-idle` / `--clay-rule-fill` / `--clay-rule-origins`).
The dash gradient runs `270deg` for exactly this reason — a `repeating-linear-gradient` anchors its phase to
the *start* edge of its tile, so with `90deg` the pattern would crawl as the tile's left edge moved. All four
consumers (body links, footer links, blockquote footnotes, friend author) read the same three tokens, so the
four cannot drift apart again.

**The `[hash]` in an asset's file name does not cover the bytes that ship.** rolldown freezes asset file
names before `generateBundle`, and two plugins keep editing content after that — the Tailwind class mangler
and the generated-comment cleanup. So a CSS file whose *source* is unchanged keeps its URL while its bytes
change, because the mangler's short-name table is ordered by global frequency: adding or removing a utility
anywhere renumbers unrelated buckets.

The failure is not "stale styles", it is **no styles**. `vite-plugin-sri3` computes `integrity` over the
final content, so a returning visitor whose cache holds the old bytes for that URL fails the integrity check
and the browser **drops the stylesheet entirely** — `link.sheet` is `null`, and the page collapses to
near-unstyled flow. It is latent: v0.2.4 → v0.3.0 had 0 of 40 same-named CSS files differ; v0.3.0 → v0.3.1
had **19 of 54**, and every returning visitor lost the hero, the icons and the post header.

`plugins/vite-plugin-asset-content-version.ts` stamps `?v=<sha256 of final content>` onto every template
asset reference, so the URL moves whenever the bytes move. It **must stay after `sri()`** in
`vite.config.ts`: sri3 resolves each `href` against the bundle to hash it, and a query string added earlier
makes that lookup fail the build. Renaming the asset instead is not an option — rolldown rejects adding or
deleting bundle keys in `generateBundle`, and mutating only `fileName` leaves later lookups pointing at a
file that no longer exists.

Diagnosis, when styles vanish after an update: in the page, look for
`[...document.querySelectorAll('link[rel=stylesheet]')].filter(l => l.sheet === null)` — a non-empty result
with HTTP 200 responses means integrity, not routing. Assets fetched `identity` will hash correctly on the
server; the mismatch lives in the client cache.

**The whole-card link in the two summary lists breaks `:hover` scoping and background painting at once.**
`list-post-summary` and `list-friends-summary` make the entire card clickable by putting an absolutely
positioned, card-sized `<span>` *inside* the title's `<a>`. Two consequences, both silent:

- The overlay is a descendant, so **`a:hover` is true anywhere in the card** — a rule hung on the `<a>`
  fills itself while the pointer sits on the excerpt, the date, or blank space.
- The `<a>` is not positioned, so its background paints in the inline layer; the hover wash
  (`.post-card-hover`, `position: absolute; z-index: 0`) is a *positioned* box and by CSS 2.1 Appendix E
  paints **above** it — and it is opaque. The rule fills, then is covered. The symptom reads as
  "charges up, then vanishes", which sounds like an animation bug and is not one.

Anything that must respond to its own hover has to sit above the overlay (`z-30`), and anything raised
above it stops being covered by the card-wide click target — so it needs to be a link in its own right, or
it becomes a dead patch in the middle of a clickable card. That is why `.post-more-link` is a real `<a>`
(`aria-hidden` on the wrapper, `tabindex="-1"` on the link) rather than a styled `<div>`.

## Architecture

Vite 8 + Tailwind v4 + Alpine.js, bundling with rolldown. Three custom Vite plugins in `plugins/`: Thymeleaf-safe HTML minification, Tailwind class-name mangling, and generated-CSS comment cleanup.

**Every page and component template is a build entry.** `vite.config.ts` enumerates ~15 pages plus ~56 component templates explicitly in `getBuildInputs()`.
This is upstream's central performance trick:
each *setting* (`text-size-small`, `theme-dark`, `layout-max-width-style`, …) is its own template fragment, so Halo injects only the CSS the user actually selected.
It is how a 2500-line settings surface still ships ~70 KiB per page.
**Adding a template requires registering it in `getBuildInputs()`** — it will not be discovered automatically.

**Adding a colour preset touches five places**: the token source under `_runtime/styles/themes/`, the
`COLOR_PRESETS` table in `src/scripts/theme-tokens.ts`, a `components/theme-<name>/` trio, a
`getBuildInputs()` entry, and two `th:if` lines in `base-layout` (the `color-scheme-*` group and the
`theme-*` group, both keyed off `selected_schemes`). Plus the option lists in **four** selects × two
languages. The `selected_schemes` variable in `base-layout`'s root `th:with` exists to keep the template
side at two lines instead of six — before it, the dispatch was duplicated across "toggle button off / on"
branches, which is how upstream's stale preset labels survived so long.

`COLOR_PRESETS` is the single source of truth for *which presets exist*: both `generate-theme-css.ts`
and `generate-cursor-css.ts` read it. It used to live only in the theme generator while the cursor
generator kept its own copy of clay's two hex values — which is why the blue and gray presets recoloured
the page but left the pointer orange. Two other places that used to enumerate presets no longer do:
`base-layout`'s `data-color-scheme` attribute now classifies by the `light` / `dark` / `auto` **prefix**
instead of a ten-deep ternary chain, and `theme-toggle-button`'s `themeColorSchemeMap` still needs the
new key (it also carries runtime-registered custom-scheme ids, so it stays an explicit map).

Four build modes (`default` / `dev` / `full` / `tiny`) select scope, precompression, minification, and manifest via `BUILD_MODE`.

`src/templates/` is the Vite root; output goes to `templates/` (gitignored — never edit directly). `src/templates/_runtime/` holds shared TS/CSS, aliased as `@runtime`.

Halo maps templates to routes by filename.
Route prefixes (`/archives`, `/tags`) are user-configurable in Console, so never hardcode them — use the permalink fields off the model.
Post body content renders with `th:utext`; `th:text` would show raw HTML.

`links` / `moments` / `photos` / `friends` templates exist but produce no routes on their own — they back SinglePages the user creates with the matching custom template, and some need third-party plugins.
A 404 on `/moments` is expected until that page is created.

## Design system

Tokens live in two places, both derived from `docs/DESIGN.md`:

- `src/templates/_runtime/styles/themes/*.css` — six sources (light / dark / light-blue / dark-blue /
  light-gray / dark-gray), each a single `:root` block of exactly 12 semantic tokens, parsed by
  `src/scripts/theme-tokens.ts` (which requires that exact shape and alphabetical property order).
  The three `auto-*` presets are *synthesised* from a light + dark pair, not authored. `primary` is the
  resting interactive color, `accent` the hover step.
  **Only 7 of the 12 tokens are referenced anywhere** — `primary-content`, `accent-content`, `neutral`,
  `neutral-content` and `secondary-content` have zero uses; they exist to satisfy the generator's fixed shape.
  Nothing consumes these through Tailwind utilities either, only hand-written `var()`. So a preset's real
  reach is smaller than its token diff suggests: the blue presets change exactly `primary` + `accent`.
  Body links are `--color-base-content` with an underline that turns `--color-accent` on hover — if a preset
  sets those two to the same value the hover loses its colour cue.
  **A preset that leaves `accent` alone is half a preset.** The gray preset shipped for a long time with
  `primary` grey but `accent` still clay, so icons, heading-link hovers, post-title hovers and tag
  underlines stayed orange while the nav went grey — `primary` and `accent` split the interactive
  surface roughly evenly, and only `accent` shows up in hover states. Both are now placed on the
  DESIGN.md warm ramp at the *same lightness steps* clay uses (L\* ≈ 48 → 40 light, 62 → 71 dark), so the
  "darken on light, lighten on dark" direction rule holds in a monochrome preset too.
  The light gray's value used to be `gray`; it is now `light-gray`, and the old value is **not** accepted —
  saved configs holding `gray` fall through to `src/generated/theme-fallback.css` (the signature light
  palette on `:root`, in the `base` layer) rather than to twelve undefined tokens.
- `src/templates/_runtime/global/fonts/font-family.css` — three font roles: `--clay-font-sans`,
  `--clay-font-serif`, `--clay-font-mono`. `--clay-font-family` aliases sans and is what `body` uses.

When implementing:

- The grays are **warm** (`#faf9f5` → `#141413`, yellow-shifted), not neutral. Substituting neutral grays breaks the resemblance more than any other single change.
- **The primary button is near-black `#141413`, not clay.** Anthropic's own semantic layer reads `--theme-button-primary-bg:
var(--color-gray-950)`; clay is a separate accent variant whose button background is the *darker* `--color-clay-hover` `#c6613f` with white text.
Using `#d97757` as a fill was the obvious wrong guess — it shifts the whole feel toward promotional.
- Serif is only for display-level headings and blockquotes; the serif/sans contrast is the core identifying trait.
- Hierarchy comes from type scale and weight, not borders or shadows. Avoid `box-shadow`.
- One easing everywhere: `cubic-bezier(.4, 0, .2, 1)`.

Anthropic's own webfonts (`anthropicSans/Serif/Mono`) are proprietary and must never be vendored. Open substitutes:
Inter, Source Serif 4, JetBrains Mono, plus Noto Sans/Serif SC for CJK — matching Anthropic's own use of Noto for CJK fallback.

**The CJK serif is self-hosted; the CJK sans is not.** Stock Android ships no Chinese serif at all, so
`--clay-font-serif` resolving to system families meant Android visitors lost the serif/sans contrast entirely.
`Clay Serif SC` (a Noto Serif SC subset, weight 400 only) is vendored under
`src/templates/_runtime/global/fonts/clay-cjk/`, generated by `scripts/build-cjk-serif.py` — regenerate only
when the tiering parameters change; the output is committed and the daily build does not run the script.
It is split into one 410 KB common tier plus 58 rare-character slices, each with its own `unicode-range`, so a
typical page fetches exactly one file and a Latin-only site fetches none. **Rare slices are declared *before*
the common tier on purpose**: CSS font matching gives the *last* declared `@font-face` priority for an
overlapping `unicode-range`, which is what routes ordinary text to the single common file. Reordering them
silently makes every page pull rare slices. The rare windows tile contiguously so the character table has no
gaps, but each window is **clipped to the CJK blocks**: `unicode-range` states what a slice *contains*, and a
slice that claims codepoints it has no glyphs for is still downloaded in full before the browser falls through
to the next family. Emitting a window as one cross-block span made the last two slices claim the Private Use
Area (where icon fonts live) and all of Hangul — a single icon glyph pulled 52.9 KB of Chinese.
See `docs/DESIGN.md` §15 for the measurements.

CJK sans stays on system fonts — every target OS ships a usable one, so there is no equivalent gap to close.

**The cursor set is generated, and its selector table is shared with the upload path.**
`src/scripts/generate-cursor-css.ts` (run from `prebuild`, output gitignored under `src/generated/`) holds the
13 shapes once and expands them across light/dark × 1x/2x into `--clay-cursor-*` declarations. Which element
gets which cursor lives separately, in `_runtime/global/cursors/selectors.css`, so the `custom` mode only has
to override the same variables — it does not restate the selectors. Edit shapes in the script, never the
generated CSS. Every selector carries a keyword fallback (`var(--clay-cursor-text, text)`) because in `custom`
mode most variables are undefined.
**Only the interactive colour follows the preset; the silhouette does not.** Outline and body fill come from
`theme-light` / `theme-dark`'s `base-100` / `base-content` for the two halves — all six presets share just two
`base-100` values, and their `base-content`s differ by one ramp step, which is invisible at 24px. So the
product is two layers: light/dark blocks carrying all 13 shapes, then per-preset blocks carrying only the
shapes that actually paint with the interactive colour. **Which shapes those are is probed, not listed** —
`usesInteractiveColor()` renders each shape with sentinel colours and checks the output, so adding a clay
stroke to an existing shape can't silently apply to the default preset only. Emitting all 13 per preset would
be 175 KB instead of 107 KB. Raw grew 58 → 107 KB, brotli 1.5 → 2.0 KB: the extra blocks are near-duplicates.
Preset blocks are `html[theme="…"]` and the base blocks are `html[data-color-scheme="…"]` — **equal
specificity**, so the preset blocks must stay after the base ones, inside and outside the retina `@supports`
alike. `muted` deliberately does *not* follow the preset: it means "no interaction here", the opposite of what
the interactive colour means.

## Configuration policy

`settings.yaml` is ~2500 lines across 19 groups, inherited from upstream.
The decision is to **keep it broadly intact** — strong configurability is a feature being preserved, not trimmed. Only clearly dead options should be removed.

The corollary: after any visual change, settings combinations need re-verification. A token or layout edit can break a preset nobody exercised.
Options with `if:` conditions **must** also declare `key:`, or Vue reuses DOM nodes and values leak between states.

## Publishing policy

This repo, its releases and its packaged zips are public. Nothing that identifies the machine or the
session may appear in them.

**Release notes, tag messages and commit messages must not carry agent-session trailers** — no
`Claude-Session:` line, no `🤖 Generated with …` block, no `claude.ai/code/session_…` URL. Those are
machine-specific identifiers, and a release page is the most visible surface the project has. The default
git-trailer convention does not apply here; this repo overrides it. Check before publishing:

```bash
gh release view <tag> --json body --jq .body | grep -c "claude.ai/code/session"   # must be 0
git log -1 --format=%B | grep -c "Claude-Session"                                 # must be 0
```

Also out of the published tree: `.agents/`, `.claude/`, `skills-lock.json` (all gitignored), local absolute
paths, and credentials — `scripts/regression/` and `scripts/fixtures/` read `HALO_USERNAME` / `HALO_PASSWORD`
from the environment for exactly this reason. `scripts/package-theme.py` uses an explicit include list rather
than a glob so engineering files cannot drift into the zip.
