# halo-search-widget

把 [plugin-search-widget](https://github.com/halo-dev/plugin-search-widget) 的配色接到主题令牌上。

插件默认的强调色是 `#4CCBA0`（薄荷绿），面板底色是冷灰（`#f8fafc` / `#fff`），
在 Clay 的暖灰底上是两处显眼的异色。这个组件只输出一组自定义属性，不改插件的结构。

变量挂在 `<search-modal>` 宿主元素上，而不是 `:root`：插件自带的暗色块是
`.dark, [data-color-scheme=dark]`（作用在 `<html>` 上），且它的样式表比主题的后加载；
自定义属性按继承就近生效，宿主元素离用例更近，所以不需要比特异性、也不需要 `!important`
就能同时接管明暗两套。同样的做法见 `halo-comment-widget`。

## 用法

在 `<head>` 里插入，条件与搜索按钮一致：

```html
<th:block
  th:if="${pluginFinder.available('PluginSearchWidget')}"
  th:insert="~{components/halo-search-widget/template :: head}"
></th:block>
```
