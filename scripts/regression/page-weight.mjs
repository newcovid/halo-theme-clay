/**
 * 量一个页面实际加载的资源体积（传输大小），主题资源与插件资源分开统计。
 *
 * 注意一个已知的高估：本脚本把 CSS 里 @font-face 引用到的字体全部计入，
 * 但浏览器按 unicode-range 只下载实际用到的那些——例如无代码块的页面
 * 不会加载等宽体。真实字体开销要以浏览器网络面板为准，通常比这里少一档。
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

async function measure(pagePath) {
  const html = await (await fetch(BASE + pagePath)).text();
  const htmlSize = await transferSize(BASE + pagePath);

  const urls = new Set();
  for (const m of html.matchAll(/(?:href|src)="(\/(?:themes|plugins)\/[^"]+)"/g)) urls.add(m[1]);
  // @font-face 引用的字体在 CSS 里，需要再抓一层
  const cssUrls = [...urls].filter((u) => u.endsWith(".css"));
  for (const c of cssUrls) {
    const css = await (await fetch(BASE + c)).text();
    for (const m of css.matchAll(/url\(["']?([^"')]+\.woff2)["']?\)/g)) {
      urls.add(new URL(m[1], BASE + c).pathname);
    }
  }

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
    console.log(`  其中自托管字体 ${fonts.length} 个  ${kb(sum(fonts)).padStart(7)} KB`);
    console.log(`  主题合计(除字体)    ${kb(htmlSize.bytes + sum(groups.theme) - sum(fonts)).padStart(7)} KB`);
  }
}

for (const p of ["/", "/archives/warm-grays", "/archives"]) await measure(p);
