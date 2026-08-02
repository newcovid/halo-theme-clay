# Layout Heading Paragraph Margin Style Component

## Description

This component outputs the inline style block used to customize shared heading and paragraph margin multipliers.

The multipliers scale the theme's own base margins, so the base values written here must stay in step with
`_runtime/global/base-styles/styles.css`. They inherited upstream's numbers, which this theme had already
changed — setting any multiplier to a value other than `1` used to snap the margins to the upstream sizes
rather than scale the current ones. Paragraphs now read `--clay-paragraph-gap` directly; the heading values
are still duplicated literals and need updating by hand if the base styles change.

## Usage

Body Content

```html
<th:block th:insert="~{components/layout-heading-paragraph-margin-style/template :: body}"></th:block>
```
