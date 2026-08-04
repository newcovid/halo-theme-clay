/*
  样张文章的正文。与 seed.mjs 分开放：这里全是内容，那边全是 API 交互，
  改样张时不必碰认证与 upsert 逻辑。

  直接写 HTML 而不是 Markdown，理由是站上既有文章存的就是 rawType: HTML、raw === content，
  主题拿到的也正是这份 HTML（post.content.content，用 th:utext 输出）。
  中间放一个 Markdown 转换器只会多一处可能自己出错、却被当成「主题的问题」的地方。

  取材原则：一篇只服务一类观察，不做大杂烩。混在一起的样张看着全，真出问题时
  却分不清是哪一项引起的——上一轮判断不了「正文链接密不密」，正是因为手上没有
  一篇链接密集的真文章，只能临时往 DOM 里注入段落。
*/

/** 样张一：主题会碰到的每一种块级与行内元素各来一次 */
const typography = `
<h2>标题层级</h2>
<h3>三级标题</h3>
<h4>四级标题</h4>
<h5>五级标题</h5>
<h6>六级标题</h6>
<p>正文段落。<strong>粗体</strong>、<em>斜体</em>、<del>删除线</del>、<code>行内代码</code>、
<abbr title="Cascading Style Sheets">CSS</abbr> 缩写、上标 H<sub>2</sub>O 与下标 E=mc<sup>2</sup>。
中英混排：Anthropic 的 warm gray 灰阶从 <code>#FAF9F5</code> 走到 <code>#141413</code>，每一档都带着同样的暖偏移。</p>
<blockquote>
<p>层级由字号与字重建立，而非线框与阴影。</p>
<p>引文的第二段，用来看多段引用之间的间距。</p>
</blockquote>
<h2>列表</h2>
<ul>
<li>无序列表第一项</li>
<li>第二项，带一段长到需要折行的文字，用来看列表项内部的行距与缩进是否和正文一致，以及第二行的起始位置有没有对齐
<ul><li>嵌套第一层<ul><li>嵌套第二层</li></ul></li></ul>
</li>
<li>第三项</li>
</ul>
<ol>
<li>有序列表第一项</li>
<li>第二项</li>
<li>第三项</li>
</ol>
<h2>表格</h2>
<table>
<thead><tr><th>令牌</th><th>取值</th><th>用途</th></tr></thead>
<tbody>
<tr><td><code>--clay-duration</code></td><td>0.2s</td><td>全站唯一的状态过渡时长</td></tr>
<tr><td><code>--clay-ease</code></td><td>cubic-bezier(.4, 0, .2, 1)</td><td>全站唯一的缓动</td></tr>
<tr><td><code>--clay-rule-thin</code></td><td>1px</td><td>链接静止态的断线</td></tr>
<tr><td><code>--clay-rule-thick</code></td><td>2px</td><td>链接悬停态的实线</td></tr>
</tbody>
</table>
<h2>代码块</h2>
<pre><code class="language-css">:root {
  --clay-rule-solid: linear-gradient(var(--color-accent) 0 0);
  --clay-rule-dashes: repeating-linear-gradient(
    270deg,
    currentcolor 0 var(--clay-rule-dash),
    transparent var(--clay-rule-dash) var(--clay-rule-period)
  );
}
</code></pre>
<hr />
<p>分割线上方是一段收尾文字，下方还有一段，用来看 <code>hr</code> 前后的留白是否对称。</p>
`;

