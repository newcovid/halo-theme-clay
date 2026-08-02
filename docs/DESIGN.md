# Halo 主题设计稿 · Clay

> 复刻 Anthropic / Claude 官网美术风格的 Halo 博客主题
> 基于 [HowieHz/halo-theme-higan-hz](https://github.com/HowieHz/halo-theme-higan-hz) v1.72.3 二次开发（MIT）
> 状态：**P0–P2 完成，P3 进行中**（详见 §8）
> 最后更新：2026-07-31

---

## 1. 已确认决策

| # | 议题 | 结论 |
| --- | --- | --- |
| Q1 | 主题命名 | `halo-theme-clay` / 展示名 **Clay**。已核验无重名（GitHub 仓库名 0 结果、100 个 `halo-theme-*` 仓库无 clay、Halo 应用市场无 clay） |
| Q2 | 字体策略 | **A：自托管开源字体 + 子集化**，并做成主题配置项 |
| Q3 | 多语言 | 中英双语（上游已带 6 种语言，保留） |
| Q4 | 首页主视觉 | 保留超大字号 + 大留白 |
| Q5 | 暗色模式 | 亮色暗色都做 |
| Q6 | Node 版本 | **24 LTS**（24.18.1，上游 `engines` 要求 ≥24） |
| Q7 | Halo 最低版本 | **`>=2.25.0`**（跟随上游） |
| Q8 | Git 仓库 | 已初始化（main 分支） |
| — | 架构路线 | **Fork 二开**（见 §3） |
| — | 页面范围 | 标准路由 + links / moments / photos / friends 全部保留 |
| — | pretext | **不引入**（见 §7） |
| — | 配置项 | **基本不裁剪**，仅去除明显失效项 |

---

## 2. 开发环境（已实测）

| 组件 | 版本 | 状态 |
| --- | --- | --- |
| Node.js | 24.18.1 LTS | ✅ 由 20.18.0 升级（winget，同路径替换） |
| pnpm | 11.18.0 | ✅ 匹配上游 `engines: ^11.18.0` |
| JDK | Temurin 25.0.3 | ✅ Halo 2.25.4 实测 5.5s 启动 |
| Halo | 2.25.4 | ✅ 运行于仓库外的独立目录 |
| Git | 2.55.0 | ✅ |

**开发回路**：`halo-runtime/work/themes/halo-theme-clay` 是指向本仓库的 junction，`pnpm watch` 产出直接生效，配合 `--spring.thymeleaf.cache=false` 无需重启 Halo。

### 两个已排除的坑

1. **pnpm 静默漏装 rolldown 原生二进制** —— `pnpm install` 退出码 0 但构建崩在 `Cannot find module '@rolldown/binding-win32-x64-msvc'`。必须 `pnpm install --force`。
2. **Halo API 的密码是 RSA 加密的** —— `/login` 的 `password` 是 hidden 字段，页面内联 JS 用 jsencrypt（RSA PKCS#1 v1.5）加密后才提交。明文登录恒返回 `invalid-credential`。脚本化操作见 `CLAUDE.md`。

---

## 3. 架构路线：为什么是 Fork

初判「自建」，实测数据后**改为 fork**。依据：

**模板构成实测**（行数）

| 模板 | 总行 | 含 `class=` | 含 Thymeleaf 逻辑 |
| --- | --- | --- | --- |
| `post.html` | 495 | 44 (9%) | 189 (38%) |
| `index.html` | 346 | 24 (7%) | 154 (45%) |
| `page.html` | 122 | 12 (10%) | 36 (30%) |
| `category.html` | 60 | 3 (5%) | 23 (38%) |

视觉标记只占 5–10%，Thymeleaf 逻辑占 30–45%。**继承的是贵的部分**（RSS alternate、`#annotations`、`pluginFinder` 守卫、面包屑、SEO、i18n），要改写的是薄的那层。全站 CSS 仅 3739 行；每套配色是 12 个变量、14 行。
四个扩展页（`moment` 334 行、`photos` 369、`links` 123、`friends` 44、`moments` 37）合计约 907 行成熟逻辑已就绪。

**结论**：同等功能集下，fork ≈ 自建的 35–45% 工作量。

**代价（需持续管理）**：上游「强可配置性」是双刃剑——19 个配置分组、2556 行 settings，每项都有视觉含义。视觉替换后这些组合都需回归验证。这是 fork 的主要隐性成本。

**许可**：MIT，署名链完整保留于 `LICENSE`（Pieter Robberechts 2016 → Gabriela Thumé / Natalya Kosenko 2017 → guqing 2019 → HowieHz 2024）。上游 README 明确欢迎二次开发。

---

## 4. 美术风格调研（实证）

抓取 `claude.com` 5 个 CSS chunk（共 327KB）提取真实 token，非记忆重构。

### 4.1 暖灰阶

整套风格的根基。Anthropic 的中性色**偏黄**，用中性灰会直接破坏辨识度。

| Token | 值 | Token | 值 |
| --- | --- | --- | --- |
| `gray-000` | `#FFFFFF` | `gray-500` | `#87867F` |
| `gray-050` | `#FAF9F5` | `gray-550` | `#73726C` |
| `gray-100` | `#F5F4ED` | `gray-600` | `#5E5D59` |
| `gray-150` | `#F0EEE6` | `gray-650` | `#4D4C48` |
| `gray-200` | `#E8E6DC` | `gray-700` | `#3D3D3A` |
| `gray-250` | `#DEDCD1` | `gray-750` | `#30302E` |
| `gray-300` | `#D1CFC5` | `gray-800` | `#262624` |
| `gray-350` | `#C2C0B6` | `gray-850` | `#1F1E1D` |
| `gray-400` | `#B0AEA5` | `gray-900` | `#1A1918` |
| `gray-450` | `#9C9A92` | `gray-950` | `#141413` |

### 4.2 强调色与副色

```text
--color-clay:       #D97757    --color-error: #BF4D43
--color-clay-hover: #C6613F    --color-focus: #2C84DB
--color-clay-dark:  #C46849

副色（低饱和，用于插画与分类色块）
cactus #BCD1CA   coral #EBCECE   fig #C46686   heather #CBCADB
oat    #E3DACC   olive #788C5D   sky #6A9BCC
```

### 4.3 语义层（关键修正）

这是最容易搞错的一层。抓到官网真实映射后，推翻了「橙=主色」的直觉判断：

```text
--theme-button-primary-bg   : var(--color-gray-950)    /* 主按钮是近黑 #141413 */
--theme-button-primary-fg   : var(--color-gray-050)
--theme-button-secondary-bg : var(--color-gray-200)
--theme-button-secondary-fg : var(--color-gray-650)
--theme-button-clay-bg      : var(--color-clay-hover)  /* 橙按钮用 #C6613F，非 #D97757 */
--theme-button-clay-fg      : var(--color-gray-000)    /* 白字，对比度才够 */

--theme-background-primary  : gray-050    --theme-foreground-primary   : gray-950
--theme-background-secondary: gray-100    --theme-foreground-secondary : gray-750
--theme-background-tertiary : gray-150    --theme-foreground-tertiary  : gray-600
--theme-border-primary      : gray-400    --theme-accent-clay-primary  : clay
--theme-border-secondary    : gray-300    --theme-accent-clay-interactive: clay-hover
--theme-border-tertiary     : gray-200    --theme-accent-pictogram     : oat
```

**橙是强调不是主色**：主按钮近黑，橙用于链接悬停、当前态、列表标记（`content:"> "; color:var(--color-clay)`）与独立的 clay 按钮变体。搞反会让整体气质从「克制」滑向「促销」。

### 4.4 字体

官网三套自有字体（`anthropicSans` / `anthropicSerif` / `anthropicMono`）**为专有授权，不可复用**。CJK 官网直接用 Noto（`Noto Sans JP` / `Noto Serif JP` / `KR`），所以中文选 Noto SC 与官方策略一致。

| 角色 | 官网 | Clay 采用 |
| --- | --- | --- |
| Sans | anthropicSans | **Inter** |
| Serif | anthropicSerif | **Source Serif 4** |
| Mono | anthropicMono | **JetBrains Mono** |
| 中文 | Noto Sans/Serif JP·KR | **Noto Sans SC / Noto Serif SC** |

字重仅 5 档：`300 / 400 / 500 / 600 / 700`

**中文实际落在系统字体上，不是 Noto。** 自托管的只有拉丁子集
（`inter-latin` 120K / `source-serif-4-latin` 72K / `jetbrains-mono-latin` 36K），
CJK 字形逐字回落到字体栈后段的系统字体。实测（Windows 11 / Chrome）中文标题渲染为 **SimSun**：
把真实栈与 SimSun、Noto Serif SC、generic `serif` 在 118px 下并排渲染，四者字形完全一致——
因为 Noto Serif SC 未安装，`serif` 在 Windows 上的 CJK 映射本就是 SimSun，三条路殊途同归。

结论上有一点要澄清：**serif/sans 的对比在中文侧是成立的**（「言」有三角收笔、横细竖粗），
只是那个衬线体是系统宋体而非我们声明的 Noto。已把思源宋体的常见族名补进栈
（`Source Han Serif SC` / `Noto Serif CJK SC`），装了的用户吃到更好的字面，没装的行为不变——零成本。

不自托管 CJK 是**有意的**：常用字子集也要 1～2 MB，而全站主题代码才 ~40 KB/页，
为字体付 25～50 倍的代价不成比例。

> 度量方法上有个坑：**宽度法在 CJK 上原理性失效**。汉字全角等宽，每字恰好 1 em，
> 所有候选字体量出的宽度完全相同（6 字 × 40px = 240），`document.fonts.check()` 对未加载族也返回 true。
> 拉丁侧宽度对照法有效，中文侧必须比像素位图，或者直接放大到 100px+ 用眼睛看。

### 4.5 度量

```text
行宽 token（沿用官网刻度，当前消费 headline / title / body 三档；
其余为参考刻度——正文宽度由容器的 max_width 配置治理，不用 token 硬覆盖，
否则会踩掉用户的配置权）
--text-width-narrow 20ch   --text-width-body  60ch
--text-width-headline 30ch --text-width-wide  70ch
--text-width-title  45ch   --text-width-prose 80ch

响应式字号（官网实测 clamp）
正文   clamp(15px, 0.1878vw + 14.2958px, 17px)
标题   clamp(32px, 1.878vw + 24.9575px, 52px)
主视觉 clamp(42px, 7vw, 112px)

圆角  官网 --br-2/4/6/8/12/16/24/32/48/64，高频 8 / 16 / 12 / 24
      主题取 xs4 / sm8 / md12 / lg16 / xl24 / 2xl32，全站圆角已无硬编码
描边  --border-xs .5px  sm 1px  md 1.5px  lg 2px
缓动  cubic-bezier(.4, 0, .2, 1)（出现 15 次，压倒性主导）
字距  仅小号大写标签用 .05em / .04em
```

---

## 5. 配色实现

上游每套预设是 12 个语义 token 的单一 `:root` 块（`src/templates/_runtime/styles/themes/*.css`，由 `generate-theme-css.ts` 解析，格式必须严格保持）。已按 §4.3 语义层重写全部 5 套：

| 预设文件 | Clay 含义 | base-100 | primary |
| --- | --- | --- | --- |
| `theme-light.css` | Clay 亮色（签名） | `#faf9f5` | `#c6613f` |
| `theme-dark.css` | Clay 暗色（签名） | `#141413` | `#d97757` |
| `theme-gray.css` | Clay 静默（暖中性，无橙） | `#faf9f5` | `#5e5d59` |
| `theme-light-blue.css` | Clay Sky 亮色 | `#faf9f5` | `#4a7fae` |
| `theme-dark-blue.css` | Clay Sky 暗色 | `#141413` | `#6a9bcc` |

`secondary` 承担「近黑主按钮」语义（亮色 `#141413` / 暗色 `#f5f4ed`）。

**`accent` 的语义是「悬停强调」，不是装饰色**——清点后发现全站 20 处 `--color-accent` 全是 hover 态。
配套的方向规则：**浅色底上悬停变暗、深色底上悬停变亮**，因为在浅底上「变亮」等于降对比度。

**对比度（canvas 实测，非估算）**：

| | 亮底 `#faf9f5` | 暗底 `#141413` |
| --- | --- | --- |
| `#d97757` 纯 clay | **2.96** ✗ | 5.90 ✓ |
| `#c6613f` | **3.85** ✗ | 4.55 ✓ |
| `#c0502b`（亮色 primary） | 4.51 ✓ | — |
| `#9f4224`（亮色 accent/hover） | 6.08 ✓ | — |
| `#de8b6f`（暗色 accent/hover） | — | 7.05 ✓ |

纯 clay `#d97757` 在浅色底上**连大字号的 3:1 都不到**，不能承载浅底文字——
官网本身也没这么用（他们的 clay 用在按钮填充和标记符号上，白字压在 clay 上是另一种配对）。
所以亮色的 primary/accent 取压暗后的同色相值：颜色更深，但仍读得出是黏土色，且文字全部达标。

> 早前这里写过「`#c6613f` 约 4.5:1」，是我算错了——实际 3.85。以上数值由页面内 canvas
> 规范化颜色后计算，能正确处理 `color-mix(in oklab, …)` 这类计算值。

**字体结构**已改为三字族：`--clay-font-sans` / `--clay-font-serif` / `--clay-font-mono`，`--clay-font-family` 别名到 sans。衬线仅用于 `h1`/`h2`/`blockquote`。上游自托管的 Meslo LG（等宽做正文，终端美学）已解除引用，产物由 11MB 降至 **4.88MB**。

Inter / Source Serif 4 / JetBrains Mono 已自托管并子集化，详见 §9。

---

## 6. 页面与模板

上游已覆盖标准路由与扩展页，全部保留：

| 模板 | 路由 | 说明 |
| --- | --- | --- |
| `index` / `post` / `page` | `/` `/archives/:slug` `/:slug` | 核心链路 |
| `archives` / `tags` / `tag` / `categories` / `category` / `author` | 归档体系 | |
| `page-like-post-style` | customTemplate | 文章页版式的独立页 |
| `links` / `moments` / `moment` / `photos` / `friends` | 扩展页 | 需创建对应独立页面，部分依赖第三方插件 |
| `error/*` | 错误页 | |

共 15 个页面模板 + 56 个组件模板。**新增模板必须在 `vite.config.ts` 的 `getBuildInputs()` 中显式注册**，不会被自动发现。

### 扩展页的插件依赖与降级

| 页面 | 依赖 | 缺插件时 |
| --- | --- | --- |
| `links` | 无（纯主题配置） | 正常渲染 |
| `photos` | `PluginPhotos` 提供 `photoFinder` 与 `/photos` 路由 | 显示「图库插件未启用」+ 应用市场链接 |
| `moments` | `PluginMoments` 注入 `moments` 模型变量 | 显示「瞬间插件未启用」+ 文档链接 |
| `friends` | `plugin-friends` 注入 `friends` 模型变量 | 显示「朋友圈插件未启用」+ 文档链接 |

上游只有 `index.html` 做了插件守卫，三个独立页面没有，缺插件时**不是空白而是崩**：
Halo 已刷出响应头和约 8KB 正文，客户端收到 HTTP 200 + 截断页面，外部完全静默，只有 `curl exit 18` 能看出。
已按 `index.html` 的模式统一补齐守卫。

分页组件的守卫要下在**整个 fragment 外层**（`th:block th:if="${posts != null}"`），
不能逐个表达式加——pager 那层 `div` 上的 `th:with` 会解引用 `posts.page`。
另一个坑：把 `th:unless="${isListResult}"` 改写成 `th:if="${... and !isListResult}"` 会让**所有普通页面**崩，
因为 `isListResult` 在列表路由之外是 null，而 SpEL 不能对 null 取反；Thymeleaf 的 `th:unless` 则容忍 null。

---

## 7. pretext 评估结论：不引入

[`chenglou/pretext`](https://github.com/chenglou/pretext)（49.6k star，MIT，npm 包名为 `@chenglou/pretext`——npm 上的裸 `pretext` 是无关的标记语言包）
解决的是「不碰 DOM 就算出多行文本高度」，避开 `getBoundingClientRect` 触发的 reflow，面向虚拟列表、Canvas/SVG 文本渲染、masonry。

不适用本主题：

1. Halo 是 Thymeleaf 服务端渲染，浏览器原生排版，**不存在它要规避的 reflow 瓶颈**
2. 文章列表分页（约 10 条），不需要虚拟化——它最大的价值点用不上
3. 摘要截断用 CSS `line-clamp` 即可，零 JS
4. 运行时依赖 Canvas 2D + `Intl.Segmenter`，会给以「压缩后 ~70 KiB」为卖点的主题净增 JS，与「高性能表现」目标冲突

唯一沾边的是图库页 masonry，但图库高度由图片决定而非文本，CSS `columns` 更便宜。若日后要用，唯一站得住的方式是**只在构建期用、不进浏览器**（CI 校验多语言下按钮文案不折行），可作为 P4 可选项。

---

## 8. 交付计划

| 阶段 | 内容 | 状态 |
| --- | --- | --- |
| **P0** 骨架 | Fork 合并、全局 rebrand、构建跑通、Halo 安装激活、开发回路 | ✅ |
| **P1** 配色字体 | 5 套预设按语义层重写、三字族、自托管子集化字体、字号体系 | ✅ |
| **P2** 版式 | 强调色收敛、文字字标、纵向节奏、度量令牌、缓动统一、首页主视觉 | ✅ |
| **P3** 组件 | 文章列表、分页、点赞按钮、日期格式统一 | ✅ |
| **P4** 打磨 | 配置回归、a11y、扩展页插件验证、打包发布、`screenshot.png`、README | ✅ |
| **P5** 文档 | 主题文档站（配置项参考） | ⬜ |

### P4 各项的验证方式

| | 做法 | 结果 |
| --- | --- | --- |
| 配置回归 | 163 个可离散取值配置项 × 253 个非默认取值 × 10 个页面 | 0 硬性失败 |
| a11y | canvas 规范化颜色后算 WCAG 对比度；Tab 键走查焦点 | 深浅两色各 0 违规 |
| 扩展页 | 装 PluginLinks / PluginMoments / PluginPhotos 后灌真实内容 | 真实渲染 + 缺插件降级双向验证 |
| 打包 | `scripts/package-theme.py` 产中英双包，走升级接口装英文包 | 显示名/预览图/设置语言/六条路由全部确认 |
| 页面重量 | 逐个资源量 brotli 传输大小，主题与插件分开统计 | 见 §9 |

## 9. 已落地的实现要点

**字体**（§4.4）—— Inter / Source Serif 4 / JetBrains Mono，latin+latin-ext 子集、woff2、可变字重轴收窄（opsz 固化，wght 300–700）：484K → **228K**。
声明 `unicode-range`，无代码块的页面不下载 mono，CJK 穿透到系统字体。**CJK 不自托管**：Noto SC 子集化后仍有数 MB，与 ~70KiB/页 的目标冲突。

**字号**——三档预设按 Clay 尺度重写，正文与 h1 用 claude.com 实测的 clamp 曲线。h1 原为固定 24px，现 `clamp(32px..52px)`。默认档 small → normal。

**强调色收敛**——标题、导航回到前景色，h1 字重 700 → 400 走衬线。保留 clay 的位置与官网自身用法一致：正文链接、当前页/当前章节态、TOC 的 `#` 标记、焦点环。

**字标**——页眉头像默认关闭，站点名为衬线实时文字（字重 500、字距 -0.02em、跟随前景色）。官网用的是手绘内联 SVG 字标，但那是其商标，且主题要渲染任意用户站名，只能用实时文字。

**纵向节奏**——h1/h2/h3 上边距分别 3→4.5rem、2→4rem、0.9→2.5rem。横向无需调整：实测容器 768px、正文 66ch，本就在目标区间。

**层级修正**——`post.html` 曾把标题钉死在 `tw:text-[1.5em]`（25.5px），比章节标题还小；现走 `--text-h1`。

**首页主视觉**——`#about` 区做成主视觉，简介以 `clamp(28px..44px)` 衬线呈现、限制在 30ch、上下大留白，为空时自动塌陷。未使用官网 hero 的 `clamp(42px,7vw,112px)`——那是给固定一句话主张的，主题的简介字段长度不可控。

**文章列表**——标题改衬线 `--text-h3`/400，meta 用 `flex-flow: row wrap` + `flex-basis` 收成一行（纯 CSS，不动 Thymeleaf），摘要限 `--text-width-body`，行距 2.5→3.5rem。默认布局改为 `post-list-summary`。

**日期格式**——上游混用 `yyyy-MM-dd`(11) 与 `MMMM dd yyyy`(6)，后者在中文 locale 下渲染成「七月 31 2026」。已全部统一为 `yyyy-MM-dd`。

**缓动**——所有 ad-hoc `ease` / `ease-in-out` / `0.3s` 统一为 `var(--clay-ease)`。

**页面重量实测**——主题代码（brotli）首页 41.8 KB、文章页 84.2 KB、归档页 25.0 KB，
与上游「~70 KiB 主题资源」的量级一致。但两点要写清楚：自托管字体首访另加约 192 KB
（含代码块的页面 228 KB），之后走缓存；而一个装了评论/搜索/高亮/超链接卡的站点，
插件资源约 700 KB——主题在整页里占比不到 5%，性能讨论的重心不在主题这一侧。

### 已验证

- 构建与 stylelint 均通过；亮色 / 暗色 / 跟随系统三态渲染正常
- 路由：`/` `/archives` `/archives/:slug` `/categories` `/categories/:slug` `/tags` `/tags/:slug` `/authors/:slug` 全部 200
- 响应式：1440px 与 480px 均成立
- 浏览器实测 Inter 与 Source Serif 4 已加载，JetBrains Mono 在无代码页面保持未加载
- shiki 双主题两侧正确（浅色 `#ffffff`/深字，暗色 `rgb(36,41,46)`/浅字）

**配置组合回归**——写了回归工具逐项跑：163 个可离散取值的配置项、253 个非默认取值，
每个取值检查 6 个页面，约 1500 次渲染。首轮抓到 2 个真实缺陷（见下），修复后 **253/253 全部通过**。

发现的缺陷：列表模板拿到的是 `ListedPostVo`，**不带 `content` 字段**。
上游的「列表显示阅读时长/字数」在没有 extra-api 插件时回退到 `#strings.length(post.content?.content)`，
而 SpEL 的 `?.` 只挡 null、挡不住属性不存在，于是抛 EL1008E。
此时 Halo 已经把响应头和部分正文刷出去了，客户端收到的是 **HTTP 200 + 被截断的 8KB 正文**——
从外部看完全静默，只有 curl exit 18 能看出来。已改用 `postFinder.content(post.metadata.name)`。

**i18n**——6 个语言包各 79 个键，无缺失、无多余、无空值。

**lint**——`pnpm lint` 全套通过（autocorrect / markdownlint / oxlint+eslint / stylelint / tsgo 类型检查）。

### P4 阶段发现并修复的缺陷

按发现顺序，全部是「只有真正跑起来/打开看才暴露」的类型：

| 缺陷 | 表现 | 根因 |
| --- | --- | --- |
| 首页响应截断 | HTTP 200 + 8KB 截断正文 | `ListedPostVo` 无 `content` 字段，SpEL 的 `?.` 挡不住属性不存在 |
| moments / friends 截断 | 同上 | 共享 pagination 组件对 null `posts` 调 `hasPrevious()` |
| photos 截断 | 同上 | 缺插件时 `photoFinder` bean 不存在 |
| links 静默空白 | 页眉页脚之间空无一物 | `th:each` 遍历 null 是静默 no-op，不报错 |
| photos 标题为 `null` | 标签页显示 `null - 站名` | title 表达式缺 `?:` 兜底 |
| 仙人掌吉祥物在发货 | 每条瞬间顶着上游 logo | rebrand 只关了页眉头像，没清理 `public/assets/images/` |
| 友链空 logo 破图 | `<img src="">` 去请求页面本身 | 缺兜底 |
| 浅色下 clay 对比度不足 | 2.96–3.85，低于 AA | 我算错了；且 hover「变亮」在浅底上是降对比度 |
| 英文包全是上游信息 | displayName `higan-HowieHz-Modified` 等 | rebrand 只重写了中文 `theme.yaml` |
| 404 泄露框架文本 | `No static resource …` | `error.detail` 无条件渲染 |
| 404 自动跳转 | 5 秒后跳走，劫持后退键 | 上游默认值 |
| 冷灰混入暖灰阶 | 移动端日期竖条是 zinc 冷灰 | 模板直接用了 Tailwind 调色板类 `tw:bg-zinc-200` |

**共同模式**：模板对「可能不存在的模型变量／bean」不设防，而 Halo 的流式渲染让失败表现为
HTTP 200 —— 状态码正常、日志不显眼、点点看发现不了。新增模板时这两条都要盯。

### 开发环境陷阱：SRI + 长效缓存 + 原地重写

一次视觉走查里文章页突然「掉样式」——导航退化成裸 `<ul>`、蓝色下划线链接，
但正文标题、代码片、引用块都正常。排查链条值得记下来，因为每一步都在说谎：

1. `#header-component` 查不到 —— 假阴性。文章页用的是 `nav-post`（`#header-post`，且是 `div` 不是 `header`），
   `header = ~{}` 是 `post.html` 的有意设计。
2. 服务端 HTML 完整正确，`<link>`、类名混淆、`integrity` 三者全部对得上。
3. `curl` 取文件 200，明文与 brotli 变体解压后的 sha384 都与 `integrity` 一致。
4. 真正的信号是 `link.sheet === null` —— 浏览器取到了却拒绝挂载。

根因：**浏览器 HTTP 缓存里存着该文件的陈旧字节**，SRI 拿缓存内容校验失败，
于是样式表被**静默丢弃**（无控制台报错、无网络失败、`link` 元素一切正常）。
19 个样式表里中招 4 个，正是某次构建重写磁盘时被请求撞上的那批。

成因是三个条件叠加，缺一不可：

- Halo 直接从 `templates/assets/` 读盘服务，而 `pnpm build` / `watch` 会**原地重写**这些文件；
  请求撞进重写窗口就会读到撕裂内容。
- 这些资源带 `Cache-Control: max-age=31536000`，撕裂的响应被钉住一年。
- 带 `integrity` 时，内容对不上的后果不是回退到无校验，而是**整张表不生效**。

**只影响开发环境**：生产环境主题以 zip 安装、解压后不再原地重写，撞不上第 1 条。
排查时的判据是 `link.sheet` 是否为 null——不要信 `curl` 的哈希（它不走浏览器缓存），
也不要信网络面板的 200。清掉缓存（`fetch(url, {cache:'reload'})` 逐个覆盖，或硬刷新）即恢复。

**连带影响**：本轮之前的若干次视觉截图可能是在「部分样式表被丢弃」的页面上做的，
那些观感结论的可信度要打折。用 Node 抓取比对文本量的配置回归不走浏览器缓存，不受影响。

附带查明但**未构成缺陷**的一点：`plugins/vite-plugin-cleanup-generated-css-comments.ts`
在 `generateBundle` 里改写 CSS 资源的 `chunk.source`（剥 `/*! */` 许可头），
发生在文件名内容哈希算定之后，即**哈希不覆盖最终字节**。
由于该清理是确定性的（同一份输入必得同一份输出），同名不同内容不会真的发生，
`integrity` 实测也与最终字节一致。记在这里是因为它一度是首要嫌疑，且若日后往该插件里
加入非确定性改写，它就会变成真缺陷。

### 已完成的验证

- 响应式走查 480 / 640 / 768 / 1024 / 1440 五档，布局无断裂
- 配置回归 254 个非默认取值 × 10 个页面，0 硬性失败
- 对比度深浅两色各 0 违规；焦点指示走 Tab 键确认可见
- 打包中英双包，走升级接口验证过安装、预览图、设置语言、路由渲染

### 已知待办

- **`/blogs` 与 `/blog-requests` 仍无模板**（见上）。除此之外，P0–P4 与两轮打磨均已完成。

- **配置参考已有**（`docs/SETTINGS.md`，18 个分组 / 309 项，从 `settings.yaml` 导出）。
  没有做成 VitePress 站：手写的配置说明改一处就落后一处，而这份是生成的，
  重新跑一次脚本就与实现一致。若日后要建站，这份可以直接作为其中一页。
- **朋友圈页的真实渲染仍未见过**，但原因已查清：`plugin-friends`
  （[chengzhongxue/plugin-friends](https://github.com/chengzhongxue/plugin-friends) 1.4.6）
  在 Halo 2.25.4 上**启动失败** —— `status.phase: FAILED`，
  `Failed to introspect Class la.moony.friends.reconciler.RssSyncReconciler`，
  是插件针对更早 API 编译导致的不兼容（它声明 `requires: >=2.22.0`）。属插件侧问题。

  意外收获：这验证了主题在「插件已安装但启动失败」下的行为——
  `pluginFinder.available()` 对 FAILED 的插件返回 false，页面给出提示而非崩溃。
  这个状态原本没预料到。

- **`/blogs` 与 `/blog-requests` 无模板** —— plugin-friends 除 `/friends` 外还提供这两条路由，
  主题（含上游）都没有对应模板，访问返回 404。要完整支持该插件需补 `blogs.html` 等，
  并在 `vite.config.ts` 的 `getBuildInputs()` 里注册。
- **按钮体系** —— 有意不做。全站 32 处按钮语义中 29 处是纯图标导航（本就该无外观），
  剩下的只有点赞按钮是带文字的 CTA，已单独按 secondary 变体处理。
  抽象的「近黑主按钮 + clay 变体」没有消费方，建了就是死代码。

## 10. Console 设置界面实地走查

在此之前所有配置改动（含 253 取值的回归）都是直接 PUT configmap 走 API 写入的，
完全绕过 Console UI。回归验的是「配置写进去之后页面渲不渲染得出来」，
抓不到「用户在界面上根本没法正确设置它」——这是两类不同的失效。

**静态审计（不依赖 UI）**：151 个带 `if:` 的项全部声明了 `key:`；
中英设置包 303 : 303，键无漂移、无漏翻；5 组同名字段（`resume` / `footer_content` /
`icon` ×2 / `type`）经带父路径复查均嵌套在不同父节点下，`theme.config` 上不会互相覆盖。

**实地发现**：

| 现象 | 定性 | 处置 |
| --- | --- | --- |
| Console 分组标签全是英文，界面却是中文 | 开发环境状态残留：装过 `-en` 包，Setting 资源留在库里 | 重打中文包升级修复；反向证明了 i18n 打包链路是通的 |
| 切换开关后依赖字段不出现 | **Halo Console 行为**，非本主题缺陷 | 保存并刷新后正常出现；已写进 CLAUDE.md 免得日后误判 |
| 每个开关的 `aria-checked` 恒为 `false` | **Halo Console 自身的可访问性缺陷** | 与开关实际状态无关，读屏会把已开的念成关闭；本主题无法修 |
| 启用自定义字体后 Clay 字体栈被整个换掉 | **本主题的真实缺陷** | 已修，见下 |

**自定义字体的兜底缺陷**（`components/base-layout/template.html`）：
上游在此硬编码了一串通用系统字体作为 `--clay-font-family` 的兜底。Clay 换掉字体体系后，
「启用自定义字体」就等于把主题自己的字栈整个替换——用户还没上传文件、字体加载失败、
或字体只覆盖部分字符时，落到的是系统默认而非设计的字面，中文族名（Noto Sans SC /
PingFang / 雅黑）也一并丢失。Safari 分支（`:root.webkit`）更严重，原本是
`custom !important` 且**不带任何兜底**，`custom` 一旦不可用该变量直接无法解析。

改为引用 `var(--clay-font-sans)`，兜底自动与 `font-family.css` 保持一致。
修完 CSS 压缩器把两条规则合并成了 `:root,:root.webkit{…}`——等于机器确认了那条
Safari 特判已经冗余（上游为何要单独给 Safari 一条已不可考，这里保留规则本身只补兜底）。

实测：`body` 字体解析为 `custom, Inter, -apple-system, …, Noto Sans SC, …`，
画布量宽 297.8 与 Inter 一致、与默认衬线 301.8 不同，确认落在 Inter 上。

**18 个分组逐个打开**（直接导航 `/console/theme/settings/<group>`，比点标签页坐标可靠）：
全部渲染，**0 个 FormKit 报错、0 个无标签控件**。

| 分组 | 字段 | 分组 | 字段 |
| --- | --- | --- | --- |
| `global` | 10 | `custom_page_styles` | 7 |
| `styles` | 52 | `error_page_styles` | 2 |
| `index_styles` | 22 | `sns` | 10（可见 2） |
| `post_styles` | 23 | `share` | 11（可见 2） |
| `categories_page_styles` | 6 | `links_page_styles` | 2 |
| `category_page_styles` | 4 | `photos_styles` | 10 |
| `tags_page_styles` | 6 | `moments_styles` | 6 |
| `tag_page_styles` | 4 | `friends_page_styles` | 8 |
| `author_page_styles` | 3 | `archives_page_styles` | 4 |

挂载 190 项 / 定义 309 项，差额是条件为假被 FormKit 卸载的字段。
`sns` 与 `share` 可见数少，是因为子项在重复项（repeater）里，未添加条目前不展开。

**端到端改一次配置**：界面上把「配色方案」浅色 → 暗色 → 保存，
`configmap.color_schema` 变为 `"dark"`，前台 `data-color-scheme="dark"`、
加载 `components-theme-dark-*`，实测底色 `rgb(20,20,19)`（`#141413`）、
字色 `rgb(245,244,237)`，19/19 样式表挂载。再改回浅色，同样贯通。
界面 → 保存 → configmap → 前台这条链是通的。

**设置语言切换不是 UI 行为**：Halo 主题设置不做运行时 i18n，中英是两个独立的包，
各自把标签硬编码在自己的 `settings.yaml` 里，换语言等于换包。
这一点已被反向验证——Console 界面是中文却显示英文标签，正是因为当时装的是 `-en` 包。

**操作上的注意**：Halo 的下拉是自定义组件而非原生 `<select>`，
「点开」与「选项」之间必须留等待，否则第二次点击会落在尚未展开的列表上，
表现为保存成功但值没变。另外 JS 的 `getBoundingClientRect()` 给的是 CSS 像素，
与截图坐标系存在缩放差，点击坐标应当从截图上读而不是从 JS 算。

## 11. 打磨：字号层级与行高

**标题行高**。所有标题都没有声明 `line-height`，一路继承 body 的 `1.725`。
正文行高用在展示级字号上，单行标题上下会撑出一条空带，多行标题散成互不相干的几条——
52px 的 h1 算出来是 89.7px 行高。这与「层级由字号与字重建立」的取向相悖。

改为按级收紧：h1 `1.2`、h2 `1.3`、h3 `1.4`、h4–h6 `1.5`，字号越大行高越紧。
h1 取 1.2 而非西文常用的 1.1，是因为 **CJK 字面占满字身框、没有西文的上下留白**，
1.1 在中文标题上会发挤。改完 h1 与 hero（`.blog-description`，本就是 1.2）对齐到同一比例。

**首页层级是倒的**。`#about` 的 hero 用 `clamp(…, 2.75rem)`，上限 44px 是**刻意压的**
（注释写明：简介字段长度不可控，太大会在长文案下失控）。而文章列表标题「近期发布」
是模板里的 `h1`，走全局 `--text-h1` = 52px —— 栏目标签盖过了站点主陈述。

按栏目标签重设：`clamp(1.375rem, 0.9vw + 1.1rem, 1.75rem)`（宽屏 28px），
并降一档对比度到 78%。四种 `list_layout` 各有一个同样的 h1，用 `main > h1` 一并覆盖
（这份 CSS 只在首页加载，作用域天然正确；注意父元素是 `<main>` 元素而非 `#main`）。

结果（宽屏 / 窄屏 568px）：

| 层级 | 宽屏 | 窄屏 |
| --- | --- | --- |
| hero | 44px | 31.3px |
| 栏目标签「近期发布」 | 28px | 22.7px |
| 文章标题 | 22px | ~19px |

三级逐次递减，窄屏下依然成立，无横向溢出。栏目标签对比度 8.69:1，远高于 AA。

**配色方案选项改名**。`浅色 · Sky` / `暗色 · Sky` / `浅色 · 静默` 沿用自上游，
「Sky」「静默」对新用户没有可推断的含义。改为 `· 蓝` / `· 灰`（英文包 `· Blue` / `· Grey`）。
**只改 label，`value` 不动**，已保存的配置无需迁移。
注意 Console 要重新安装主题才会显示新标签——Setting 资源在库里，不随磁盘更新。

## 12. 打磨：清单基线与「图标 + 数字」

两处都是**用户报的**，都不是观感偏好而是可测的错位。

**清单里日期与标题不平齐**（分类 / 标签 / 归档 / 作者页，以及首页的简洁清单版式）。
`list-post-simple` 在 ≥640px 用两列网格，日期 13px、标题 15~17px，行高都继承正文的 1.725，
两列行盒差约 7px。默认的 `align-items: stretch` 让各自首行从行盒顶端起排，
**基线因此错开 4.44px**（实测）——日期看着比标题高一截。加 `align-items: baseline` 后为 0。

首页的摘要版式（`post-list-summary`）本来就对：外层网格有 `items-baseline`，实测差值 0。
量它的时候踩了个坑：`<time>` 自身是 `align-items: center` 的 flex 容器，
往里塞零高探针量到的是**居中位置而非基线**，会得出 -4.67px 的假错位。
把容器临时切成 `align-items: baseline` 再量才是真值。

**「图标 + 数字」并排不对齐**。iconify 图标是 `vertical-align: middle` 的 inline-block，
对齐点是「基线 + 半个 x-height」，比数字的视觉中心低约 0.09em——瞬间页 17px 下**实测 1.51px**，
心形的下尖明显坠到数字下面，评论气泡的尾巴更甚。改成 flex 按盒中心对齐后降到 0.77px。

余下的 0.77px 是**盒中心不等于墨迹中心**：Inter 17px 实测 `"0"` 的 ascent 13px / descent 1px，
墨迹中心比行盒中心高 0.038em；而图标墨迹基本就在自己的盒中心（心形 12.175/24，气泡 12/24）。
差值提为 `--clay-icon-optical-shift: -0.04em`，只补给**数字旁边**的图标——
普通图文混排不适用（小写文本带下伸部，墨迹中心本来就更靠近盒中心）。
补后：心形 0.09px、气泡 -0.04px、阅读量的眼睛 -0.23px。

> 测量精度的边界：Chrome 的 `actualBoundingBoxAscent/Descent` 在小字号下返回整数
> （13px 时 asc=10 / desc=1），量化误差就有 ±0.5px，与要修的量同一量级。
> 所以 0.5px 以下的残差不再追——放大到 80px 目视确认即可。

**点赞图标的宽高设置一直是空转的**。上游写的是 `th:width` / `th:height`：
`width`/`height` 是 `<img>` 一类替换元素的表现属性，放在 `<span>` 上浏览器直接忽略，
图标始终是 CSS 给的 `1em`。改为把值传成自定义属性（`--upvote-icon-w/h`）由 CSS 消费，
值为空时不输出、回落 `1em`。默认值也从 `1rem` 改为 `1em`（此前这个 `1rem` 从未生效过），
标签由「点赞按钮宽度」更正为「点赞图标宽度」——它管的一直是图标，不是按钮。
实测 `2rem` → 32px 图标，设置生效。

**点赞按钮默认关闭**（`is_post_upvote_button_show: false`，沿用上游）。
用户报「按钮不见了」即此——回归脚本跑完会把配置还原成默认值。

## 13. v0.1.1：验收反馈修正

三条都来自实机验收，根因各不相同。

### 主视觉只认一种来源

`#about` 里可以出现三种语句，模板顺序是 `#quote`（一言，插件异步填充，首帧为空）→
`#randomSentence`（自定义随机句）→ `.blog-description`（简介 / 公告栏）。
v0.1.0 的主视觉只挂在 `.blog-description` 上：只开一言的站点完全没有主视觉，
只开随机句的还被显式压成 65% 灰的次级行——**这不是「不兼容」的巧合，是漏了另外两条来源**。

改为按优先级取第一条非空的语句作主视觉：简介 > 随机句 > 一言。
简介是站长写死的主张，另两者是轮换的点缀，所以简介在场时它是主角。

实现上踩了 `:is()` 的特异性坑：次级排版写成 `#about > :is(#quote, #randomSentence, .blog-description)`，
而 **`:is()` 取参数里最高的那个特异性**——内含 `#quote` 让整条变成 (2,0,0)，
压过了主视觉的 (1,3,0)。现象很迷惑：衬线字体来自主视觉规则、字号却来自次级规则，
一半生效一半不生效。改用 `:where()`（特异性恒为 0）解决。

顺带补上空态：简介开着但内容为空（既没填也没有站点描述）时那一行不留白，
一条语句都没有时整块不占位。`#quote` 不参与空态隐藏——它首帧本来就是空的，
插件用 `::before` 占位以避免抓回来时跳动。

### 三个「默认关闭」让功能看起来是坏的

`is_resume_show`、`quote`、`is_random_sentence_show`、`is_i18n_resume_show` **四个来源全部默认 `false`**
（沿用上游）。于是全新安装的首页 `#about` 是空的，主视觉根本不出现——
对一个把大字主张当作识别特征的主题来说，这是招牌默认不亮。
`is_resume_show` 改为默认 `true`，内容回落到站点 SEO 描述。

`is_show_post_upvote_count` 同理：默认 `false`，且它的显示条件是
`$is_post_upvote_button_show === true`。**Halo Console 的条件字段要保存并刷新后才挂载**
（见 CLAUDE.md），所以用户打开点赞按钮并保存的那一次，根本看不到「展示文章获赞数」这个开关——
表现就是「点了赞，爱心后面没有数字」。改为默认 `true`。

点赞链路本身是好的：实测点击 → POST `/apis/api.halo.run/v1alpha1/trackers/upvote` → 计数 0→1 →
写入 localStorage → 刷新后服务端渲染为 1 且按钮标记为已赞。

### 搜索插件的薄荷绿

`plugin-search-widget` 的强调色默认是 `#4CCBA0`，面板底色是冷灰 `#f8fafc` / `#fff`，
暗色块还硬编码了冷调的 `#090a11` / `#15172a`——在暖灰底上是显眼的异色。

新增 `components/halo-search-widget`，只输出一组自定义属性。
**变量挂在 `<search-modal>` 宿主元素上而不是 `:root`**：插件的暗色选择器是
`.dark, [data-color-scheme=dark]`（作用在 `<html>`），且插件样式表比主题的后加载，
写 `:root` 会输在同特异性后置上。自定义属性按继承就近生效，宿主元素离用例更近，
不比特异性、不用 `!important` 就能同时接管明暗两套。同样的做法早已用在 `halo-comment-widget` 上。

顺带核过其余插件：评论插件的暗色默认值是翠绿 `#059669`，但主题的 `comment-widget`
覆盖按同样的就近原则已经生效（实测明暗两态都是 `#c0502b` / `#d97757`）；
超链接卡片插件用的是中性 zinc 灰，非异色，暂不接管。

## 14. v0.1.2：「与我联系」那一行

用户报「与我联系」和后面的社交图标不平齐——属实，而且是**第三次**撞上同一个根因：
iconify 图标是 `vertical-align: middle` 的 inline-block，对齐点是「基线 + 半个 x-height」，
那是给小写西文的，不是文字的视觉中心。中文标签下更明显：CJK 字面下沿低于西文基线，
17px 下实测**图标盒心比文字墨迹中心低 1.89px**（约 0.11em）。

顺手量出第二个问题：图标之间**没有间距**。模板里的换行空白塌缩成约 4.7px 的一个空格，
而且那段空白落在 `<a>` 内部——链接实际宽度 25.12px、图标只有 20.4px，
多出来的 4.7px 是被拖长的点击区。

改法与前两处一致：`#findMe` 用 flex + `align-items: center`，间距交给 `gap`；
`<a>` 也用 `inline-flex`，纯空白的匿名项在 flex 里会被丢弃，链接宽度回到 20.4px。
盒对齐后仍差 1.14px（墨迹中心不在行盒中心上），补 `--clay-icon-optical-shift`
后降到 0.33px，落进测量噪声内。

> 量这一处时又踩了一次 flex 的坑，与 §12 量 `<time>` 时同源：
> 往 flex 容器里塞零高探针，探针会**成为它自己的 flex item** 被居中，
> 量到的是行中心而不是文字基线，会得出 6.49px 的假偏差。
> 正解是先在 `display: block` 下标定「Range 顶边 → 基线」的距离（实测 16.67px，
> 与 `fontBoundingBoxAscent` 的 16 接近但不等），再拿这个关系去推 flex 下的基线。

补正量对西文是否过头，按实际标签核过——五个语言包的 `page.index.findMeLeftText`
（`Find me on` / `Encuéntrame en` / `与我联系` / `與我聯繫`）**都没有下伸部**，
补后偏差分别是 CJK +0.33px、西文 −0.17px，都在噪声内。
构造一个带下伸部的串（`Reach me typography`）会到 −1.67px，但现行语言包里不存在这种情况。

## 15. 自托管中文衬线

### 症状与病因

同一个站点，桌面端中文标题是宋体，手机上是黑体——衬线/无衬线的对比整个消失，
而这个对比是本主题最核心的识别点。

拉丁衬线（Source Serif 4）是自托管的，一直没问题；中文衬线不是。
`--clay-font-serif` 里 CJK 段全是**系统族名**，字面取决于访客设备里恰好装了什么：

| 系统 | 中文衬线 | 结果 |
| --- | --- | --- |
| Windows | SimSun / 宋体 | 有 |
| macOS / iOS | Songti SC | 有 |
| 安卓 | 只随 Noto Sans CJK | **没有** |

安卓的 `serif` 泛型指向 Noto Serif，那是纯拉丁字体，汉字再往下回落就落到 Noto Sans CJK。
所以不是「回落到另一种衬线」，是**根本没有中文衬线可回落**。

### 为什么不能整包下发，以及 unicode-range 是什么

思源宋体一个字重、按谷歌的网页覆盖面（14517 字）压成 woff2 是 **2.41 MB**。
不能整包。

浏览器原生的按需加载机制是 `@font-face` 的 `unicode-range`：
把字体切成若干分片，每片声明自己覆盖哪些码位，**页面上没出现的码位所在的分片不会被请求**。
不需要 JS，不需要框架，是字体规范本身的一部分。

难点在切法。两组实测：

1. 中文衬线在本主题只用于 `h1` / `h2` / `blockquote` / 站点名——
   一个页面上的不重复汉字大约 40～100 个，且散落在常用字表各处。
2. 按谷歌那样 188 字一片均匀平切，一个页面命中 **12 片、471 KB**：
   每片只用上几个字，却要付整片的钱。仓库里 58 条真实中文标题的实测。

关键在于**用字稀疏时，切得再细也省不下来**。设页面用 k 个不重复字、
字池 P 字、每片 s 字，命中片数约 `min(k, P/s)`；k 远小于 P/s 时体积正比于 `k × s`，
但常用字池本身只有 2000 多字、总共 400 KB 上下，k≈90 时几乎把整个池子都摸了一遍。
所以**常用档不该切**——切片的开销（每片重复的字体表头）反而白付 18%。

### 落地的两档结构

```text
常用档  按字频前 2451 字，一个文件 410 KB，精确 unicode-range，后声明
生僻档  其余 10353 字，按码位切成 58 个连续窗口，粗 unicode-range，先声明
```

重叠部分靠**后声明者优先**分流——这是 CSS 字体匹配的既定行为，已实测确认：
构造两个同族 face，粗范围的在前、精确范围的在后，
访问精确范围内的字符时只请求后者，粗范围那片保持 `unloaded`；
出现精确范围外的字符时才拉粗范围那片。

这样常用字只发一个请求，而生僻字仍然有字可用，不会在中文标题里混进一个黑体字。
粗窗口还让 CSS 小了一个数量级：生僻档若写精确范围要 55 KB，写连续窗口只要 2 KB。

字频顺序取自谷歌为该字体族切分的 101 个分片——它们按字频聚类，序号越大越常用。
顺序落盘在 `scripts/fonts/noto-serif-sc.order.txt`，构建不联网。

### 实测

| 场景 | 请求数 | 中文字体体积 |
| --- | --- | --- |
| 普通中文页面 | 1 | 410 KB |
| 页面出现 2 个生僻字（分属两个窗口） | 3 | 504 KB |
| 纯外文页面 | 0 | 0 |
| 均匀平切 188 字/片（对照） | 12 | 471 KB |

覆盖率：仓库 58 条真实中文标题共 190 个不重复汉字，常用档命中 189 个（99.5%），
剩下 1 个（`阱`）走生僻档。整页字体总量从 221 KB 升到 631 KB。

族名刻意叫 `Clay Serif SC` 而不是 `Noto Serif SC`：同名会和访客本机安装的版本混起来，
同一站点在不同机器上落到不同字面——而这次改动的整个目的正是消除这种不一致。
也因此没有在 `src` 里写 `local()`。

只做了 400 字重，因为衬线在本主题只用于 `font-weight: 400` 的场合。
中文**无衬线**不自托管：安卓、iOS、Windows、macOS 都自带像样的黑体，没有同类缺口。

### 两个绊了一下的地方

**autocorrect 会改数据文件。** 字表是一串汉字，autocorrect 把它当文案处理——
中西文之间补空格、全角转半角，一次 `pnpm lint` 就把字频顺序改乱、还插进空格字符
（14517 字变 14516，常用档少收 62 字）。已加进 `.autocorrectignore`，
并且字表现在只存过滤后的 CJK 码位，不再混入空格和控制字符。

**stylelint 的取值匹配器有规模上限。** 常用档那条 `unicode-range` 有 1704 段，
csstree 跑到 15000 次迭代就放弃，然后把整个取值报成 `Unknown value`。
是 linter 的上限不是语法问题，在生成的文件头部关掉该规则。

**`page-weight.mjs` 原本会把 CSS 里引用到的字体全算上**，加上 59 片就直接报 3 MB，
和现实差一个数量级。改成按 `unicode-range` 与页面实际字符求交，
并复现「后声明者优先」，量出的 631 KB 与浏览器网络面板一致。
过程中还发现 lightningcss 会把 `U+0000-00FF` 压成通配写法 `U+??`，
不认这一种会把整条 Latin 范围解析成 `NaN`。

## 16. v0.2.1：段落节奏与页脚署名

### 段落间距一直是浏览器默认值

§11 把标题的行高与边距逐级调过，段落却始终没被碰过——`p` 的 `margin-block` 是
UA 默认的 `1em`，主题从未声明。两者叠起来就偏松：

| 量 | 17px / 行高 1.725 |
| --- | --- |
| 行内墨迹间距 | 12.3px |
| 跨段墨迹间距 | 6.2 + 17 + 6.2 = 29.3px |
| 比值 | **2.38 倍** |

段落之间空得比行之间多一倍还不止，每一段都像单独一块，连不成篇。
正文常见的比值在 1.8～2.0，收到 `0.65em` 后是 23.4px、**1.90 倍**。

值收进 `--clay-paragraph-gap`。用 `em` 不用 `rem`——脚注、评论这类小字号语境里，
段距应当同比例收窄。

### 顺带修好的：倍率设置的基准对不上

`layout-heading-paragraph-margin-style` 里的倍率是乘在**写死的基准值**上的，
而那些基准是上游的数字，本主题早就改过了：

| 元素 | 组件里的基准 | 实际基准 |
| --- | --- | --- |
| h1 | 3rem / 1rem | 4.5rem / 1.25rem |
| h2 | 2rem / 0.5rem | 4rem / 1rem |
| h3–h6 | 0.9rem / 0.5rem | 2.5rem / 0.75rem |
| p | 1em | `var(--clay-paragraph-gap)` |

也就是说，把「标题上边距倍率」从 1 改成 1.1，h2 的上边距不是变成 4.4rem，
而是掉到 2.2rem——**调大反而变小**。默认值是 1 所以从未触发，一旦有人动这几项就会撞上。
段落一项现在直接引用令牌，标题三项仍是重复的字面量，改基准样式时要手动同步（已写进组件 README）。

### 页脚署名指错仓库

`Theme is Clay` 的链接仍指向上游 `HowieHz/halo-theme-higan-hz`。改指本仓库，
`title` 属性保留「基于 HowieHz/halo-theme-higan-hz 二次开发」的说明，署名不丢。

## 17. v0.2.2：内置光标组与点击特效

主题此前只有「启用自定义光标文件」这一个开关：站长不上传就什么都没有，
上传则要自己备齐十三张图。开关默认关闭，等于这项能力对绝大多数站点从不存在。
本版把它改成三档，并随主题内置一套光标。

### 三档

| 取值 | 行为 |
| --- | --- |
| `clay`（默认） | 随主题设计的 13 种 SVG 指针 |
| `system` | 完全不改，交给操作系统 |
| `custom` | 沿用旧行为：用站长上传的文件，没上传的那些回落到系统指针 |

老站点升级时这一项在 ConfigMap 里根本不存在（Halo 只对从未保存过的配置项套默认值），
所以模板里取的是 `?: 'clay'`——写成直接比较，三档都不中，等于默认关掉了内置光标。

### 变量层：一份选择器表，两种来源

「哪类元素用哪种指针」和「具体贴哪张图」是两件事，拆开：

- `_runtime/global/cursors/selectors.css` 只写选择器，值一律是 `var(--clay-cursor-X, <关键字>)`
- `clay` 档由生成的 `src/generated/clay-cursors.css` 定义这些变量
- `custom` 档由 `components/custom-cursor-style` 内联覆写同名变量

于是自定义模式不必再抄一遍两百行选择器，两档的元素映射也永远一致。
关键字兜底不是保险起见：自定义模式下站长通常只传两三张，其余变量是未定义的，
而未定义的自定义属性会让整条 `cursor` 变成 invalid at computed-value time 并回落到**继承值**，
落在正文上就是整页跟着 `:root` 显示箭头。

### 形状

十三种：`default` `pointer` `text` `vertical-text` `help` `wait` `cell` `crosshair`
`move` `not-allowed` `grab` `grabbing` `ew-resize`。

统一手法是一条 path 同时描边加填充（`paint-order='stroke'`，描边总宽 3，露出 1.5），
轮廓色恒为填充色的反色。这样指针压在代码块、图片、任何异色区域上都还剩一圈能看清的边。

三处刻意偏离常规：

- **链接不画手。** 手掌在 24px 上永远糊成一团。改成同一支箭头换成交互色，
  右侧再点一颗同色圆点——颜色之外还有一处形状差异，色觉障碍下同样能分辨。
- **`text` 是衬线 I 型。** 衬线与竖干之间一段短圆角过渡，和 `--clay-font-serif` 呼应。
  衬线/无衬线的对照是这套主题的核心识别特征，指针也该带上。
- **`grab` / `grabbing` 是空心与实心的圆角方。** 「松开 → 攥住」的状态差比手掌开合清楚得多，
  也和站点标识的方形同源。

配色只分浅深两档，不跟随七个配色预设。指针是主题签名，蓝色预设是同一套主题的变体，
没有理由让指针也跟着变蓝；`clay` 取的是对应明暗档 `--color-primary` 的字面值
（浅 `#c0502b` / 深 `#d97757`）。

### 为什么是生成的

一套形状要出四份：浅色/深色 × 1x/2x。同一支箭头写四遍，改一次颜色就得改四处。
`src/scripts/generate-cursor-css.ts` 把形状和配色拆开，形状只写一次。

2x 那一份是给 Safari 的：它把 SVG 光标按 1x 栅格化后再放大，在 2x 屏上是糊的
（Chrome / Firefox 不会）。解法是同一张图再声明一份 width/height 翻倍的版本走 `image-set`。
这一层必须整个包在 `@supports` 里——自定义属性的值不做语法校验，
「同名声明写两遍降级」的老办法在这里失效，后一条永远覆盖前一条。

体积：57.8 KB 原始，**1.5 KB brotli**。数据 URI 之间几乎完全重复，压缩率极高。
加上选择器表 0.6 KB，整套内置光标每页 2.1 KB。

### 顺带修好的三处选择器

| 问题 | 上游写法 | 现在 |
| --- | --- | --- |
| 整个内容区显示 I 型指针 | `text` 铺到 `main` / `section` / `aside` | 只给真正承载文字的容器 |
| 链接内的文字显示 I 型 | `a p` 归入 `text` 组 | `a *` 归入 `pointer` 组，与浏览器原生行为一致 |
| 带 title 的按钮显示问号 | `[title]` 归入 `help` 组 | 收窄到 `abbr[title]` 与 `[role="tooltip"]` |

第三条的成因是特异度：`[title]`(0,1,0) 压过 `button`(0,0,1)，
于是主题自己那颗带 `title="(Alt + T)"` 的深浅色切换按钮显示的是帮助指针。

另外两项配置项的「是否属于未使用」标错了：`ew-resize` 实际应用在滑块上却藏在
「展示未使用的光标文件配置项」后面，`copy` 反之。已对调。

### 点击特效

左键落一个圆、右键落一个圆角方——正是站点标识「方圆」拆开的两半。
共用一条 420ms 和主题唯一的那条缓动，靠形状而不是颜色区分，任何配色方案下都分得清是哪一键。

只画一圈发丝线，不填色：层级来自字号与字重，不来自阴影和色块，
点击反馈没有理由比正文更响。

三个实现细节：

- **尺寸走 `width` / `height` 而不是 `transform: scale()`。** 缩放会把边框一起放大，
  轮廓越扩越粗，方向正好和「扩散淡出」相反。`translate(-50%, -50%)` 的百分比是相对元素自身
  尺寸算的，尺寸每帧变它也每帧重算，圆心自动钉在点击点上。
- **透明度中间补一档。** 缓动是 ease-out，尺寸前快后慢，大半个时长都停在最大尺寸上；
  透明度若跟着线性走，能看清的窗口只剩最初一百多毫秒。55% 处按到 62%，可见窗口拉到约 300ms。
- **用 `pointerdown` 而不是 `click`。** 反馈要跟着按下走；而且右键根本不产生 `click` 事件，
  `pointerdown` 则在系统右键菜单弹出之前就已经派发。监听挂在捕获阶段，页面里任何
  `stopPropagation` 都不会把它吞掉。

触摸操作不触发（手指本身就是反馈），`prefers-reduced-motion: reduce` 下整套跳过，
脚本和 CSS 各拦一道。同时存在的节点上限 6 个。

体积：JS 0.28 KB + CSS 0.29 KB brotli。

## 附录：调研方法

§4 全部数值来自实际抓取：`curl https://claude.com/` 取原始 HTML（209KB）→ 提取 5 个 CSS chunk 引用 → 下载共 327KB → 正则提取自定义属性、`@font-face`、`border-radius`、`letter-spacing`、`cubic-bezier` 并按频次排序。

Halo 侧规范以对应小版本的官方文档为准——模板变量与 Finder API 在小版本间会变，不能凭记忆写字段访问。
