# 配置项参考

> 本文件由 `scripts/gen-settings-reference.py` 从 `settings.yaml` 生成，请勿手改。
> 改了配置就重新生成，这样它不会和实现脱节。

<!-- markdownlint-disable -->

共 18 个分组、310 个配置项。

| 分组 | 标签 | 配置项数 |
| --- | --- | --- |
| `global` | 全局 | 19 |
| `styles` | 总体样式 | 126 |
| `index_styles` | 首页样式 | 47 |
| `post_styles` | 文章页样式 | 31 |
| `categories_page_styles` | 分类集合页样式 | 6 |
| `category_page_styles` | 分类详情页样式 | 4 |
| `tags_page_styles` | 标签集合页样式 | 6 |
| `tag_page_styles` | 标签详情页样式 | 4 |
| `author_page_styles` | 作者详情页样式 | 3 |
| `archives_page_styles` | 归档页样式 | 5 |
| `custom_page_styles` | 自定义页面样式 | 8 |
| `error_page_styles` | 错误页样式 | 4 |
| `sns` | 社交资料/RSS | 8 |
| `share` | 自定义分享按钮 | 10 |
| `links_page_styles` | 链接页样式 | 3 |
| `photos_styles` | 图库页样式 | 12 |
| `moments_styles` | 瞬间页样式 | 6 |
| `friends_page_styles` | 朋友圈页面样式 | 8 |

## 全局

模板中访问：`theme.config.global.<配置项名>`

| 配置项 | 类型 | 标签 | 默认值 | 说明 |
| --- | --- | --- | --- | --- |
| `default_content_language` | 文本 | 默认内容语言 | `zh-CN` | 默认内容语言，例如：zh-CN、en。若此项为空，则默认为 zh-CN。切换语言的方法是在 URL 后添加 ?language=语言代码，例如：https://example.com/?language=en |
| `is_i18n_prefix_match_mode` | 开关 | 多语言功能前缀匹配模式 | 开 | 如启用此项，则多语言功能将启用前缀匹配模式，具体使用方法请看文档。 |
| `is_sync_language_cookie_to_content_language` | 开关 | 是否根据页面内容语言同步 Cookie 语言 | 开 | 开启后避免页面的固定文字（由主题提供的）与内容语言不同，但会导致额外的浏览器刷新。 |
| `is_auto_redirect_to_browser_language` | 开关 | 浏览器按语言自动跳转 | 关 | 如启用此项，若当前浏览器语言与默认内容语言不同，且存在对应语言的页面，将自动跳转到对应语言页面。 |
| `auto_redirect_target_language_list` | 对象数组 | 允许跳转的目标区域语言代码列表 | — | 未启用多语言功能前缀匹配模式时，按浏览器语言候选路径顺序匹配；启用后，放在前面的会被优先匹配。（仅当 `$is_auto_redirect_to_browser_language === true` 时显示） |
| └ `v` | 文本 | 语言代码 | — | 如 zh-CN、zh-TW、zh-Hans、zh-Hant、en、en-US |
| `is_i18n_menu_show` | 开关 | 多语言菜单支持 | 关 | 如启用此项，将启用多语言菜单支持，具体使用方法请看文档。 |
| `upgrade_insecure_requests` | 开关 | CSP:upgrade-insecure-requests | 关 | 如启用此项，非跳转（non-navigational）的不安全资源请求将会自动升级到 HTTPS（包括第当前域名以及第三方请求） |
| `anti_mirror_site` | 开关 | 仅允许使用指定域名访问 | 关 | 使用场景：防止站点被恶意镜像后的流量流失 |
| `allow_site_whitelist` | 对象数组 | 域名白名单列表 | — | （仅当 `$anti_mirror_site === true` 时显示） |
| └ `input_domain` | 文本 | Base64 编码后的域名 | — | 可使用 Base64 在线编码工具进行编码（编码前的内容仅包括域名，不包括协议（如 https://），端口（如 :8080），路径（如 /archive/1.html）。请在输入框输入编码后的内容！）例 1 编码前：example.c… |
| `target_url` | 文本 | 目标链接 | — | Base64 编码后的目标链接。检测到当前页面域名不在白名单中，就会跳转到目标链接（编码前的内容包括完整域名。请在输入框仅输入编码后的内容！）示例：编码前 https://example.com 编码后 aHR0cHM6Ly9leG… |
| `is_keep_path_and_query` | 开关 | 跳转后是否保留路径和查询参数 | 开 | 例：假设当前页面为 localhost/a/b?a=1，目标链接为 https://p.com。关闭此项会跳转到 https://p.com，而开启此项会跳转到 https://p.com/a/b?a=1（仅当 `$anti_mirr… |
| `is_performance_monitor_enable` | 开关 | 启用性能监测面板 | 关 | 如启用此项，主题将在页面中插入性能监测面板脚本。 |
| `is_instant_page_enable` | 开关 | instant.page 支持 | 关 | 如启用此项，主题将自动加载 instant.page 脚本，以提升页面加载速度。 |
| `is_mermaid_enable` | 开关 | Mermaid 支持 | 关 | 如启用此项，主题将自动加载 Mermaid 脚本，以启用对应支持。 |
| `mermaid_content_scope_selector` | 文本 | Mermaid 内容范围选择器 | `main` | 只在这个 CSS 选择器匹配的区域内查找 Mermaid 图表。（仅当 `$is_mermaid_enable === true` 时显示） |
| `mermaid_extra_source_element_selector` | 文本 | Mermaid 额外源元素选择器 | — | 用 CSS 选择器额外指定需要渲染为 Mermaid 图表的元素。命中的元素会从 textContent 读取图表源码；带 auto 类时渲染明暗两份，带 dark 类时只渲染暗色，带 light 类时只渲染亮色，否则默认渲染明暗两份… |
| `mermaid_config` | 代码 | Mermaid Config 属性 | `{ startOnLoad: false }` | 文档：https://mermaid.js.org/config/schema-docs/config.html#mermaid-config-properties（仅当 `$is_mermaid_enable === true` 时显示） |

## 总体样式

模板中访问：`theme.config.styles.<配置项名>`

