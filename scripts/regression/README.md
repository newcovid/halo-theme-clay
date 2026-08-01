# 主题配置回归

`settings.yaml` 有 2500 余行、19 个配置分组，每一项都可能影响渲染。
全组合不可能穷举，但**逐项独立测试**是 O(n) 的，能抓到绝大部分崩坏。

## 为什么需要它

Halo 是流式渲染。模板求值抛异常时，响应头和前 8KB 正文已经发出去了，
客户端拿到的是 **HTTP 200 + 截断正文**——状态码正常，日志不显眼，从外部完全静默。

另一种更隐蔽的：Thymeleaf 的 `th:each` 遍历 null 集合是静默 no-op，
页面会渲染成只有页眉页脚的空壳，连截断都算不上。

这两种都不会体现在状态码上，所以本工具同时检查传输完整性、异常痕迹和**正文区可见文本长度**。

## 用法

需要 Halo 在跑、主题已激活，且 `halo-client.mjs` 里的地址与凭据可用。

凭据从环境变量读取，不写在仓库里：

```bash
export HALO_BASE_URL=http://localhost:8090   # 可选，这是默认值
export HALO_USERNAME=<你的管理员账号>
export HALO_PASSWORD=<你的管理员密码>

python scripts/regression/enumerate-settings.py settings.yaml > /tmp/settings-enum.json
node scripts/regression/run.mjs /tmp/settings-enum.json
```

> 登录必须走 RSA：Halo 的 `/login` 把 `password` 渲染成 hidden 字段，页面内联 JS 用
> jsencrypt（RSA PKCS#1 v1.5）加密后才提交，直接发明文恒返回 `invalid-credential`。
> `halo-client.mjs` 已封装这一步。

全部通过时退出码 0，有失败时为 1 并逐条列出「哪个配置项的哪个取值、哪个页面、什么问题」。

## 三项检查与各自的边界

**硬性失败**（判定不通过，退出码 1）：

1. **传输完整性**——`fetch` 抛错即视为响应被中途切断，这是模板抛异常最典型的表现。
2. **异常痕迹**——页面上出现 `SpelEvaluationException`、`EL1008E` 等字样。

**启发式警告**（只列出，不判失败）：

1. **内容明显减少**——可见文本跌到该页基线的一半以下。基线在开跑前采集。
   这一项误报率不低，属正常：`list_layout` 切成简洁列表本就没有摘要，切成瞬间/朋友圈列表
   在缺插件时显示的是「插件未启用」提示——都是正确行为。所以它只提示「去看一眼」，不判失败。

第 3 项用相对基线而非绝对字符数，是因为各页面模板结构不一（有的有 `<article>`，有的没有），
按 DOM 结构定位「正文区」并不可靠。

**这三项都抓不到的情况**：页面结构完整、状态码正常、文本量也没明显减少，但视觉上是错的
（配色失效、布局错位、层级颠倒）。那只能靠实际打开页面看。
`links` 页当初就是渲染成只剩页眉页脚——文本量还有 100 余字符，任何绝对阈值都拦不住，
最后是靠截图发现的。

## 覆盖范围

- 163 个可离散取值的配置项（switch / radio / select / checkbox），253 个非默认取值
- 10 个页面：首页、文章页、归档、分类集合/详情、标签集合、作者页，以及
  links / photos / moments / friends 四个扩展页

改动视觉层之后应当复跑。新增页面模板时，记得往 `run.mjs` 的 `PAGES` 里加一行——
扩展页最初就是因为不在页面集里而漏检的。

## 子资源完整性校验

```bash
node scripts/regression/verify-sri.mjs [baseUrl]
```

逐页抽出所有带 `integrity` 的 `link` / `script`，核对声明值与服务端实际返回的字节是否一致，
并且**按 identity 与 brotli 两种编码各取一遍**——Halo 会依 `Accept-Encoding` 返回预压缩产物，
若 `.br` 与源文件不同步，只有真实浏览器会中招，`curl` 默认请求看不出来。

为什么单独做一项：带 `integrity` 的资源校验失败时，浏览器**不是**回退到「不校验」，
而是整张表不生效——没有控制台报错、没有网络失败、`link` 元素的所有属性都正常。
页面于是「掉样式」，而常规排查手段（看状态码、看网络面板、`curl` 取文件比对哈希）
全部显示正常。唯一可靠的判据是 `link.sheet === null`。

开发期还有一个只影响本地的叠加陷阱：Halo 直接从 `templates/assets/` 读盘服务，
而 `pnpm build` / `watch` 会**原地重写**这些文件；请求撞进重写窗口就会读到撕裂内容，
又被 `Cache-Control: max-age=31536000` 钉住，此后每次加载都 SRI 失败。
排查时不要信 `curl` 的哈希（它不走浏览器缓存），清掉缓存即恢复：

```js
// 在页面控制台执行，逐个覆盖被污染的缓存条目
const l = [...document.querySelectorAll('link[rel=stylesheet]')];
await Promise.all(l.map(x => fetch(x.href, { cache: 'reload' })));
// 然后重新加载页面，再检查：
l.filter(x => !x.sheet).map(x => x.href)   // 应为空数组
```

生产环境不受影响：主题以 zip 安装、解压后不再被原地重写。

## a11y 审计

`a11y-audit.js` 贴到浏览器控制台执行，检查文本对比度。两个坑写在文件头部：

- **颜色不能用正则解析**——暗色主题的计算值是 `oklab(...)`（`color-mix` 的结果），
  按 rgb 读会得到完全错误的比值。用 1×1 canvas 让浏览器规范化成 sRGB。
- **焦点不能用 `el.focus()` 检测**——程序化聚焦不触发 `:focus-visible`，
  而浏览器默认焦点环只在 `:focus-visible` 下绘制，会误报「全部元素都缺焦点指示」。
  实际用 Tab 走一遍即可确认，Chrome 的 `outline-style: auto` 在深浅两种底色上都可见。
