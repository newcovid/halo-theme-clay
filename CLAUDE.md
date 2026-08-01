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

**Halo's template/Finder APIs shift between minor versions.** Don't write field accesses from memory —
check them against the Halo docs for the exact minor version you target.
In particular, list templates get `ListedPostVo`, which has **no** `content`
field; SpEL's `?.` guards null but not a missing property, so `post.content?.content` throws EL1008E and
truncates the response mid-stream. Use `postFinder.content(post.metadata.name)` in list context.

## Architecture

Vite 8 + Tailwind v4 + Alpine.js, bundling with rolldown. Three custom Vite plugins in `plugins/`: Thymeleaf-safe HTML minification, Tailwind class-name mangling, and generated-CSS comment cleanup.

**Every page and component template is a build entry.** `vite.config.ts` enumerates ~15 pages plus ~56 component templates explicitly in `getBuildInputs()`.
This is upstream's central performance trick:
each *setting* (`text-size-small`, `theme-dark`, `layout-max-width-style`, …) is its own template fragment, so Halo injects only the CSS the user actually selected.
It is how a 2500-line settings surface still ships ~70 KiB per page.
**Adding a template requires registering it in `getBuildInputs()`** — it will not be discovered automatically.

Four build modes (`default` / `dev` / `full` / `tiny`) select scope, precompression, minification, and manifest via `BUILD_MODE`.

`src/templates/` is the Vite root; output goes to `templates/` (gitignored — never edit directly). `src/templates/_runtime/` holds shared TS/CSS, aliased as `@runtime`.

Halo maps templates to routes by filename.
Route prefixes (`/archives`, `/tags`) are user-configurable in Console, so never hardcode them — use the permalink fields off the model.
Post body content renders with `th:utext`; `th:text` would show raw HTML.

`links` / `moments` / `photos` / `friends` templates exist but produce no routes on their own — they back SinglePages the user creates with the matching custom template, and some need third-party plugins.
A 404 on `/moments` is expected until that page is created.

## Design system

Tokens live in two places, both derived from `docs/DESIGN.md`:

- `src/templates/_runtime/styles/themes/*.css` — five presets, each a single `:root` block of exactly 12
  semantic tokens, parsed by `src/scripts/generate-theme-css.ts` (which requires that exact shape and
  alphabetical property order). `primary` is the resting interactive color, `accent` the brighter hover step.
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

## Configuration policy

`settings.yaml` is ~2500 lines across 19 groups, inherited from upstream.
The decision is to **keep it broadly intact** — strong configurability is a feature being preserved, not trimmed. Only clearly dead options should be removed.

The corollary: after any visual change, settings combinations need re-verification. A token or layout edit can break a preset nobody exercised.
Options with `if:` conditions **must** also declare `key:`, or Vue reuses DOM nodes and values leak between states.
