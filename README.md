# Clay

[English](./README.en.md)

复刻 Anthropic / Claude 官网视觉语言的 [Halo](https://github.com/halo-dev/halo) 主题。

暖灰底色、衬线标题配无衬线正文、以字号与字重而非线框建立层级。配色与度量取自 `claude.com` 线上 CSS 的实测提取，而非目测仿制——细节见 [`docs/DESIGN.md`](./docs/DESIGN.md)。

> **本主题基于 [HowieHz/halo-theme-higan-hz](https://github.com/HowieHz/halo-theme-higan-hz) 二次开发**（MIT）。上游的工程能力——响应式、多语言、强可配置性、插件兼容、按需注入 CSS 的性能设计——被完整保留，被替换的是视觉层。完整署名链见 [`LICENSE`](./LICENSE)。

## 特点

- **暖灰阶** —— 21 档中性色整体偏黄（`#FAF9F5` → `#141413`）。这是最容易仿错、也最决定辨识度的一点
- **衬线／无衬线对比** —— 展示级标题与引用用衬线，正文与界面用无衬线
- **克制的强调色** —— 黏土橙 `#D97757` 只出现在链接、当前态、标记符号与焦点环；主按钮是近黑，不是橙
- **自托管字体** —— Inter / Source Serif 4 / JetBrains Mono，子集化后合计 222 KiB，可变字重，按 `unicode-range` 懒加载（无代码块的页面不下载 mono）
- **自托管中文衬线** —— 思源宋体子集，一档常用字加 58 片生僻字，含中文的页面通常只取一个文件。安卓不自带中文衬线，不自托管就会丢掉衬线／无衬线的对比
- **九套配色预设** —— 浅色 / 暗色 / 跟随系统，各有默认（黏土橙）、蓝、灰三种强调色，另支持完全自定义
- **内置光标组** —— 13 种 SVG 指针，随深浅色与配色预设切换，整套每页 2.1 KiB brotli，不产生额外请求
- **跟随系统深浅色** —— 通过 `data-color-scheme` 驱动，Halo 官方插件的 UI 会自动跟随

## 页面重量（实测）

本地实测的 brotli 传输大小，非估算。单位为 KiB（1024 字节）：

| | 首页 | 文章页 | 归档页 |
| --- | --- | --- | --- |
| 主题代码（HTML + CSS + JS，不含字体） | 41.8 | 84.2 | 25.0 |
| 拉丁字体（首访一次，之后走缓存） | 187.8 | 221.6 | 187.8 |

主题自身代码在数十 KiB 量级，这得益于上游「每个配置项是独立模板片段」的设计——
Halo 只注入用户实际选中的那份 CSS。

需要说清楚的三点：

- **字体是首访的大头。** Inter 118.6 + Source Serif 4 69.2 = 187.8 KiB；含代码块的页面再加
  JetBrains Mono 33.8 KiB。这是选择自托管开源字体的代价，换来的是不依赖 CDN、
  不因字体缺失而丢失衬线／无衬线的对比。介意的话可以在主题设置里切回系统字体栈。
- **中文站点还要加一档。** 内置中文衬线默认开启，含中文的页面首访再取常用字档 409.7 KiB，
  之后走缓存；出现生僻字才会额外拉对应分片，纯外文站点一个字节都不下载。
  分档策略与实测见 [`docs/DESIGN.md`](./docs/DESIGN.md) §15。
- **插件资源通常远大于主题。** 一个装了评论、搜索、代码高亮、超链接卡片的站点，
  这些插件合计约 700 KiB，主题在整页里的占比不到 5%。谈优化时先看这一侧。

## 配置

主题有 18 个分组、318 个配置项。完整参考见 [`docs/SETTINGS.md`](./docs/SETTINGS.md)
（英文：[`docs/SETTINGS.en.md`](./docs/SETTINGS.en.md)），其中列出每一项的名称、类型、
默认值、说明与显示条件，以及在模板中的访问路径。

两份文档都由 `scripts/gen-settings-reference.py` 导出，不是手写的——2500 行配置手工维护
一份说明，改一处就落后一处。英文版读的是 `i18n-settings/settings.en.yaml`（即英文包里的
`settings.yaml`），所以它是从源头导出而非翻译中文版；生成时会校验两边的分组与字段一一对应，
对不上直接报错。改完配置重新生成即可：

```bash
python scripts/gen-settings-reference.py --lang all
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
python scripts/verify-package.py   # 版本、条目、资源引用、有无夹带工程文件
```

产出 `dist/` 下两个 zip：

- `halo-theme-clay-<版本>-zh-hans.zip` —— 默认（简体中文配置界面）
- `halo-theme-clay-<版本>-en.zip` —— 英文配置界面

Halo 没有「本地化 settings.yaml」的机制，多语言配置界面只能靠发多个包实现：
英文包用 `i18n-settings/*.en.yaml` 替换根部的 `settings.yaml` / `theme.yaml` /
`annotation-settings.yaml`，并用 `README.en.md` 替换 `README.md`。改动这几个文件时，
记得同步对应的英文版本。

> 没有用 `@halo-dev/theme-package-cli`：它按 `*.yaml` 通配收根目录，会把
> `pnpm-lock.yaml` / `pnpm-workspace.yaml` 打进发行包，也不产出英文包。

## 持续集成

[`.github/workflows/ci.yml`](./.github/workflows/ci.yml) 在每次推送与 PR 上跑：
安装、lint 与类型检查、核对 lint 没有改动仓库内容、核对配置参考与 `settings.yaml` 同步、
构建、打包、校验发行包，并把产物体积摘要写进 job summary。

[`.github/workflows/release.yml`](./.github/workflows/release.yml) 由 `v*` 标签触发：
用标签注释当 Release 正文，校验版本号与标签一致后建 Release 并挂上两个 zip。
建 Release 之前会先扫一遍标签注释和这一段提交，带 agent 会话标识就直接失败——
公开产物的脱敏要求不该只写在文档里。

CI 覆盖不到的是需要跑着的 Halo 实例的那部分：SRI 一致性、真实页面重量、无障碍走查。
它们在 [`scripts/regression/`](./scripts/regression/) 下，本地跑。

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
- [Noto Serif SC](https://github.com/notofonts/noto-cjk)（子集化为 `Clay Serif SC`，仅 400 字重）

**中文衬线自托管，中文无衬线不自托管。** 整包思源宋体有数 MB，会击穿体积预算，所以它被切成
一档常用字加 58 片生僻字，按 `unicode-range` 取用——普通中文页面只下载一个文件。
之所以值得付这个代价：Windows、macOS、iOS 自带中文衬线而安卓不带，不自托管的话，
安卓访客看到的中文标题会退回黑体，衬线／无衬线这个最核心的识别特征当场消失。
中文无衬线没有这个问题——每个目标系统都自带一款可用的（PingFang SC / 微软雅黑 / Noto Sans CJK），
所以它继续走系统字体。

## 许可

MIT。本主题的样式谱系为：

[probberechts/hexo-theme-cactus](https://github.com/probberechts/hexo-theme-cactus)（Pieter Robberechts，2016）
→ 浅色与白色配色（Gabriela Thumé、Natalya Kosenko，2017）
→ [guqing/halo-theme-higan](https://github.com/guqing/halo-theme-higan)（2019）
→ [HowieHz/halo-theme-higan-hz](https://github.com/HowieHz/halo-theme-higan-hz)（2024）
→ Clay

完整署名以 [`LICENSE`](./LICENSE) 为准，那里同时列出了内置字体各自的 SIL OFL 授权。
感谢 Pieter Robberechts、Gabriela Thumé、Natalya Kosenko、guqing、HowieHz 以及上游社区。