/** 样张二：唯一目的是看「一段里五六个链接」时静止态断线的墨量 */
const links = `
<p>判断一套下划线好不好用，要看它在链接密集的段落里是什么样，而不是看孤零零的一条。
下面几段刻意把链接堆到了真实写作中偏高的密度。</p>
<h2>段内密集</h2>
<p>在 <a href="https://vite.dev/">Vite</a> 上用 <a href="https://rolldown.rs/">rolldown</a> 打包、
以 <a href="https://tailwindcss.com/">Tailwind</a> 做原子类、再交给 <a href="https://halo.run/">Halo</a>
渲染的组合里，<a href="https://www.thymeleaf.org/">Thymeleaf</a> 是唯一一个在服务端求值的环节，
也因此是唯一一个会把<a href="https://docs.halo.run/">流式渲染的截断</a>暴露给访客的环节。</p>
<h2>折行与边界</h2>
<p>这一条<a href="https://example.com/">链接特意写得很长，长到必然会折到第二行甚至第三行去，
好观察实线自左向右铺展时跨行是什么表现，以及断线在行末与行首的接续</a>是否自然。</p>
<p><a href="https://example.com/">段首就是链接</a>，中间是普通文字，而<a href="https://example.com/">段尾也是链接</a>。
<a href="https://example.com/">两个</a><a href="https://example.com/">相邻链接</a>之间只隔一个字符边界。</p>
<h2>特殊内容的链接</h2>
<p>链接里包着行内代码：<a href="https://example.com/"><code>--clay-rule-solid</code></a>，
主题对这种情况取消下划线、只留变色。</p>
<p>链接里包着缩写：<a href="https://example.com/"><abbr title="Cascading Style Sheets">CSS</abbr> 自定义属性</a>。</p>
<h2>对照：一个链接都没有的一段</h2>
<p>作为对照，这一段里一个链接都没有，用来和上面几段并排比较墨量。同样的长度、同样的行距、
同样的中英混排比例，只是所有下划线都被拿掉了。如果上面几段读起来明显更花，
那就说明静止态的断线还是太重了；如果几乎看不出差别，那说明它太轻、起不到标记作用。</p>
`;

/** 样张三：把已接线的光标的触发元素凑齐一页 */
const cursors = `
<p>这一页把主题已接线的光标触发元素凑在一起，方便逐个划过去看。
手机与平板上没有指针，这一页在触屏设备上看不出任何区别——这是预期行为，不是缺陷。</p>
<h2>文本与链接</h2>
<p>普通段落文字触发 <code>text</code>；<a href="https://example.com/">这是一条链接</a>触发 <code>pointer</code>；
<abbr title="这里是释义内容">带释义的缩写</abbr>触发 <code>help</code>。</p>
<p style="writing-mode: vertical-rl; height: 8em; border-left: 1px dashed currentcolor; padding-left: 0.5em;">竖排文字触发 vertical-text</p>
<h2>表单与滑块</h2>
<p><label>滑块（<code>ew-resize</code>）：<input type="range" min="0" max="100" value="40" /></label></p>
<p><label>禁用的输入框（<code>not-allowed</code>）：<input type="text" value="不可编辑" disabled /></label></p>
<p><button type="button" aria-busy="true">忙碌状态的按钮（<code>wait</code>）</button></p>
<h2>拖拽与网格</h2>
<p><span draggable="true" style="display:inline-block; padding:0.4em 0.8em; border:1px dashed currentcolor;">可拖拽的块（<code>grab</code>，按下时 <code>grabbing</code>）</span></p>
<div role="grid" style="padding:0.6em; border:1px dashed currentcolor;">
<div role="row"><span role="gridcell">网格单元触发 cell</span></div>
</div>
<h2>画布</h2>
<p><canvas width="240" height="60" style="border:1px dashed currentcolor;"></canvas>（<code>crosshair</code>）</p>
<h2>点击特效</h2>
<p>在本页任意位置左键单击会落下一个圆，右键单击落下一个圆角方——形状区分按键，
颜色分别取当前配色的 <code>--color-primary</code> 与 <code>--color-accent</code>。
开启系统的「减少动态效果」后整个特效不出现。</p>
`;

