/**
 * 核对每个页面引用的每张样式表／脚本，其 integrity 是否与服务端实际返回的字节一致。
 *
 * 为什么需要它：带 integrity 的资源一旦校验失败，浏览器不是回退到「不校验」，
 * 而是**整张表不生效**——没有控制台报错、没有网络失败、link 元素一切正常。
 * 页面于是「掉样式」而所有常规排查手段都显示正常。
 *
 * 这里同时按明文与 brotli 两种编码取一遍：Halo 会依 Accept-Encoding 返回预压缩产物，
 * 若 .br 与源文件不同步，只有真实浏览器会中招，curl 默认请求看不出来。
 *
 *     node scripts/regression/verify-sri.mjs [baseUrl]
 */

import { createHash } from "node:crypto";
import { brotliDecompressSync, gunzipSync } from "node:zlib";

const BASE = process.argv[2] ?? "http://localhost:8090";

const PAGES = [
  "/",
  "/archives",
  "/categories",
  "/tags",
  "/links",
  "/moments",
  "/photos",
  "/friends",
  "/archives/warm-grays",
  "/nonexistent-page-404",
];

const sha384 = (buf) => "sha384-" + createHash("sha384").update(buf).digest("base64");

/** 从 HTML 里抽出所有带 integrity 的 link/script。 */
function extractSubresources(html) {
  const out = [];
  const tagRe = /<(link|script)\b([^>]*)>/gi;
  for (const [, tag, attrs] of html.matchAll(tagRe)) {
    const href = /\b(?:href|src)\s*=\s*"([^"]+)"/i.exec(attrs)?.[1];
    const integrity = /\bintegrity\s*=\s*"([^"]+)"/i.exec(attrs)?.[1];
    if (href && integrity) out.push({ tag, href, integrity });
  }
  return out;
}

async function fetchBody(url, encoding) {
  const res = await fetch(url, {
    headers: encoding ? { "accept-encoding": encoding } : { "accept-encoding": "identity" },
  });
  const raw = Buffer.from(await res.arrayBuffer());
  const ce = (res.headers.get("content-encoding") ?? "").toLowerCase();
  // undici 会按 content-encoding 自动解压，但响应头仍保留 br/gzip。
  // 所以这里必须「尝试解压，失败就当作已经是明文」，否则会二次解压报错。
  let body = raw;
  try {
    if (ce === "br") body = brotliDecompressSync(raw);
    else if (ce === "gzip") body = gunzipSync(raw);
  } catch {
    body = raw;
  }
  return { status: res.status, contentEncoding: ce || "identity", body };
}

let checked = 0;
const failures = [];

for (const path of PAGES) {
  const res = await fetch(BASE + path);
  const html = await res.text();
  const subs = extractSubresources(html);
  if (subs.length === 0) {
    console.log(`  ${path}  (无带 integrity 的子资源)`);
    continue;
  }

  const seen = new Set();
  for (const { tag, href, integrity } of subs) {
    const url = new URL(href, BASE).toString();
    if (seen.has(url + integrity)) continue;
    seen.add(url + integrity);

    // 明文与 brotli 两条路都要与声明的 integrity 一致
    for (const enc of [null, "br"]) {
      const { status, contentEncoding, body } = await fetchBody(url, enc);
      const actual = sha384(body);
      checked++;
      if (status !== 200 || actual !== integrity) {
        failures.push({
          page: path,
          tag,
          asset: href.split("/").pop(),
          contentEncoding,
          status,
          declared: integrity,
          actual,
        });
      }
    }
  }
  console.log(`  ${path}  ${subs.length} 个子资源`);
}

console.log(`\n=== 校验 ${checked} 次（每个资源按 identity 与 br 各取一遍）===`);
if (failures.length === 0) {
  console.log("  全部一致");
} else {
  console.log(`  ${failures.length} 处不一致：`);
  for (const f of failures) {
    console.log(`  ✗ ${f.page} → ${f.asset} [${f.contentEncoding}] status=${f.status}`);
    console.log(`      声明 ${f.declared}`);
    console.log(`      实际 ${f.actual}`);
  }
}
process.exit(failures.length === 0 ? 0 : 1);
