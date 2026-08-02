# Custom Cursor Style Component

## Description

Overrides the `--clay-cursor-*` variables with the cursor files the site owner uploaded, and
loads the shared selector table those variables feed.

Only the variables whose attachment field is non-empty are emitted; the rest stay undefined and
the selector table falls back to the system keyword — same behaviour as before the built-in set
existed.

Used when the `styles.cursor_style` setting is `custom`.

## Usage

Head Content

```html
<th:block th:insert="~{components/custom-cursor-style/template :: head}"></th:block>
```