| 配置项 | 类型 | 标签 | 默认值 | 说明 |
| --- | --- | --- | --- | --- |
| `is_cjk_serif_webfont_enable` | 开关 | 内置中文衬线字体 | 开 | 主题的展示级标题与引用使用衬线字体，但中文衬线是否存在取决于访客设备——Windows、macOS、iOS 自带，安卓不带，中文标题在安卓上会显示成黑体。启用后由主题自行提供（思源宋体子集，SIL OFL 1.1），所有访客字面一致。… |
| `is_custom_font_files_enable` | 开关 | 启用自定义字体文件 | 关 | 如启用此项，将使用上传的自定义字体文件替换默认字体。 |
| `custom_font_configs` | 对象数组 | 自定义字体文件 | — | （仅当 `$is_custom_font_files_enable === true` 时显示） |
| └ `font_style` | 下拉 | 字体样式 | `normal` | https://developer.mozilla.org/zh-CN/docs/Web/CSS/Reference/At-rules/@font-face/font-style |
| └ `custom_font_style` | 文本 | 自定义字体样式值 | `oblique 30deg 50deg` | （仅当 `$get(font_style).value === 'custom'` 时显示） |
| └ `font_weight` | 下拉 | 字体粗细 | `400` | https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@font-face/font-weight |
| └ `custom_font_weight` | 文本 | 自定义字体粗细值 | `1 1000` | （仅当 `$get(font_weight).value === 'custom'` 时显示） |
| └ `font_display` | 下拉 | 字体显示策略 | `swap` | https://developer.mozilla.org/zh-CN/docs/Web/CSS/Reference/At-rules/@font-face/font-display |
| └ `font_unicode_range` | 文本 | 字体 Unicode 范围 | — | 指定字体所支持的 Unicode 范围，例如：U+000-5FF（拉丁文和基本拉丁文补充）、U+4E00-9FFF（汉字）等。留空则表示支持所有 Unicode 字符。相关文档：https://developer.mozilla.or… |
| └ `font_file` | 附件 | 选择字体文件 | — | 上传 .woff2/.woff/.ttf/.otf/.eot/.ttc/.otc/.sfnt 字体文件，主题会优先使用这些文件替换默认字体 |
| `custom_font_name` | 文本 | 自定义字体名称 | — | 请填写上传字体文件内部声明的“字体全名 (nameID=4)”或“PostScript 名 (nameID=6)”，如：My Custom Font Regular 或 MyCustomFont-Regular；如果不知道也可以置空。… |
| `is_custom_cursor_files_enable` | 开关 | 启用自定义光标文件 | 关 | 如启用此项，将使用上传的自定义光标替换默认光标组。 |
| `is_show_unused_cursor_files` | 开关 | 展示未使用的光标文件配置项 | 关 | 一般无需启用此项。（仅当 `$is_custom_cursor_files_enable === true` 时显示） |
| `custom_cursor_files_auto` | 附件 | 选择自动指针文件（CSS 声明为 auto） | — | 上传 .cur/.png/.svg 等格式光标文件，主题会优先使用这些文件替换自动指针。描述：根据上下文自动选择合适的指针，可设定为默认指针。（仅当 `$is_custom_cursor_files_enable === true &… |
| `custom_cursor_files_default` | 附件 | 选择默认指针文件（CSS 声明为 default） | — | 上传 .cur/.png/.svg 等格式光标文件，主题会优先使用这些文件替换默认指针。描述：默认指针，通常是箭头。（仅当 `$is_custom_cursor_files_enable === true` 时显示） |
| `custom_cursor_files_context_menu` | 附件 | 选择菜单指针文件（CSS 声明为 context-menu） | — | 上传 .cur/.png/.svg 等格式光标文件，主题会优先使用这些文件替换菜单指针。描述：指针下有可用内容目录。（仅当 `$is_custom_cursor_files_enable === true && $is_show_un… |
| `custom_cursor_files_help` | 附件 | 选择帮助指针文件（CSS 声明为 help） | — | 上传 .cur/.png/.svg 等格式光标文件，主题会优先使用这些文件替换帮助指针。描述：指示帮助。（仅当 `$is_custom_cursor_files_enable === true` 时显示） |
| `custom_cursor_files_pointer` | 附件 | 选择指针文件（CSS 声明为 pointer） | — | 上传 .cur/.png/.svg 等格式光标文件，主题会优先使用这些文件替换指针。描述：悬浮于连接上时，通常为手。（仅当 `$is_custom_cursor_files_enable === true` 时显示） |
| `custom_cursor_files_progress` | 附件 | 选择进度指针文件（CSS 声明为 progress） | — | 上传 .cur/.png/.svg 等格式光标文件，主题会优先使用这些文件替换进度指针。描述：程序后台繁忙，用户仍可交互（与 wait 相反）。（仅当 `$is_custom_cursor_files_enable === true … |
| `custom_cursor_files_wait` | 附件 | 选择等待指针文件（CSS 声明为 wait） | — | 上传 .cur/.png/.svg 等格式光标文件，主题会优先使用这些文件替换等待指针。描述：程序繁忙，用户不可交互（与 progress 相反）。图标一般为沙漏或者表。（仅当 `$is_custom_cursor_files_ena… |
| `custom_cursor_files_cell` | 附件 | 选择单元格指针文件（CSS 声明为 cell） | — | 上传 .cur/.png/.svg 等格式光标文件，主题会优先使用这些文件替换单元格指针。描述：指示单元格可被选中。（仅当 `$is_custom_cursor_files_enable === true` 时显示） |
| `custom_cursor_files_crosshair` | 附件 | 选择十字指针文件（CSS 声明为 crosshair） | — | 上传 .cur/.png/.svg 等格式光标文件，主题会优先使用这些文件替换十字指针。描述：交叉指针，通常指示位图中的框选。（仅当 `$is_custom_cursor_files_enable === true` 时显示） |
| `custom_cursor_files_text` | 附件 | 选择文本指针文件（CSS 声明为 text） | — | 上传 .cur/.png/.svg 等格式光标文件，主题会优先使用这些文件替换文本指针。描述：指示文字可被选中。（仅当 `$is_custom_cursor_files_enable === true` 时显示） |
| `custom_cursor_files_vertical_text` | 附件 | 选择垂直文本指针文件（CSS 声明为 vertical-text） | — | 上传 .cur/.png/.svg 等格式光标文件，主题会优先使用这些文件替换垂直文本指针。描述：指示垂直文字可被选中。（仅当 `$is_custom_cursor_files_enable === true` 时显示） |
| `custom_cursor_files_alias` | 附件 | 选择别名指针文件（CSS 声明为 alias） | — | 上传 .cur/.png/.svg 等格式光标文件，主题会优先使用这些文件替换别名指针。描述：复制或快捷方式将要被创建。（仅当 `$is_custom_cursor_files_enable === true && $is_show_… |
| `custom_cursor_files_copy` | 附件 | 选择复制指针文件（CSS 声明为 copy） | — | 上传 .cur/.png/.svg 等格式光标文件，主题会优先使用这些文件替换复制指针。描述：指示可复制。（仅当 `$is_custom_cursor_files_enable === true` 时显示） |
| `custom_cursor_files_move` | 附件 | 选择移动指针文件（CSS 声明为 move） | — | 上传 .cur/.png/.svg 等格式光标文件，主题会优先使用这些文件替换移动指针。描述：被悬浮的物体可被移动。（仅当 `$is_custom_cursor_files_enable === true` 时显示） |
| `custom_cursor_files_no_drop` | 附件 | 选择禁止拖放指针文件（CSS 声明为 no-drop） | — | 上传 .cur/.png/.svg 等格式光标文件，主题会优先使用这些文件替换禁止拖放指针。描述：当前位置不能扔下。（仅当 `$is_custom_cursor_files_enable === true && $is_show_un… |
| `custom_cursor_files_not_allowed` | 附件 | 选择不允许指针文件（CSS 声明为 not-allowed） | — | 上传 .cur/.png/.svg 等格式光标文件，主题会优先使用这些文件替换不允许指针。描述：不能执行。（仅当 `$is_custom_cursor_files_enable === true` 时显示） |
| `custom_cursor_files_grab` | 附件 | 选择抓取指针文件（CSS 声明为 grab） | — | 上传 .cur/.png/.svg 等格式光标文件，主题会优先使用这些文件替换抓取指针。描述：可抓取。（仅当 `$is_custom_cursor_files_enable === true` 时显示） |
| `custom_cursor_files_grabbing` | 附件 | 选择抓取中指针文件（CSS 声明为 grabbing） | — | 上传 .cur/.png/.svg 等格式光标文件，主题会优先使用这些文件替换抓取中指针。描述：抓取中。（仅当 `$is_custom_cursor_files_enable === true` 时显示） |
| `custom_cursor_files_all_scroll` | 附件 | 选择全滚动指针文件（CSS 声明为 all-scroll） | — | 上传 .cur/.png/.svg 等格式光标文件，主题会优先使用这些文件替换全滚动指针。描述：元素可任意方向滚动（平移）。（仅当 `$is_custom_cursor_files_enable === true && $is_sho… |
| `custom_cursor_files_col_resize` | 附件 | 选择列调整指针文件（CSS 声明为 col-resize） | — | 上传 .cur/.png/.svg 等格式光标文件，主题会优先使用这些文件替换列调整指针。描述：元素可被重设宽度。通常被渲染为中间有一条竖线分割的左右两个箭头。（仅当 `$is_custom_cursor_files_enable =… |
| `custom_cursor_files_row_resize` | 附件 | 选择行调整指针文件（CSS 声明为 row-resize） | — | 上传 .cur/.png/.svg 等格式光标文件，主题会优先使用这些文件替换行调整指针。描述：元素可被重设高度。通常被渲染为中间有一条横线分割的上下两个箭头。（仅当 `$is_custom_cursor_files_enable =… |
| `custom_cursor_files_n_resize` | 附件 | 选择北调整指针文件（CSS 声明为 n-resize） | — | 上传 .cur/.png/.svg 等格式光标文件，主题会优先使用这些文件替换北调整指针。描述：某条边将被移动。例如元素盒的东南角被移动时使用 se-resize。（仅当 `$is_custom_cursor_files_enable… |
| `custom_cursor_files_e_resize` | 附件 | 选择东调整指针文件（CSS 声明为 e-resize） | — | 上传 .cur/.png/.svg 等格式光标文件，主题会优先使用这些文件替换东调整指针。描述：某条边将被移动。例如元素盒的东南角被移动时使用 se-resize。（仅当 `$is_custom_cursor_files_enable… |
| `custom_cursor_files_s_resize` | 附件 | 选择南调整指针文件（CSS 声明为 s-resize） | — | 上传 .cur/.png/.svg 等格式光标文件，主题会优先使用这些文件替换南调整指针。描述：某条边将被移动。例如元素盒的东南角被移动时使用 se-resize。（仅当 `$is_custom_cursor_files_enable… |
| `custom_cursor_files_w_resize` | 附件 | 选择西调整指针文件（CSS 声明为 w-resize） | — | 上传 .cur/.png/.svg 等格式光标文件，主题会优先使用这些文件替换西调整指针。描述：某条边将被移动。例如元素盒的东南角被移动时使用 se-resize。（仅当 `$is_custom_cursor_files_enable… |
| `custom_cursor_files_ne_resize` | 附件 | 选择东北调整指针文件（CSS 声明为 ne-resize） | — | 上传 .cur/.png/.svg 等格式光标文件，主题会优先使用这些文件替换东北调整指针。描述：某条边将被移动。例如元素盒的东南角被移动时使用 se-resize。（仅当 `$is_custom_cursor_files_enabl… |
| `custom_cursor_files_nw_resize` | 附件 | 选择西北调整指针文件（CSS 声明为 nw-resize） | — | 上传 .cur/.png/.svg 等格式光标文件，主题会优先使用这些文件替换西北调整指针。描述：某条边将被移动。例如元素盒的东南角被移动时使用 se-resize。（仅当 `$is_custom_cursor_files_enabl… |
| `custom_cursor_files_se_resize` | 附件 | 选择东南调整指针文件（CSS 声明为 se-resize） | — | 上传 .cur/.png/.svg 等格式光标文件，主题会优先使用这些文件替换东南调整指针。描述：某条边将被移动。例如元素盒的东南角被移动时使用 se-resize。（仅当 `$is_custom_cursor_files_enabl… |
| `custom_cursor_files_sw_resize` | 附件 | 选择西南调整指针文件（CSS 声明为 sw-resize） | — | 上传 .cur/.png/.svg 等格式光标文件，主题会优先使用这些文件替换西南调整指针。描述：某条边将被移动。例如元素盒的东南角被移动时使用 se-resize。（仅当 `$is_custom_cursor_files_enabl… |
| `custom_cursor_files_ew_resize` | 附件 | 选择东西调整指针文件（CSS 声明为 ew-resize） | — | 上传 .cur/.png/.svg 等格式光标文件，主题会优先使用这些文件替换东西调整指针。描述：指示双向重新设置大小。（仅当 `$is_custom_cursor_files_enable === true && $is_show_… |
| `custom_cursor_files_ns_resize` | 附件 | 选择南北调整指针文件（CSS 声明为 ns-resize） | — | 上传 .cur/.png/.svg 等格式光标文件，主题会优先使用这些文件替换南北调整指针。描述：指示双向重新设置大小。（仅当 `$is_custom_cursor_files_enable === true && $is_show_… |
| `custom_cursor_files_nesw_resize` | 附件 | 选择东北西南调整指针文件（CSS 声明为 nesw-resize） | — | 上传 .cur/.png/.svg 等格式光标文件，主题会优先使用这些文件替换东北西南调整指针。描述：指示双向重新设置大小。（仅当 `$is_custom_cursor_files_enable === true && $is_sho… |
| `custom_cursor_files_nwse_resize` | 附件 | 选择西北东南调整指针文件（CSS 声明为 nwse-resize） | — | 上传 .cur/.png/.svg 等格式光标文件，主题会优先使用这些文件替换西北东南调整指针。描述：指示双向重新设置大小。（仅当 `$is_custom_cursor_files_enable === true && $is_sho… |
| `custom_cursor_files_zoom_in` | 附件 | 选择放大指针文件（CSS 声明为 zoom-in） | — | 上传 .cur/.png/.svg 等格式光标文件，主题会优先使用这些文件替换放大指针。描述：指示可被放大。（仅当 `$is_custom_cursor_files_enable === true && $is_show_unused… |
| `custom_cursor_files_zoom_out` | 附件 | 选择缩小指针文件（CSS 声明为 zoom-out） | — | 上传 .cur/.png/.svg 等格式光标文件，主题会优先使用这些文件替换缩小指针。描述：指示可被缩小。（仅当 `$is_custom_cursor_files_enable === true && $is_show_unused… |
| `color_schema` | 下拉 | 配色方案 | `auto` | 若启用“深浅色模式切换按钮”，这项决定了网站刚加载完成时的配色方案。 |
| `custom_color_schema_init_id` | 数字 | 自定义配色方案识别码 | — | 请先创建自定义配色方案，随后在此填写自定义配色方案识别码（仅当 `$color_schema === 'custom'` 时显示） |
| `custom_color_schema` | 对象数组 | 自定义配色方案 | — |  |
| └ `id` | 数字 | 自定义配色方案识别码 | `1` | 唯一识别码，请勿重复 |
| └ `type` | 下拉 | 主题色彩模式 | `dark` |  |
| └ `is_css_variable_mode` | 开关 | CSS 变量模式 | 关 | 若启用此项，将使用 CSS 变量来定义配色方案。切换此选项后请点击下方提交按钮，之后重新打开此项，才能正常加载子选项。 |
| └ `primary_color` | 颜色 | 主题主色调 | `#2bbc8a` | 主品牌色，用于按钮、链接等核心交互元素，对应 CSS 变量 --color-primary。（仅当 `$get(is_css_variable_mode).value === false` 时显示） |
| └ `primary_content_color` | 颜色 | 主色文字 | `#212326` | 主色下的文字/图标颜色，对应 CSS 变量 --color-primary-content。（仅当 `$get(is_css_variable_mode).value === false` 时显示） |
| └ `secondary_color` | 颜色 | 次要品牌色 | `#ccffb6` | 自然的辅助色，用于次级按钮或背景，对应 CSS 变量 --color-secondary。（仅当 `$get(is_css_variable_mode).value === false` 时显示） |
| └ `secondary_content_color` | 颜色 | 次要色文字 | `#d5d7d8` | 次要色上的正文/图标颜色，对应 CSS 变量 --color-secondary-content。（仅当 `$get(is_css_variable_mode).value === false` 时显示） |
| └ `accent_color` | 颜色 | 强调品牌色 | `#d480aa` | 高对比强调色，用于点缀和状态提醒，对应 CSS 变量 --color-accent。（仅当 `$get(is_css_variable_mode).value === false` 时显示） |
| └ `accent_content_color` | 颜色 | 强调色文字 | `#212326` | 强调色下的前景内容颜色，对应 CSS 变量 --color-accent-content。（仅当 `$get(is_css_variable_mode).value === false` 时显示） |
| └ `neutral_color` | 颜色 | 中性深色 | `#1d1f21` | UI 中非饱和部分的底色，对应 CSS 变量 --color-neutral。（仅当 `$get(is_css_variable_mode).value === false` 时显示） |
| └ `neutral_content_color` | 颜色 | 中性色文字 | `#d5d7d8` | 中性背景下的前景颜色，对应 CSS 变量 --color-neutral-content。（仅当 `$get(is_css_variable_mode).value === false` 时显示） |
| └ `base_100_color` | 颜色 | 页面基础面 | `#212326` | HTML 主要画布背景色，对应 CSS 变量 --color-base-100。（仅当 `$get(is_css_variable_mode).value === false` 时显示） |
| └ `base_200_color` | 颜色 | 基色 200 | `#1c1c1c` | 更深的背景层次，对应 CSS 变量 --color-base-200。（仅当 `$get(is_css_variable_mode).value === false` 时显示） |
| └ `base_300_color` | 颜色 | 基色 300 | `#181818` | 更深底层，对应 CSS 变量 --color-base-300。（仅当 `$get(is_css_variable_mode).value === false` 时显示） |
| └ `base_content_color` | 颜色 | 基色文字 | `#d5d7d8` | 基色上的前景内容，对应 CSS 变量 --color-base-content。（仅当 `$get(is_css_variable_mode).value === false` 时显示） |
| └ `is_raw_css_output_mode` | 开关 | CSS 原始输出模式 | 关 | 关闭此项后，仅需填写自定义 CSS 变量的部分，输出时会自动输出在对应 CSS 选择器中（选择器为 html[theme="theme-{id}"]（填写的”识别码“替换 {id}））。（仅当 `$get(is_css_variabl… |
| └ `custom_css` | 代码 | 自定义 CSS 变量 | — | 12 个语义 token 的含义与取值示例见仓库内 docs/DESIGN.md 的「配色实现」一节。（仅当 `$get(is_css_variable_mode).value === true` 时显示） |
| `is_show_color_scheme_toggle_button` | 开关 | 深浅色模式切换按钮 | 关 | （切换此项后，请点击下方保存按钮，再之后刷新此页面）若启用此项，将在大标题旁显示明暗模式切换按钮。并且在 浅色模式 -> 深色模式 -> 自动模式 -> 浅色模式 中自动切换。注：“自动模式配色方案”选择一种浅色方案即可禁用自动模式。… |
| `theme_auto` | 下拉 | 自动模式配色方案 | `auto` | （仅当 `$is_show_color_scheme_toggle_button===true` 时显示） |
| `custom_theme_auto_id` | 数字 | 自定义配色方案识别码 | — | 请先创建自定义配色方案，随后在此填写自定义配色方案识别码（仅当 `$is_show_color_scheme_toggle_button == true && $theme_auto === 'custom'` 时显示） |
| `theme_light` | 下拉 | 浅色模式配色方案 | `light` | （仅当 `$is_show_color_scheme_toggle_button===true` 时显示） |
| `custom_theme_light_id` | 数字 | 自定义配色方案识别码 | — | 请先创建自定义配色方案，随后在此填写自定义配色方案识别码（仅当 `$is_show_color_scheme_toggle_button == true && $theme_light === 'custom'` 时显示） |
| `theme_dark` | 下拉 | 深色模式配色方案 | `dark` | （仅当 `$is_show_color_scheme_toggle_button===true` 时显示） |
| `custom_theme_dark_id` | 数字 | 自定义配色方案识别码 | — | 请先创建自定义配色方案，随后在此填写自定义配色方案识别码（仅当 `$is_show_color_scheme_toggle_button == true && $theme_dark === 'custom'` 时显示） |
| `is_auto_switch_color_scheme_based_on_browser_settings` | 开关 | 根据浏览器设置自动切换配色 | 开 | 如果启用这项，首先会读取浏览器中已保存的配色选择，如果没有保存的选择，则会根据浏览器主题设置自动切换为浅/深色配色。（仅当 `$is_show_color_scheme_toggle_button===true` 时显示） |
| `is_save_color_scheme_settings_to_browser` | 开关 | 保存配色设置到浏览器中 | 开 | 如果启用这项，按下配色切换按钮后，将会保存当前的配色选择到浏览器存储中。（仅当 `$is_show_color_scheme_toggle_button===true` 时显示） |
| `text_size` | 下拉 | 字体大小 | `normal` |  |
| `inline_code_style` | 下拉 | 行内代码样式 | `dotted-border` | 选择全局行内代码样式。默认保持基础 `code` 样式中的虚线边框风格，其他选项会覆盖为不同的高亮方案，但不会影响多行代码块。 |
| `dark_content_text_style` | 下拉 | 深色正文样式 | `soft-gray` | 选择深色模式下正文文本的样式。`轻柔灰` 会让正文文字在深色模式下更柔和一些，并让深色字体/标题与正文字体的对比更明显，减轻纯白文字带来的偏亮、偏粗观感。 |
| `is_max_width_settings` | 开关 | 自定义内容区域最大宽度 | 开 | 如不开启此项，内容区域最大宽度会随着页面宽度变化而变化。但可能出现内容整体偏左的现象。建议关闭此项的同时开启“内容区域最小宽度”，“自定义内容区域宽度属性”并保持默认值。 |
| `max_width` | 文本 | 内容区域最大宽度 | `48rem` | 允许全部 CSS 长度单位，如：48rem, 780px, 70vw, 70%。宽度最大值设置较大时可能会出现内容整体偏左的现象。为解决这个问题，可同时开启“内容区域最小宽度”，“自定义内容区域宽度属性”并保持默认值。（仅当 `$is… |
| `is_min_width_settings` | 开关 | 自定义内容区域最小宽度 | 关 |  |
| `min_width` | 文本 | 内容区域最小宽度 | `48rem` | 允许全部 CSS 长度单位，如：48rem, 780px, 70vw, 70%。当此设置宽度大于窗口宽度时，主题会使用窗口宽度。以避免出现横向滚动条。（仅当 `$is_min_width_settings===true` 时显示） |
| `is_force_min_width_settings` | 开关 | 强制应用内容区域最小宽度 | 关 | 启用时，强制使内容显示区域不小于设定的最小宽度，即使出现横向滚动条。（仅当 `$is_min_width_settings===true` 时显示） |
| `is_content_width_style_settings` | 开关 | 自定义内容区域宽度属性 | 关 | 如不开启此项，内容区域宽度默认设置为最大宽度 |
| `content_width_style` | 文本 | 内容区域宽度样式 | `fit-content` | 此项决定了内容区域宽度。默认值效果为：使内容区域宽度=最宽的内容的宽度。（此项实际是在设置内容区域的 width 属性对应的样式值）（仅当 `$is_content_width_style_settings===true` 时显示） |
| `is_show_header_icon` | 开关 | 是否显示页眉头像 | 关 |  |
| `icon` | 附件 | 自定义页眉头像 | — | （仅当 `$is_show_header_icon===true` 时显示） |
| `avatar_circle` | 开关 | 圆形头像 | 关 | （仅当 `$is_show_header_icon===true` 时显示） |
| `avatar_grayout` | 开关 | 灰度头像 | 关 | （仅当 `$is_show_header_icon===true` 时显示） |
| `extra_menu_items` | 对象数组 | 额外菜单项 | `[{'type': 'search'}]` | 在菜单中添加额外的菜单项 |
| └ `type` | 下拉 | 菜单项类型 | `search` |  |
| `is_show_header_menu` | 开关 | 显示页眉菜单 | 开 |  |
| `is_show_page_number` | 开关 | 显示页码 | 开 |  |
| `is_footer_site_stats_show` | 开关 | 页面底部站点统计信息 | 关 |  |
| `footer_site_stats` | 对象数组 | 统计项设置 | `[{'type': 'visit', 'i18n_text': True, 'icon': ''}, {'type': 'post', 'i18n_text': True, 'icon': ''}, {'type': 'upvote', 'i18n_text': True, 'icon': ''}, {'type': 'comment', 'i18n_text': True, 'icon': ''}, {'type': 'category', 'i18n_text': True, 'icon': ''}, {'type': 'wordcount', 'i18n_text': True, 'icon': ''}]` | （仅当 `$is_footer_site_stats_show === true` 时显示） |
| └ `type` | 下拉 | 统计项 | `visit` |  |
| └ `i18n_text` | 开关 | 多语言文本包裹数字 | 开 |  |
| └ `icon` | 图标 | 文字左侧的图标 | — |  |
| `is_footer_theme_info_show` | 开关 | 页面底部主题信息 | 开 |  |
| `footer_theme_info_theme_name` | 单选 | 页面底部主题信息所展示的主题名 | `Clay` | （仅当 `$is_footer_theme_info_show === true` 时显示） |
| `footer_theme_info_halo_version_name` | 单选 | 页面底部主题信息所展示的 Halo 版本 | `Halo` | （仅当 `$is_footer_theme_info_show === true` 时显示） |
| `is_footer_copyright_show` | 开关 | 页面底部版权信息 | 开 |  |
| `footer_copyright_custom_name` | 文本 | 版权信息自定义署名 | — | 如果不填写，则使用站点标题作为署名（仅当 `$is_footer_copyright_show === true` 时显示） |
| `is_footer_force_bottom` | 开关 | 强制页脚在页面底部 | 开 |  |
| `is_footer_menu_show` | 开关 | 页面底部菜单 | 开 |  |
| `is_footer_content_show` | 开关 | 添加内容到页面最底部/侧边栏 | 关 | 开启后，可在“内容显示位置”中选择显示为页面底部内容（内联）或悬浮侧边栏（角落）。 |
| `footer_content` | 代码 | 页面底部/侧边栏内容 | — | 支持 HTML 代码块（仅当 `$is_footer_content_show === true` 时显示） |
| `is_18n_footer_content_show` | 开关 | 多语言页面底部/侧边栏内容支持 | 关 | 开启后，可为不同语言分别配置页面底部/侧边栏内容。 |
| `i18n_footer_content` | 对象数组 | 自定义多语言页面底部/侧边栏内容 | — | （仅当 `$is_18n_footer_content_show === true` 时显示） |
| └ `lang` | 文本 | 语言代码 | `zh-CN` |  |
| └ `footer_content` | 代码 | 页面底部/侧边栏内容 | — | 支持 HTML 代码块 |
| `footer_content_sidebar_position` | 下拉 | 内容显示方式 | `inline` | 选择“内联（页面底部）”时显示在页面最底部；选择角落位置时显示为悬浮侧边栏。（仅当 `$is_footer_content_show === true \|\| $is_18n_footer_content_show === true… |
| `footer_content_sidebar_opacity` | 数字 | 侧边栏悬浮透明度 | `1` | 取值范围 0（完全透明）到 1（完全不透明）（仅当 `($is_footer_content_show === true \|\| $is_18n_footer_content_show === true) && $footer_co… |
| `footer_content_sidebar_narrow` | 下拉 | 平板和手机端侧边栏显示行为 | `hide` | 视口宽度小于 1024px（平板及手机）时的显示行为。（仅当 `($is_footer_content_show === true \|\| $is_18n_footer_content_show === true) && $foot… |
| `is_h3_underline` | 开关 | 为三级标题添加下划线 | 开 | 开启后，三级标题（h3）下方将显示下划线装饰，让标题更加突出。 |
| `is_preserve_empty_lines_in_blockquote` | 开关 | 引用块保留空行 | 开 | 如启用此项，将在保留引用块中的空行，否则将自动删除引用块中的空行。引用块在 Markdown 中使用 > 表示。 |
| `is_show_the_quote_before_blockquote` | 开关 | 引用块前添加引号 | 开 | 如启用此项，将在引用块前添加引号。引用块在 Markdown 中使用 > 表示。 |
| `is_show_the_quote_after_blockquote` | 开关 | 引用块后添加引号 | 关 | 如启用此项，将在引用块后添加引号。引用块在 Markdown 中使用 > 表示。 |
| `is_show_the_table_bottom_border` | 开关 | 表格行间线（除表头） | 关 | 如启用此项，表格每行底部都将添加表格线（除去表头） |
| `table_bottom_border_width` | 文本 | 表格行间线宽度（除表头） | `0.1rem` | 允许全部 CSS 长度单位，如：48rem, 780px, 70vw, 70%。（仅当 `$is_show_the_table_bottom_border===true` 时显示） |
| `heading_margin_top_multiplier` | 数字 | 标题上边距倍率 | `1` | 设置标题 (h1, h2 等) 的上边距 (margin-top) 倍率，值为 1 表示使用默认边距，小于 1 减小边距，大于 1 增加边距 |
| `heading_margin_bottom_multiplier` | 数字 | 标题下边距倍率 | `1` | 设置标题 (h1, h2 等) 的下边距 (margin-bottom) 倍率，值为 1 表示使用默认边距，小于 1 减小边距，大于 1 增加边距 |
| `paragraph_margin_top_multiplier` | 数字 | 段落上边距倍率 | `1` | 设置段落 (p 标签) 的上边距倍率，值为 1 表示使用默认边距，小于 1 减小边距，大于 1 增加边距 |
| `paragraph_margin_bottom_multiplier` | 数字 | 段落下边距倍率 | `1` | 设置段落 (p 标签) 的下边距倍率，值为 1 表示使用默认边距，小于 1 减小边距，大于 1 增加边距 |

## 首页样式

模板中访问：`theme.config.index_styles.<配置项名>`

| 配置项 | 类型 | 标签 | 默认值 | 说明 |
| --- | --- | --- | --- | --- |
| `page_html_title` | 文本 | 主页 HTML 标题 | — | 如置空则取值自“Halo 设置 - 基本设置 - 站点标题” |
| `is_enable_canonical_link` | 开关 | 输出 canonical 标签 | 开 |  |
| `quote` | 开关 | 一言 | 关 |  |
| `quote_link` | 文本 | 一言链接 | `https://v1.hitokoto.cn/?encode=text` | 默认值：https://v1.hitokoto.cn/?encode=text、接口需返回纯文本；由于该接口由浏览器客户端发起请求，若配置的地址不是同源地址，则目标接口必须支持跨域请求（CORS），否则将无法加载一言内容。默认接口文档… |
| `is_quote_fade_in_animation_enable` | 开关 | 一言淡入显示动画 | 开 | （仅当 `$quote === true` 时显示） |
| `is_random_sentence_show` | 开关 | 自定义随机显示一句话 | 关 |  |
| `random_sentence_list` | 对象数组 | 自定义句子内容 | — | （仅当 `$is_random_sentence_show === true` 时显示） |
| └ `sentence` | 文本 | 一句话 | — |  |
| `is_resume_show` | 开关 | 个人简介/公告栏 | 开 |  |
| `resume` | 代码 | 个人简介/公告栏内容 | — | 支持 HTML 代码块（仅当 `$is_resume_show === true` 时显示） |
| `is_i18n_resume_show` | 开关 | 多语言个人简介/公告栏支持 | 关 |  |
| `i18n_resume` | 对象数组 | 自定义多语言公告栏内容 | — | （仅当 `$is_i18n_resume_show === true` 时显示） |
| └ `lang` | 文本 | 语言代码 | `zh-CN` |  |
| └ `resume` | 代码 | 个人简介/公告栏内容 | — | 支持 HTML 代码块 |
| `is_show_find_me_left_text` | 开关 | 社交资料图标左侧文字 | 开 | 如关闭此项，将隐藏社交资料图标左侧文字 |
| `is_show_index_post_list_title` | 开关 | 首页文章列表标题 | 开 | 如关闭此项，首页文章列表将不显示标题 |
| `list_layout` | 下拉 | 主页列表布局 | `post-list-summary` | “瞬间列表”需“瞬间”插件启用方可正常使用，“朋友圈列表”需“朋友圈”插件启用方可正常使用 |
| `is_show_post_pubdate_in_simple_post_list` | 开关 | 简洁列表显示发布日期 | 开 | （仅当 `$list_layout === 'simple-post-list'` 时显示） |
| `is_show_post_views_in_simple_post_list` | 开关 | 简洁列表显示文章阅读量 | 关 | （仅当 `$list_layout === 'simple-post-list'` 时显示） |
| `is_show_post_pubdate_in_post_list_summary` | 开关 | 多元列表显示发布日期 | 开 | （仅当 `$list_layout === 'post-list-summary'` 时显示） |
| `is_show_post_categories_in_post_list_summary` | 开关 | 多元列表显示文章分类 | 开 | （仅当 `$list_layout === 'post-list-summary'` 时显示） |
| `is_show_post_tags_in_post_list_summary` | 开关 | 多元列表显示文章标签 | 开 | （仅当 `$list_layout === 'post-list-summary'` 时显示） |
| `is_show_post_views_in_post_list_summary` | 开关 | 多元列表显示文章阅读量 | 开 | （仅当 `$list_layout === 'post-list-summary'` 时显示） |
| `is_show_post_estimated_reading_time_in_post_list_summary` | 开关 | 多元列表显示文章预计阅读时间 | 关 | （仅当 `$list_layout === 'post-list-summary'` 时显示） |
| `is_show_post_word_count_in_post_list_summary` | 开关 | 多元列表显示文章字数统计 | 关 | （仅当 `$list_layout === 'post-list-summary'` 时显示） |
| `is_show_post_excerpt_in_post_list_summary` | 开关 | 多元列表显示文章摘要 | 开 | （仅当 `$list_layout === 'post-list-summary'` 时显示） |
| `post_excerpt_max_lines` | 数字 | 多元列表文章摘要行数上限 | `3` | 填写值范围为 1-5（仅当 `$list_layout === 'post-list-summary'` 时显示） |
| `is_show_index_post_list_permalink_text` | 开关 | 多元列表跳转文章链接所用提示文字 | 开 | 如关闭此项，首页文章列表文章项将不显示跳转链接文字（仅当 `$list_layout === 'post-list-summary'` 时显示） |
| `is_show_post_cover_in_post_list_summary` | 开关 | 多元列表显示文章封面 | 开 | （仅当 `$list_layout === 'post-list-summary'` 时显示） |
| `moment_list_page_size` | 数字 | 瞬间列表显示条数 | `10` | （仅当 `$list_layout === 'moment-list-summary'` 时显示） |
| `is_show_moment_avatar` | 开关 | 瞬间列表显示条目作者头像 | 开 | （仅当 `$list_layout === 'moment-list-summary'` 时显示） |
| `is_show_moment_nickname` | 开关 | 瞬间列表显示条目作者昵称 | 开 | （仅当 `$list_layout === 'moment-list-summary'` 时显示） |
| `is_show_moment_pubdate` | 开关 | 瞬间列表显示条目发布时间 | 开 | （仅当 `$list_layout === 'moment-list-summary'` 时显示） |
| `is_show_moment_estimated_reading_time` | 开关 | 瞬间列表显示条目预计阅读时间 | 关 | （仅当 `$list_layout === 'moment-list-summary'` 时显示） |
| `is_show_moment_word_count` | 开关 | 瞬间列表显示条目字数统计 | 关 | （仅当 `$list_layout === 'moment-list-summary'` 时显示） |
| `is_moment_upvote_button_show` | 开关 | 瞬间列表启用点赞按钮 | 开 | （仅当 `$list_layout === 'moment-list-summary'` 时显示） |
| `is_moment_comment_section_show` | 开关 | 瞬间列表启用评论区 | 开 | （仅当 `$list_layout === 'moment-list-summary'` 时显示） |
| `friends_list_page_size` | 数字 | 朋友圈列表显示条数 | `10` | （仅当 `$list_layout === 'friends-list-summary'` 时显示） |
| `is_show_friend_pubdate` | 开关 | 朋友圈列表显示发布日期 | 开 | （仅当 `$list_layout === 'friends-list-summary'` 时显示） |
| `is_show_friend_author` | 开关 | 朋友圈列表显示作者信息 | 开 | 作者信息包括作者头像和名称（仅当 `$list_layout === 'friends-list-summary'` 时显示） |
| `is_show_friend_author_avatar` | 开关 | 朋友圈列表显示作者头像 | 开 | （仅当 `$list_layout === 'friends-list-summary' && $is_show_friend_author === true` 时显示） |
| `is_show_friend_author_name` | 开关 | 朋友圈列表显示作者名称 | 开 | （仅当 `$list_layout === 'friends-list-summary' && $is_show_friend_author === true` 时显示） |
| `is_show_friend_description` | 开关 | 朋友圈列表显示文章描述 | 开 | （仅当 `$list_layout === 'friends-list-summary'` 时显示） |
| `friend_description_max_lines` | 数字 | 朋友圈列表文章描述行数上限 | `3` | 填写值范围为 1-5（仅当 `$list_layout === 'friends-list-summary' && $is_show_friend_description === true` 时显示） |
| `is_show_friend_permalink_text` | 开关 | 朋友圈列表显示跳转链接提示文字 | 开 | 如关闭此项，朋友圈列表文章项将不显示跳转链接文字（仅当 `$list_layout === 'friends-list-summary'` 时显示） |
| `is_pin_icon_show` | 开关 | 文章列表置顶图标 | 开 |  |
| `pin_icon_position` | 下拉 | 置顶图标位置 | `right` | （仅当 `$is_pin_icon_show===true` 时显示） |