/** 样张四：把目录撑起来，看滚动高亮与目录自身的跟随滚动 */
const longform = [
  ["为什么要有样张", "样张的价值在于可重复。临时往 DOM 里注入几段文字能看一眼，但下次改动之后没法拿同一份东西再看一遍，前后对比就无从谈起。"],
  ["灰阶必须是暖的", "把 #FAF9F5 和常规的 #FAFAFA 并排放，差异一眼可见：前者偏黄，后者偏冷。整条灰阶每一档都带着同样的暖偏移，换成中性灰比用错任何单一颜色都更破坏辨识度。"],
  ["语义层比色板更重要", "真正决定观感的不是色板本身，而是色板如何映射到语义。主按钮用的是近黑而不是签名橙，这个区分搞反，整体气质就从克制滑向促销。"],
  ["衬线只给展示级", "衬线与无衬线的对比本身就是识别点。正文一旦也上衬线，这个对比就没有了。"],
  ["层级来自字号与字重", "不来自线框与阴影，所以主题里几乎没有 box-shadow。少一层视觉噪音，多一分排版本身的可信度。"],
  ["一条缓动走天下", "cubic-bezier(.4, 0, .2, 1) 在官网出现十五次，压倒性主导，主题就只用这一条。"],
  ["时长同理", "全站每一处过渡都取同一个令牌，于是「减少动态效果」只要改这一个值，不必逐个去写分支。"],
  ["断线与实线", "链接的状态差落在形状上：静止是断线，悬停时实线自左向右把它补齐，方向即阅读方向。"],
  ["低对比配色下的反馈", "灰色档里静止色与强调色的明度差只有二十上下，clay 档是三十以上还外加色相跳变。纯靠颜色，灰档几乎给不出反馈。"],
  ["色觉障碍下同理", "任何只靠色相区分的状态，在红绿色觉障碍下都会退化成没有区分。形状不会。"],
  ["光标是签名", "轮廓不跟着预设变，只有它身上的那点强调色跟着变。六个预设共用同一支箭头。"],
  ["触屏没有这一层", "手机上既没有指针也没有悬停，静止态的标记因此必须自己站得住，不能把全部信息都押在悬停上。"],
]
  .map(([h, p]) => `<h2>${h}</h2>\n<p>${p}</p>`)
  .join("\n");

/** 样张五：踩到自托管衬线的稀有切片，看有没有静默回落成系统字体 */
const cjk = `
<p>这一页用来检查自托管的 Clay Serif SC 分片。常用字走那一份 410 KB 的公共切片，
下面这些字落在稀有切片里。如果它们和这段话的字形明显不同，说明分片没被取到。</p>
<h2>常用字对照</h2>
<p>设计系统的复刻要点在于先把灰阶做对，再谈色相与语义映射。</p>
<h2>稀有字</h2>
<p>㐀㐁㐂㐃㐄　䶴䶵䶶䶷　龥龦龧　鿕鿖鿗</p>
<p>饕餮　魑魅魍魉　貔貅　麒麟　鸑鷟　觱篥　齉齾　龘</p>
<h2>标点与全角</h2>
<p>「引号」『书名』〈单书名〉《双书名》——破折号、……省略号、·间隔号。</p>
<p>全角标点：，。；：？！（）【】</p>
<h2>不应触发中文切片的内容</h2>
<p>한글 텍스트（韩文。应当回落到系统字体，而不是把中文稀有切片整个拉下来）</p>
<p>Latin text and 日本語のテキスト mixed together.</p>
`;

export const POSTS = [
  {
    categories: ["design"],
    content: typography,
    excerpt: "标题、列表、表格、引用、代码块、缩写、上下标——主题会碰到的每一种元素各来一次。",
    slug: "fixture-typography",
    tags: ["typography"],
    title: "样张一：排版元素清单",
  },
  {
    categories: ["design"],
    content: links,
    excerpt: "一段里堆五六个链接是什么样？静止态断线的墨量只能靠真实密度来判断。",
    slug: "fixture-links",
    tags: ["typography"],
    title: "样张二：链接密集的正文",
  },
  {
    categories: ["engineering"],
    content: cursors,
    excerpt: "把已接线的光标触发元素凑在一页，逐个划过去看。触屏上无效属预期。",
    slug: "fixture-cursors",
    tags: ["halo"],
    title: "样张三：光标与点击特效",
  },
  {
    categories: ["engineering"],
    content: longform,
    excerpt: "十二个二级标题，用来撑起目录、检查滚动高亮与目录自身的跟随滚动。",
    slug: "fixture-longform",
    tags: ["anthropic", "typography"],
    title: "样张四：长文与目录",
  },
  {
    categories: ["design"],
    content: cjk,
    excerpt: "常用字与稀有字并排，检查自托管衬线的分片有没有被正确取到。",
    slug: "fixture-cjk",
    tags: ["typography"],
    title: "样张五：中日韩字形与分片",
  },
];
