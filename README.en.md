# Clay

[简体中文](./README.md)

A [Halo](https://github.com/halo-dev/halo) theme that reproduces the visual language of
Anthropic / Claude.

Warm gray ground, serif headings against sans body text, hierarchy built from type scale and
weight rather than rules and shadows. The palette and metrics were extracted from `claude.com`'s
live CSS rather than copied by eye — see [`docs/DESIGN.md`](./docs/DESIGN.md) for the research log
(Chinese) and [`docs/en/DESIGN.md`](./docs/en/DESIGN.md) for the design system in English.

> **This theme is a fork of [HowieHz/halo-theme-higan-hz](https://github.com/HowieHz/halo-theme-higan-hz)** (MIT).
> Upstream's engineering — responsive layout, i18n, deep configurability, plugin compatibility,
> per-setting CSS injection — is kept intact; what was replaced is the visual layer.
> The full attribution chain is in [`LICENSE`](./LICENSE).

## Features

- **Warm grays** — 21 neutral steps, all shifted yellow (`#FAF9F5` → `#141413`). This is the
  easiest thing to get wrong and the single biggest driver of the resemblance
- **Serif / sans contrast** — serif for display headings and blockquotes, sans for body and UI
- **Restrained accent** — clay orange `#D97757` appears only on links, current state, markers and
  focus rings. The primary button is near-black, not orange
- **Self-hosted fonts** — Inter / Source Serif 4 / JetBrains Mono, 222 KiB subsetted, variable
  weight, lazily fetched by `unicode-range` (a page with no code block never downloads the mono)
- **Self-hosted Chinese serif** — a Noto Serif SC subset split into one common tier plus 58 rare
  slices; a page with Chinese text usually fetches exactly one file. Android ships no Chinese
  serif at all, so without this the serif/sans contrast disappears for those visitors
- **Nine color presets** — light / dark / follow-system, each with the default clay, a blue and a
  gray accent; fully custom palettes are also supported
- **Built-in cursor set** — 13 SVG pointers that follow both the color scheme and the preset,
  2.1 KiB brotli per page in total, no extra requests
- **Follows the system color scheme** — driven by `data-color-scheme`, which Halo's official
  plugin UIs pick up automatically

## Page weight (measured)

Locally measured brotli transfer sizes, not estimates. Units are KiB (1024 bytes):

| | Home | Post | Archives |
| --- | --- | --- | --- |
| Theme code (HTML + CSS + JS, fonts excluded) | 41.8 | 84.2 | 25.0 |
| Latin fonts (first visit only, cached afterwards) | 187.8 | 221.6 | 187.8 |

The theme's own code stays in the tens of KiB thanks to upstream's design of making every setting
its own template fragment — Halo injects only the CSS the user actually selected.

Three things worth stating plainly:

- **Fonts dominate the first visit.** Inter 118.6 + Source Serif 4 69.2 = 187.8 KiB; a page with a
  code block adds JetBrains Mono 33.8 KiB. That is the price of self-hosting: no CDN dependency,
  and the serif/sans contrast never silently disappears. Switch back to the system font stack in
  the theme settings if you would rather not pay it.
- **Chinese sites add one more tier.** The built-in Chinese serif is on by default; a page
  containing Chinese fetches the 409.7 KiB common tier once and then hits cache. Rare characters
  pull their own slice; a Latin-only site downloads nothing. See [`docs/DESIGN.md`](./docs/DESIGN.md) §15
  for the tiering strategy and measurements.
- **Plugin assets usually dwarf the theme.** On a site running comments, search, syntax
  highlighting and link cards, those plugins come to roughly 700 KiB — the theme is under 5% of
  the page. Start optimizing on that side.

## Configuration

18 groups, 318 settings. The full reference is [`docs/SETTINGS.en.md`](./docs/SETTINGS.en.md),
listing every setting's name, type, default, description and display condition, plus the path to
read it from a template.

Both language versions are exported by `scripts/gen-settings-reference.py` rather than written by
hand — 2500 lines of configuration described by hand goes stale on the first edit. The English
version reads `i18n-settings/settings.en.yaml`, which is exactly what ships as `settings.yaml`
inside the English package, so it is exported from the source rather than translated from the
Chinese reference. Generating also checks that the two files declare the same groups and fields in
the same order, and fails loudly when they drift. Regenerate after changing configuration:

```bash
python scripts/gen-settings-reference.py --lang all
```

## Requirements

| | Version |
| --- | --- |
| Halo | ≥ 2.25.0 |
| Node.js | ≥ 24 |
| pnpm | ^11.18 |

## Development

```bash
pnpm install --force   # --force is mandatory, see below
pnpm watch             # dev loop (vite build --watch)
pnpm build             # production: minify + Tailwind class mangling + brotli
pnpm lint              # oxlint + eslint + stylelint + markdownlint + autocorrect
pnpm fmt               # oxfmt
```

> **`pnpm install` silently omits rolldown's native binary.** Vite 8 bundles with rolldown, which
> ships its per-platform binaries as optional dependencies. On Windows a plain `pnpm install` exits
> 0 and the build then dies with `Cannot find module '@rolldown/binding-win32-x64-msvc'`.
> Always use `pnpm install --force`.

Previewing locally needs a Halo instance with this directory linked into its `themes/`, started
with `--spring.thymeleaf.cache=false` — without that flag template edits do not take effect.
Full development notes are in [`CLAUDE.md`](./CLAUDE.md) (Chinese).

## Packaging and releases

```bash
pnpm build
python scripts/package-theme.py
python scripts/verify-package.py    # version, file count, asset refs, no engineering files
```

This produces two zips under `dist/`:

- `halo-theme-clay-<version>-zh-hans.zip` — default, Simplified Chinese settings UI
- `halo-theme-clay-<version>-en.zip` — English settings UI

Halo has no mechanism for localizing `settings.yaml`, so a multilingual settings UI can only be
shipped as multiple packages: the English one substitutes `i18n-settings/*.en.yaml` for the
`settings.yaml` / `theme.yaml` / `annotation-settings.yaml` at the root, and `README.en.md` for
`README.md`. When you touch any of those, update the matching `.en.yaml`.

CI does the same thing on every push, and pushing a `v*` tag builds both packages, verifies them
and publishes the GitHub release. See [`.github/workflows/`](./.github/workflows).

> `@halo-dev/theme-package-cli` is deliberately not used: it globs `*.yaml` at the root, which
> sweeps `pnpm-lock.yaml` / `pnpm-workspace.yaml` into the package, and it does not produce an
> English package.

## Build output

`templates/` is build output, is listed in `.gitignore`, and **must not be edited directly**. The
sources are under `src/templates/`.

A new template has to be registered explicitly in `getBuildInputs()` in `vite.config.ts` — it is
not discovered automatically.

## Extension pages

The `links` / `moments` / `photos` / `friends` templates do not create routes on their own. They
back single pages that the user creates in Halo with the matching custom template, and some of them
additionally require third-party plugins. A 404 on `/moments` before you have created that page is
expected.

## Font licensing

Anthropic's own `anthropicSans` / `anthropicSerif` / `anthropicMono` are proprietary and are **not,
and will not be, bundled**. The open substitutes used here are all under SIL Open Font License 1.1:

- [Inter](https://github.com/rsms/inter)
- [Source Serif 4](https://github.com/adobe-fonts/source-serif)
- [JetBrains Mono](https://github.com/JetBrains/JetBrainsMono)
- [Noto Serif SC](https://github.com/notofonts/noto-cjk) (subsetted as `Clay Serif SC`, weight 400 only)

**The Chinese serif is self-hosted; the Chinese sans is not.** A full Noto Serif SC is several MB
and would blow the size budget, so it is split into one common tier plus 58 rare slices addressed
by `unicode-range` — an ordinary Chinese page downloads one file. The reason it is worth paying
for: Windows, macOS and iOS ship a Chinese serif and Android does not, so without self-hosting,
Android visitors see Chinese headings fall back to a sans face and the single most identifying
trait of the design disappears. The Chinese sans has no such gap — every target OS ships a usable
one (PingFang SC / Microsoft YaHei / Noto Sans CJK) — so it stays on system fonts.

## License

MIT. The lineage of this theme's styling:

[probberechts/hexo-theme-cactus](https://github.com/probberechts/hexo-theme-cactus) (Pieter Robberechts, 2016)
→ light and white colorschemes (Gabriela Thumé, Natalya Kosenko, 2017)
→ [guqing/halo-theme-higan](https://github.com/guqing/halo-theme-higan) (2019)
→ [HowieHz/halo-theme-higan-hz](https://github.com/HowieHz/halo-theme-higan-hz) (2024)
→ Clay

[`LICENSE`](./LICENSE) is authoritative for attribution and also carries the SIL OFL text for each
bundled font. Thanks to Pieter Robberechts, Gabriela Thumé, Natalya Kosenko, guqing, HowieHz and
the upstream community.