## 文章页样式

模板中访问：`theme.config.post_styles.<配置项名>`

| 配置项 | 类型 | 标签 | 默认值 | 说明 |
| --- | --- | --- | --- | --- |
| `is_enable_canonical_link` | 开关 | 输出 canonical 标签 | 开 |  |
| `is_optimize_content_paragraph_spacing` | 开关 | 优化文章段落空行显示 | 关 | 启用后，为文章内容段落添加最小高度，改善空行显示效果 |
| `is_enable_paragraph_first_line_indent` | 开关 | 段落首行缩进 | 关 | 启用后，文章段落将使用首行缩进样式，通常为 2 个汉字宽度（2em） |
| `paragraph_first_line_indent_value` | 文本 | 首行缩进值 | `2em` | 设置首行缩进的大小。允许使用所有 CSS 长度单位，如：2em, 32px, 2rem 等。推荐使用 2em（仅当 `$is_enable_paragraph_first_line_indent === true` 时显示） |
| `post_title_uppper` | 开关 | 文章标题大写 | 关 |  |
| `is_show_post_publish_time` | 开关 | 文章发布时间 | 开 |  |
| `is_show_post_publish_time_left_text` | 开关 | 文章发布时间左侧文字 | 关 | （仅当 `$is_show_post_publish_time === true` 时显示） |
| `is_show_post_updated_time` | 开关 | 文章更新时间 | 关 |  |
| `is_show_post_updated_time_left_text` | 开关 | 文章更新时间左侧文字 | 关 | （仅当 `$is_show_post_updated_time === true` 时显示） |
| `is_show_post_views` | 开关 | 文章阅读量 | 开 |  |
| `is_show_post_estimated_reading_time` | 开关 | 文章预计阅读时间 | 关 |  |
| `is_show_post_word_count` | 开关 | 文章字数统计 | 关 |  |
| `is_show_post_nav_share_button` | 开关 | 桌面端菜单中的分享按钮 | 开 |  |
| `heading_anchor_symbol` | 文本 | 标题锚点符号 | — | 自定义文章页及独立页面标题锚点链接前显示的符号，置空则使用默认值 #。支持任意字符串，如 § ¶ 🔗。配置了下方标题锚点图标后此设置将被覆盖。 |
| `is_heading_anchor_symbol_raw` | 开关 | 标题锚点符号原始输出 | 关 | 开启后，上方标题锚点符号的值将不加引号地直接设置为 CSS 变量的值，适合有 CSS content 属性语法基础的进阶用户使用。 |
| `heading_anchor_svg` | 图标 | 标题锚点图标 | — | 配置后将覆盖上方的标题锚点符号设置。 |
| `is_custom_toc_max_width` | 开关 | 自定义侧边目录最大宽度 | 关 | 开启后可以设置文章页面右侧边栏目录的最大宽度。 |
| `toc_max_width` | 文本 | 侧边目录最大宽度 | `20rem` | 控制文章右侧边栏目录的最大宽度。允许全部 CSS 长度单位，如：20rem, 300px, 30vw。（仅当 `$is_custom_toc_max_width === true` 时显示） |
| `is_dividing_line_at_the_end_of_post_show` | 开关 | 文章末尾的的分隔线 | 开 |  |
| `is_post_upvote_button_show` | 开关 | 文章底部的点赞按钮 | 关 |  |
| `post_upvote_button_width` | 文本 | 点赞图标宽度 | `1em` | 设置心形图标的宽度（按钮本身是内容宽度的胶囊）。允许使用所有 CSS 长度单位；1em 表示跟随按钮字号。（仅当 `$is_post_upvote_button_show === true` 时显示） |
| `post_upvote_button_height` | 文本 | 点赞图标高度 | `1em` | 设置心形图标的高度（按钮本身是内容宽度的胶囊）。允许使用所有 CSS 长度单位；1em 表示跟随按钮字号。（仅当 `$is_post_upvote_button_show === true` 时显示） |
| `is_show_post_upvote_count` | 开关 | 展示文章获赞数 | 开 | （仅当 `$is_post_upvote_button_show === true` 时显示） |
| `post_upvote_button_position` | 下拉 | 点赞按钮位置 | `center` | （仅当 `$is_post_upvote_button_show === true` 时显示） |
| `is_post_recommended_articles_show` | 开关 | 文章底部的推荐文章 | 关 | 开启后将在文章底部显示推荐文章列表。 |
| `post_recommended_articles_count` | 数字 | 推荐文章数量 | `3` | 设置文章底部显示的推荐文章数量（仅当 `$is_post_recommended_articles_show === true` 时显示） |
| `is_post_prev_next_navigation_show` | 开关 | 文章底部的相邻文章导航 | 关 | 开启后将在文章底部显示上一篇和下一篇文章的导航链接 |
| `is_post_comment_section_show` | 开关 | 文章评论区 | 开 |  |
| `is_show_footer_nav` | 开关 | 移动端底部导航栏 | 开 |  |
| `is_show_home_footer` | 开关 | 移动端底部导航栏中的首页按钮 | 开 | （仅当 `$is_show_footer_nav === true` 时显示） |
| `is_show_share_footer` | 开关 | 移动端底部导航栏中的分享按钮 | 开 | （仅当 `$is_show_footer_nav === true` 时显示） |

