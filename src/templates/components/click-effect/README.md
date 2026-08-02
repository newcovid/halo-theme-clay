# Click Effect Component

## Description

Draws a hairline mark at the pointer on mouse-down: a circle for the primary button, a rounded
square for the secondary one — the two halves of the site mark.

Skipped entirely for touch input and for visitors who ask for reduced motion.

Gated on the `styles.is_click_effect_enable` setting (default on); the secondary-button half has
its own `styles.is_click_effect_secondary_enable` switch.

## Usage

Head Content

```html
<th:block th:insert="~{components/click-effect/template :: head}"></th:block>
```

Body Content

```html
<th:block th:insert="~{components/click-effect/template :: body}"></th:block>
```

Both fragments are required — the body one carries the container the script writes into.
