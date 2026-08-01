# Clay

复刻 Anthropic / Claude 官网视觉语言的 [Halo](https://github.com/halo-dev/halo) 主题。

暖灰底色、衬线标题配无衬线正文、以字号与字重而非线框建立层级。配色与度量取自 `claude.com` 线上 CSS 的实测提取，而非目测仿制——细节见 [`docs/DESIGN.md`](./docs/DESIGN.md)。

> **本主题基于 [HowieHz/halo-theme-higan-hz](https://github.com/HowieHz/halo-theme-higan-hz) 二次开发**（MIT）。上游的工程能力——响应式、多语言、强可配置性、插件兼容、按需注入 CSS 的性能设计——被完整保留，被替换的是视觉层。完整署名链见 [`LICENSE`](./LICENSE)。

## 特点

- **暖灰阶** —— 21 档中性色整体偏黄（`#FAF9F5` → `#141413`）。这是最容易仿错、也最决定辨识度的一点
- **衬线／无衬线对比** —— 展示级标题与引用用衬线，正文与界面用无衬线
- **克制的强调色** —— 黏土橙 `#D97757` 只出现在链接、当前态、标记符号与焦点环；主按钮是近黑，不是橙
- **自托管字体** —— Inter / Source Serif 4 / JetBrains Mono，子集化后合计 228 KB，可变字重，按 `unicode-range` 懒加载（无代码块的页面不下载 mono）
- **五套配色预设** —— 亮色 / 暗色 / 静默 / Sky 亮 / Sky 暗，另支持完全自定义
- **跟随系统深浅色** —— 通过 `data-color-scheme` 驱动，Halo 官方插件的 UI 会自动跟随

## 页面重量（实测）

本地实测的 brotli 传输大小，非估算：

| | 首页 | 文章页 | 归档页 |
| --- | --- | --- | --- |
| 主题代码（HTML + CSS + JS） | 41.8 KB | 84.2 KB | 25.0 KB |
| 自托管字体（首访一次，之后走缓存） | ~192 KB | ~228 KB | ~192 KB |

主题自身代码在数十 KB 量级，这得益于上游「每个配置项是独立模板片段」的设计——
Halo 只注入用户实际选中的那份 CSS。

需要说清楚的两点：

- **字体是首访的大头。** 无衬线 + 衬线约 192 KB，含代码块的页面再加 36 KB 的等宽体。
  这是选择自托管开源字体的代价，换来的是不依赖 CDN、不因字体缺失而丢失衬线／无衬线的对比。
  介意的话可以在主题设置里切回系统字体栈。
- **插件资源通常远大于主题。** 一个装了评论、搜索、代码高亮、超链接卡片的站点，
  这些插件合计约 700 KB，主题在整页里的占比不到 5%。谈优化时先看这一侧。

## 配置

主题有 18 个分组、309 个配置项。完整参考见 [`docs/SETTINGS.md`](./docs/SETTINGS.md)，
其中列出每一项的名称、类型、默认值、说明与显示条件，以及在模板中的访问路径。

那份文档由 `scripts/gen-settings-reference.py` 从 `settings.yaml` 导出，不是手写的——
2500 行配置手工维护一份说明，改一处就落后一处。改完配置重新生成即可：

```bash
python scripts/gen-settings-reference.py
```

## 环境要求

| | 版本 |
| --- | --- |
| Halo | ≥ 2.25.0 |
| Node.js | ≥ 24 |
| pnpm | ^11.18 |

## 开发

```bash
pnpm install --force   # 必须带 --force，见下
pnpm watch             # 开发循环（vite build --watch）
pnpm build             # 生产构建：压缩 + Tailwind 类名混淆 + brotli
pnpm lint              # oxlint + eslint + stylelint + markdownlint + autocorrect
pnpm fmt               # oxfmt
```

> **`pnpm install` 会静默漏装 rolldown 的原生二进制。** Vite 8 用 rolldown 打包，它以 optionalDependencies 分发各平台二进制。
> Windows 上普通 `pnpm install` 退出码为 0，随后构建崩在 `Cannot find module '@rolldown/binding-win32-x64-msvc'`。始终使用 `pnpm install --force`。

本地预览需要一个 Halo 实例，并把主题目录链接进它的 `themes/`，同时以 `--spring.thymeleaf.cache=false` 启动，否则模板改动不会生效。完整开发说明见 [`CLAUDE.md`](./CLAUDE.md)。

## 打包发布

```bash
pnpm build
python scripts/package-theme.py
```

产出 `dist/` 下两个 zip：

- `halo-theme-clay-<版本>-zh-hans.zip` —— 默认（简体中文配置界面）
- `halo-theme-clay-<版本>-en.zip` —— 英文配置界面

Halo 没有「本地化 settings.yaml」的机制，多语言配置界面只能靠发多个包实现：
英文包用 `i18n-settings/*.en.yaml` 替换根部的 `settings.yaml` / `theme.yaml` /
`annotation-settings.yaml`。改动这三个文件时，记得同步对应的 `.en.yaml`。

> 没有用 `@halo-dev/theme-package-cli`：它按 `*.yaml` 通配收根目录，会把
> `pnpm-lock.yaml` / `pnpm-workspace.yaml` 打进发行包，也不产出英文包。

## 构建产物

`templates/` 是构建产物，已在 `.gitignore` 中，**不要直接编辑**。源文件在 `src/templates/`。

新增模板必须在 `vite.config.ts` 的 `getBuildInputs()` 里显式注册，不会被自动发现。

## 扩展页面

`links` / `moments` / `photos` / `friends` 模板本身不产生路由——它们服务于用户在 Halo 中创建的、指定了对应自定义模板的独立页面，其中部分还依赖第三方插件。未创建对应页面前访问 `/moments` 返回 404 属正常。

## 字体授权

Anthropic 自有的 `anthropicSans` / `anthropicSerif` / `anthropicMono` 为专有授权字体，**未也不会内置**。本主题使用的开源替代均为 SIL Open Font License 1.1：

- [Inter](https://github.com/rsms/inter)
- [Source Serif 4](https://github.com/adobe-fonts/source-serif)
- [JetBrains Mono](https://github.com/JetBrains/JetBrainsMono)

中日韩字形走系统字体（PingFang SC / 微软雅黑 / Noto Sans CJK），不自托管——即便子集化也有数 MB，会击穿主题的体积预算。

## 许可

MIT。本主题的样式谱系为：

[probberechts/hexo-theme-cactus](https://github.com/probberechts/hexo-theme-cactus)（2016）
→ [guqing/halo-theme-higan](https://github.com/guqing/halo-theme-higan)（2019）
→ [HowieHz/halo-theme-higan-hz](https://github.com/HowieHz/halo-theme-higan-hz)（2024）
→ Clay

感谢 Pieter Robberechts、guqing、HowieHz 以及上游社区。