## 分类集合页样式

模板中访问：`theme.config.categories_page_styles.<配置项名>`

| 配置项 | 类型 | 标签 | 默认值 | 说明 |
| --- | --- | --- | --- | --- |
| `description` | 文本 | 页面描述 | — | 设置页面的 meta description；为空时回退到站点 SEO 描述 |
| `is_enable_canonical_link` | 开关 | 输出 canonical 标签 | 开 |  |
| `is_show_the_number_of_articles_per_category` | 开关 | 显示每个分类下的文章数量 | 开 |  |
| `characters_to_the_left_of_the_number_of_posts` | 文本 | 在文章数量左侧的字符 | `(` | （仅当 `$is_show_the_number_of_articles_per_category === true` 时显示） |
| `characters_to_the_right_of_the_number_of_posts` | 文本 | 在文章数量右侧的字符 | `)` | （仅当 `$is_show_the_number_of_articles_per_category === true` 时显示） |
| `is_show_multi_layer_categories` | 开关 | 显示多层分类 | 开 |  |

## 分类详情页样式

模板中访问：`theme.config.category_page_styles.<配置项名>`

| 配置项 | 类型 | 标签 | 默认值 | 说明 |
| --- | --- | --- | --- | --- |
| `is_enable_canonical_link` | 开关 | 输出 canonical 标签 | 开 |  |
| `is_show_rss_button` | 开关 | 分类 RSS 订阅按钮 | 关 | 需启用 RSS 插件（https://www.halo.run/store/apps/app-KhIVw） |
| `is_show_post_pubdate_in_post_list` | 开关 | 文章列表显示文章发布时间 | 开 |  |
| `is_show_post_views_in_post_list` | 开关 | 文章列表显示文章阅读量 | 关 |  |

