# Clay Cursor Style Component

## Description

Ships the built-in Clay cursor set: the shared selector table plus the generated
`--clay-cursor-*` variable definitions (light / dark, 1x / 2x).

The variables come from `src/generated/clay-cursors.css`, produced at `prebuild` time by
`src/scripts/generate-cursor-css.ts`. Do not edit the generated file — edit the shape
definitions in the script.

Used when the `styles.cursor_style` setting is `clay` (the default).

## Usage

Head Content

```html
<th:block th:insert="~{components/cursor-clay-style/template :: head}"></th:block>
```
