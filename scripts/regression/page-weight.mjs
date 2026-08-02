/**
 * 量一个页面实际加载的资源体积（传输大小），主题资源与插件资源分开统计。
 *
 * 字体按浏览器的真实行为折算，不是把 CSS 里引用到的全算上：
 * 每个 @font-face 的 unicode-range 与页面上真正出现的字符求交，没交集的分片不计入。
 * 中文衬线切成了 59 片、总计 2.8 MB，全算上会得到一个和现实差一个数量级的数。
 * 同族 @font-face 的 unicode-range 重叠时按**后声明者优先**判定，与浏览器一致。
 * 仍有一处保守：只看字符不看该字族有没有被元素引用，所以没有代码块的页面
 * 也会把等宽体算进来。方向是高估，不会掩盖体积回归。
 *
 * 用法: node scripts/regression/page-weight.mjs
 */

const BASE = "http://localhost:8090";

async function transferSize(url) {
  const r = await fetch(url, { headers: { "accept-encoding": "br, gzip" } });
  const buf = await r.arrayBuffer();
  const enc = r.headers.get("content-encoding") ?? "identity";
  const cl = r.headers.get("content-length");
  // content-length 若存在即为实际传输字节；否则用已解压长度（保守高估）
  return { bytes: cl ? Number(cl) : buf.byteLength, enc, status: r.status };
}

function parseRange(text) {
  const out = [];
  for (const part of text.split(",")) {
    const t = part.trim().replace(/^U\+/i, "");
    // lightningcss 会把 U+0000-00FF 压成通配形式 U+??，问号代表任意一位十六进制。
    // 不认这一种就会把整条 Latin 范围解析成 NaN，然后整份 Inter 都判为不需要下载。
    if (t.includes("?")) {
      out.push([Number.parseInt(t.replaceAll("?", "0"), 16), Number.parseInt(t.replaceAll("?", "F"), 16)]);
      continue;
    }
    const [a, b] = t.includes("-") ? t.split("-") : [t, t];
    out.push([Number.parseInt(a, 16), Number.parseInt(b, 16)]);
  }
  return out;
}

/** 抽出页面上会被渲染的字符集合。宁可多算——漏算会低估字体开销。 */
function pageCodepoints(html) {
  const text = html
    .replaceAll(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, " ")
    .replaceAll(/<[^>]+>/g, " ")
    .replaceAll(/&[#\w]+;/g, " ");
  return new Set([...text].map((c) => c.codePointAt(0)));
}

/** 按声明顺序收集 @font-face，返回 { url, family, ranges }。 */
function parseFaces(css, cssUrl) {
  const faces = [];
  for (const block of css.matchAll(/@font-face\s*\{([^}]*)\}/g)) {
    const body = block[1];
    const src = /url\(["']?([^"')]+\.woff2)["']?\)/.exec(body);
    if (!src) continue;
    const family = /font-family:\s*["']?([^;"']+)/.exec(body)?.[1].trim() ?? "";
    const range = /unicode-range:\s*([^;}]+)/.exec(body)?.[1];
    faces.push({
      url: new URL(src[1], BASE + cssUrl).pathname,
      family,
      ranges: range ? parseRange(range) : null,
    });
  }
  return faces;
}

/** 浏览器实际会请求的分片：逐字符找最后一个覆盖它的同族 face。 */
function neededFaces(faces, codepoints) {
  const needed = new Set();
  const byFamily = new Map();
  for (const f of faces) {
    if (!byFamily.has(f.family)) byFamily.set(f.family, []);
    byFamily.get(f.family).push(f);
  }
  for (const list of byFamily.values()) {
    for (const cp of codepoints) {
      let hit = null;
      for (const f of list) {
        if (!f.ranges || f.ranges.some(([a, b]) => cp >= a && cp <= b)) hit = f;
      }
      if (hit) needed.add(hit.url);
    }
  }
  return needed;
}

async function measure(pagePath) {
  const html = await (await fetch(BASE + pagePath)).text();
  const htmlSize = await transferSize(BASE + pagePath);

  const urls = new Set();
  for (const m of html.matchAll(/(?:href|src)="(\/(?:themes|plugins)\/[^"]+)"/g)) urls.add(m[1]);

  // @font-face 在 CSS 里，需要再抓一层；按 <link> 在文档里的顺序解析，
  // 声明顺序决定重叠时谁生效。
  const faces = [];
  for (const c of [...urls].filter((u) => u.endsWith(".css"))) {
    faces.push(...parseFaces(await (await fetch(BASE + c)).text(), c));
  }
  const fetched = neededFaces(faces, pageCodepoints(html));
  for (const u of fetched) urls.add(u);

  const groups = { theme: [], plugin: [] };
  for (const u of urls) {
    const { bytes, status } = await transferSize(BASE + u);
    if (status !== 200) continue;
    (u.startsWith("/themes/") ? groups.theme : groups.plugin).push({ u, bytes });
  }

  const sum = (a) => a.reduce((s, x) => s + x.bytes, 0);
  const kb = (n) => (n / 1024).toFixed(1);

  console.log(`\n===== ${pagePath} =====`);
  console.log(`  HTML(文档)          ${kb(htmlSize.bytes).padStart(7)} KB  [${htmlSize.enc}]`);
  console.log(`  主题资源 ${String(groups.theme.length).padStart(2)} 个     ${kb(sum(groups.theme)).padStart(7)} KB`);
  console.log(`  插件资源 ${String(groups.plugin.length).padStart(2)} 个     ${kb(sum(groups.plugin)).padStart(7)} KB`);
  console.log(`  ------------------------------------`);
  console.log(`  主题合计(含 HTML)   ${kb(htmlSize.bytes + sum(groups.theme)).padStart(7)} KB   <= 对标上游 ~70 KiB`);
  console.log(`  页面总计            ${kb(htmlSize.bytes + sum(groups.theme) + sum(groups.plugin)).padStart(7)} KB`);

  const fonts = groups.theme.filter((x) => x.u.endsWith(".woff2"));
  if (fonts.length) {
    const declared = new Set(faces.map((f) => f.url)).size;
    console.log(`  其中自托管字体 ${fonts.length}/${declared} 片 ${kb(sum(fonts)).padStart(7)} KB`);
    console.log(`  主题合计(除字体)    ${kb(htmlSize.bytes + sum(groups.theme) - sum(fonts)).padStart(7)} KB`);
  }
}

for (const p of ["/", "/archives/warm-grays", "/archives"]) await measure(p);