## 标签集合页样式

模板中访问：`theme.config.tags_page_styles.<配置项名>`

| 配置项 | 类型 | 标签 | 默认值 | 说明 |
| --- | --- | --- | --- | --- |
| `description` | 文本 | 页面描述 | — | 设置页面的 meta description；为空时回退到站点 SEO 描述 |
| `is_enable_canonical_link` | 开关 | 输出 canonical 标签 | 开 |  |
| `is_show_the_number_of_posts_per_tag` | 开关 | 显示每个标签下的文章数量 | 开 |  |
| `characters_to_the_left_of_the_number_of_posts` | 文本 | 在文章数量左侧的字符 | `(` | （仅当 `$is_show_the_number_of_posts_per_tag === true` 时显示） |
| `characters_to_the_right_of_the_number_of_posts` | 文本 | 在文章数量右侧的字符 | `)` | （仅当 `$is_show_the_number_of_posts_per_tag === true` 时显示） |
| `tags_sort_order` | 下拉 | 标签排序方式 | `default` | 选择标签在标签集合页的排序方式 |

## 标签详情页样式

模板中访问：`theme.config.tag_page_styles.<配置项名>`

| 配置项 | 类型 | 标签 | 默认值 | 说明 |
| --- | --- | --- | --- | --- |
| `is_enable_canonical_link` | 开关 | 输出 canonical 标签 | 开 |  |
| `is_show_rss_button` | 开关 | 显示标签 RSS 订阅按钮 | 关 | 需启用 RSS 插件（https://www.halo.run/store/apps/app-KhIVw） |
| `is_show_post_pubdate_in_post_list` | 开关 | 文章列表显示文章发布时间 | 开 |  |
| `is_show_post_views_in_post_list` | 开关 | 文章列表显示文章阅读量 | 关 |  |

