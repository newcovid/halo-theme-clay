# 视觉自测样张

改动视觉之后要看的东西是固定的那几样，但每次临时找一篇文章、或者往 DOM 里注入几段文字，
看完就没了——下次改动之后没法拿同一份东西再看一遍，前后对比就无从谈起。这里把那份东西固定下来。

## 灌样张

```bash
export HALO_USERNAME=<管理员账号>
export HALO_PASSWORD=<管理员密码>

node scripts/fixtures/seed.mjs           # 建或更新
node scripts/fixtures/seed.mjs --clean   # 移入回收站
```

幂等：按 slug 找已存在的文章，有就更新正文并重新发布。反复跑不会堆出重复文章，
也只碰 slug 以 `fixture-` 开头的那些，不动正式内容。分类与标签按 slug 复用站上已有的，缺哪个建哪个。

凭据只从环境变量读，不写进仓库。

## 五篇各管一件事

一篇只服务一类观察，不做大杂烩——混在一起的样张看着全，真出问题时却分不清是哪一项引起的。

| 路径 | 用来看 |
| --- | --- |
| `/archives/fixture-typography` | 标题层级、列表、表格、引用、代码块、缩写、上下标、`hr` 前后留白 |
| `/archives/fixture-links` | **一段里堆五六个链接**时静止态下划线的墨量；折行链接、相邻链接、段首段尾、包着行内代码与缩写的链接；末尾有一段无链接的对照 |
| `/archives/fixture-cursors` | 已接线的光标各自的触发元素；点击特效 |
| `/archives/fixture-longform` | 十二个二级标题，撑起目录，看滚动高亮与目录自身的跟随滚动 |
| `/archives/fixture-cjk` | 自托管衬线的分片：常用字与稀有字并排，另有韩文用来确认**不**会误拉中文切片 |

## 切配色

```bash
node scripts/fixtures/set-preset.mjs light-gray
```

取值见 `settings.yaml` 的 `color_schema`：`light` / `dark` / `auto`，以及 `-blue`、`-gray` 两个色系。
只改这一项，其余配置原样保留。模板从磁盘读，切完刷新页面即可，不必重装主题。

## 不需要指针的评审页

```bash
node --experimental-strip-types scripts/fixtures/build-review-page.mjs [输出路径]
```

光标和悬停在手机、平板上根本不存在：触屏既没有指针可看，也没有 hover 可触发。
这份单文件页面把它们改写成不依赖指针的形式——悬停改成自动轮播，光标按原始 SVG 放大三倍摊开当静物，
点击特效在触屏上本来就能触发。光标图形直接从 `generate-cursor-css.ts` 导入，不另抄一份，改了形状这页跟着变。

产物是自包含的单个 HTML，可以直接发到手机上打开。
