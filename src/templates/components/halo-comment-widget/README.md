# Halo Comment Widget Component

## Description

This component provides a widget for displaying comments on posts in the Halo theme.

## Usage

Head Content (for including necessary scripts/styles)

```html
<th:block th:insert="~{components/halo-comment-widget/template :: head}"></th:block>
```

Content Insertion

```html
<div th:if="${haloCommentEnabled}">
  <halo:comment
    group="content.halo.run"
    kind="Post"
    th:attr="name=${post.metadata.name}"
  />
</div>
```

## Styling

The widget (plugin-comment-widget v3) renders inside a shadow DOM, so ordinary theme
selectors cannot reach it. Two surfaces are used, in this order of preference:

- `styles.css` — the 10 `--halo-cw-*` custom properties the widget actually reads in 3.1.2.
  Custom properties cross the shadow boundary, so this covers colour, font and radius.
  This is the stable surface; prefer it.
- `shadow.css` + `index.ts` — a constructed stylesheet appended to every shadow root under
  `comment-widget`. Needed only for what variables cannot express: the widget leaves
  `.form__footer` / `.form-login` / `.form-logout` / `.form-submit` / `.form-actions`
  completely unstyled as theme hooks, and hardcodes `text-white` on the submit button.
  This surface is tied to upstream class names; if they change it degrades to the plugin's
  own styling rather than breaking.

## Docs

[halo:comment](https://docs.halo.run/developer-guide/theme/template-tag#halo)