## 作者详情页样式

模板中访问：`theme.config.author_page_styles.<配置项名>`

| 配置项 | 类型 | 标签 | 默认值 | 说明 |
| --- | --- | --- | --- | --- |
| `is_enable_canonical_link` | 开关 | 输出 canonical 标签 | 开 |  |
| `is_show_rss_button` | 开关 | 显示作者 RSS 订阅按钮 | 关 | 需启用 RSS 插件（https://www.halo.run/store/apps/app-KhIVw） |
| `is_show_post_pubdate_in_post_list` | 开关 | 文章列表显示文章发布时间 | 开 |  |

## 归档页样式

模板中访问：`theme.config.archives_page_styles.<配置项名>`

| 配置项 | 类型 | 标签 | 默认值 | 说明 |
| --- | --- | --- | --- | --- |
| `description` | 文本 | 页面描述 | — | 设置页面的 meta description；为空时回退到站点 SEO 描述 |
| `is_enable_canonical_link` | 开关 | 输出 canonical 标签 | 开 |  |
| `is_show_post_pubdate_in_post_list` | 开关 | 文章列表显示文章发布时间 | 开 |  |
| `is_collapse_post_list_by_publication_year_and_month` | 开关 | 按照发布年份和月份折叠文章列表 | 关 |  |
| `duration_of_expand_collapse_animation` | 数字 | 展开折叠动画时长 | `200` | 单位毫秒（仅当 `$is_collapse_post_list_by_publication_year_and_month === true` 时显示） |

## 自定义页面样式

模板中访问：`theme.config.custom_page_styles.<配置项名>`

| 配置项 | 类型 | 标签 | 默认值 | 说明 |
| --- | --- | --- | --- | --- |
| `is_enable_canonical_link` | 开关 | 输出 canonical 标签 | 开 |  |
| `is_optimize_content_paragraph_spacing` | 开关 | 优化段落空行显示 | 关 | 启用后，为内容段落添加最小高度，改善空行显示效果 |
| `is_enable_paragraph_first_line_indent` | 开关 | 段落首行缩进 | 关 | 启用后，文章段落将使用首行缩进样式，通常为 2 个汉字宽度（2em） |
| `paragraph_first_line_indent_value` | 文本 | 首行缩进值 | `2em` | 设置首行缩进的大小。允许使用所有 CSS 长度单位，如：2em, 32px, 2rem 等。推荐使用 2em（仅当 `$is_enable_paragraph_first_line_indent === true` 时显示） |
| `is_show_post_estimated_reading_time` | 开关 | 页面预计阅读时间 | 关 |  |
| `is_show_post_word_count` | 开关 | 页面字数统计 | 关 |  |
| `is_dividing_line_at_the_end_of_content_show` | 开关 | 页面正文内容末尾分隔线 | 开 |  |
| `is_custom_page_comment_section_show` | 开关 | 页面评论区 | 开 |  |

## 错误页样式

模板中访问：`theme.config.error_page_styles.<配置项名>`

| 配置项 | 类型 | 标签 | 默认值 | 说明 |
| --- | --- | --- | --- | --- |
| `is_show_error_detail` | 开关 | 显示错误详情 | 关 | 错误详情来自服务端框架（如 404 时的“No static resource …”），对访客没有帮助，也会暴露内部信息。仅建议开发时开启。 |
| `is_auto_redirect` | 开关 | 页面自动重定向 | 关 | 从错误页自动跳走会劫持浏览器后退键，访客也来不及看清发生了什么。默认关闭。 |
| `target_url` | 文本 | 跳转目标链接 | `/` | （仅当 `$is_auto_redirect === true` 时显示） |
| `redirect_wait_time` | 数字 | 跳转等待时间 | `5` | 设置跳转等待时间，单位秒。（仅当 `$is_auto_redirect === true` 时显示） |

## 社交资料/RSS

模板中访问：`theme.config.sns.<配置项名>`

| 配置项 | 类型 | 标签 | 默认值 | 说明 |
| --- | --- | --- | --- | --- |
| `sns_list` | 对象数组 | 首页社交资料展示 | — | 你可以在这里设置你的信息，主题即可自动生成对应的链接。 |
| └ `type` | 下拉 | 类型 | `custom_sns` | 在此处填写在下方定义的识别码 / 填入任意纯文本 / 填入 feed 地址，示例：/rss.xml / 只需填入 uid / 只需填入用户名 / 只需填入邮箱地址 / 只需填入用户名 / 只需填入用户名 / 只需填入用户名 / 只需填… |
| └ `input_value` | 文本 | 值 | — |  |
| `custom_sns` | 对象数组 | 设定自定义资料 | — | 上面预设的选项可能不能满足需求，那么来这自定义属于你的资料吧！（在此处自定义完后别忘记在上面添加“自定义资料”） |
| └ `id` | 文本 | 识别码 | — | 任意字母，数字，下划线组合，如：myBlog |
| └ `url` | 文本 | 链接 | — | 如：https://example.com |
| └ `icon` | 图标 | 图标 | — |  |
| └ `aria_label` | 文本 | aria-label | — | 无障碍标签，方便视障人士读屏，如：Find me on my blog |

## 自定义分享按钮

模板中访问：`theme.config.share.<配置项名>`

| 配置项 | 类型 | 标签 | 默认值 | 说明 |
| --- | --- | --- | --- | --- |
| `share_list` | 对象数组 | 分享按钮列表 | `[{'type': 'native'}, {'type': 'email'}, {'type': 'qrcode'}, {'type': 'facebook'}, {'type': 'reddit'}, {'type': 'x'}, {'type': 'linkedin'}, {'type': 'pinterest'}, {'type': 'telegram'}, {'type': 'whatsapp'}, {'type': 'tumblr'}, {'type': 'blogger'}, {'type': 'gmail'}, {'type': 'yahoomail'}, {'type': 'skype'}, {'type': 'line'}, {'type': 'hackernews'}, {'type': 'qq'}, {'type': 'weibo'}, {'type': 'wechat'}, {'type': 'qzone'}, {'type': 'douban'}]` | 控制分享按钮的显示与排列顺序 |
| └ `type` | 下拉 | 类型 | `native` |  |
| └ `icon` | 图标 | 图标 | — | 设置后覆盖默认图标 |
| └ `custom_id` | 文本 | 识别码 | — | 填写在下方定义的自定义按钮识别码（仅当 `$get(share_list_type).value === 'custom_share'` 时显示） |
| `custom_share` | 对象数组 | 自定义分享按钮 | — | @URL 和 @TITLE 是占位符，使用中会被替换为页面实际地址和标题。在此处定义完后，别忘记在上方列表中添加 |
| └ `id` | 文本 | 识别码 | — | 任意字母、数字、下划线组合，如：myShare |
| └ `name` | 文本 | 名称 | — |  |
| └ `url` | 文本 | 链接 | — |  |
| └ `icon` | 图标 | 图标 | — |  |
| └ `aria_label` | 文本 | aria-label | — | 无障碍标签中的名称 |

## 链接页样式

模板中访问：`theme.config.links_page_styles.<配置项名>`

| 配置项 | 类型 | 标签 | 默认值 | 说明 |
| --- | --- | --- | --- | --- |
| `is_enable_canonical_link` | 开关 | 输出 canonical 标签 | 开 |  |
| `is_head_first_style` | 开关 | 头像优先样式 | 关 |  |
| `link_description_max_lines` | 数字 | 链接描述行数上限 | `2` | 填写值范围为 1-5（仅当 `$is_head_first_style === true` 时显示） |

## 图库页样式

模板中访问：`theme.config.photos_styles.<配置项名>`

| 配置项 | 类型 | 标签 | 默认值 | 说明 |
| --- | --- | --- | --- | --- |
| `is_enable_canonical_link` | 开关 | 输出 canonical 标签 | 开 |  |
| `img_border_radius` | 文本 | 图片圆角宽度 | `8px` | 设置图片的圆角宽度。允许使用所有 CSS 长度单位，如：0px, 5px, 10%, 1rem。 |
| `img_transition_duration_after_load` | 数字 | 图片渐入动画时间 | `0.2` | 设置图片渐入动画时间，单位秒。 |
| `is_show_photo_group_name` | 开关 | 显示分组标题 | 关 |  |
| `is_enable_masonry_layout` | 开关 | 启用瀑布流布局 | 开 |  |
| `max_masonry_columns` | 数字 | 瀑布流最大列数 | `3` | 设置瀑布流布局的最大列数。（仅当 `$is_enable_masonry_layout === true` 时显示） |
| `min_masonry_columns` | 数字 | 瀑布流最小列数 | `2` | 设置瀑布流布局的最小列数。（仅当 `$is_enable_masonry_layout === true` 时显示） |
| `min_img_width` | 数字 | 瀑布流最小图片宽度 | `300` | 设置瀑布流布局中图片的最小宽度。单位 px（仅当 `$is_enable_masonry_layout === true` 时显示） |
| `masonry_gap` | 数字 | 瀑布流间隔宽度 | `9` | 设置瀑布流布局的间隔宽度。单位 px（仅当 `$is_enable_masonry_layout === true` 时显示） |
| `is_enable_advanced_options` | 开关 | 进阶配置选项 | 关 | 此处的配置项需要前端知识 |
| `img_onmouseover` | 文本 | 自定义图片 onmouseover 属性 | `this.style.boxShadow='0 0 7.5px var(-…` | 默认值：this.style.boxShadow='0 0 7.5px var(--color-accent), 0 0 7.5px var(--color-accent)';（仅当 `$is_enable_advanced_opti… |
| `img_onmouseout` | 文本 | 自定义图片 onmouseout 属性 | `this.style.boxShadow='none';` | 默认值：this.style.boxShadow='none';（仅当 `$is_enable_advanced_options === true` 时显示） |

## 瞬间页样式

模板中访问：`theme.config.moments_styles.<配置项名>`

| 配置项 | 类型 | 标签 | 默认值 | 说明 |
| --- | --- | --- | --- | --- |
| `is_enable_canonical_link` | 开关 | 输出 canonical 标签 | 开 |  |
| `is_show_post_pubdate` | 开关 | 帖文发布时间 | 开 |  |
| `is_show_post_estimated_reading_time` | 开关 | 帖文预计阅读时间 | 关 |  |
| `is_show_post_word_count` | 开关 | 帖文字数统计 | 关 |  |
| `is_moment_upvote_button_show` | 开关 | 启用点赞按钮 | 开 |  |
| `is_moment_comment_section_show` | 开关 | 启用评论区 | 开 |  |

## 朋友圈页面样式

模板中访问：`theme.config.friends_page_styles.<配置项名>`

| 配置项 | 类型 | 标签 | 默认值 | 说明 |
| --- | --- | --- | --- | --- |
| `is_enable_canonical_link` | 开关 | 输出 canonical 标签 | 开 |  |
| `is_show_friend_pubdate` | 开关 | 显示发布日期 | 开 |  |
| `is_show_friend_author` | 开关 | 显示作者信息 | 开 | 作者信息包括作者头像和名称 |
| `is_show_friend_author_avatar` | 开关 | 显示作者头像 | 开 | （仅当 `$is_show_friend_author === true` 时显示） |
| `is_show_friend_author_name` | 开关 | 显示作者名称 | 开 | （仅当 `$is_show_friend_author === true` 时显示） |
| `is_show_friend_description` | 开关 | 显示文章描述 | 开 |  |
| `friend_description_max_lines` | 数字 | 文章描述行数上限 | `3` | 填写值范围为 1-5（仅当 `$is_show_friend_description === true` 时显示） |
| `is_show_friend_permalink_text` | 开关 | 显示跳转链接提示文字 | 开 | 如关闭此项，朋友圈列表文章项将不显示跳转链接文字 |

