/**
 * 主题配置回归。
 *
 * 逐项把每个可离散取值的配置设成非默认值，然后拉取一组代表性页面，检查三件事：
 *   1. HTTP 状态与传输完整性
 *   2. 页面上没有漏出渲染异常的痕迹
 *   3. 正文区不是空的
 *
 * 第 3 条是有来由的：Halo 是流式渲染，模板抛异常时响应头和前 8KB 正文已经发出去了，
 * 客户端拿到的是 HTTP 200 + 截断正文；而 Thymeleaf 的 th:each 遍历 null 集合是静默
 * no-op，页面会渲染成只有页眉页脚的空壳。两种都不会体现在状态码上。
 *
 * 用法（需要 Halo 在跑，且主题已激活）：
 *   python scripts/regression/enumerate-settings.py > /tmp/settings-enum.json
 *   node scripts/regression/run.mjs /tmp/settings-enum.json
 */

import { readFile } from "node:fs/promises";

import { BASE, csrfToken, login, req } from "./halo-client.mjs";

const CM = "halo-theme-clay-configmap";

const PAGES = [
  ["/", "index"],
  ["/archives/warm-grays", "post"],
  ["/archives", "archives"],
  ["/categories", "categories"],
  ["/tags", "tags"],
  ["/authors/admin", "author"],
  ["/links", "links"],
  ["/photos", "photos"],
  ["/moments", "moments"],
  ["/friends", "friends"],
];

/**
 * 内容坍塌的判定阈值：跌到基线的这个比例以下就报警。
 * 用相对基线而非绝对字符数，是因为各页面模板结构不一（有的有 <article>，有的没有），
 * 按 DOM 结构定位「正文区」并不可靠。
 */
const COLLAPSE_RATIO = 0.5;
/** 每页基线可见文本长度，开跑前采集 */
const baselineText = new Map();

/** 渲染失败时会漏到页面上的痕迹 */
const ERROR_MARKERS = [
  "SpelEvaluationException",
  "TemplateProcessingException",
  "TemplateInputException",
  "org.thymeleaf",
  "Whitelabel Error",
  "EL1",
];

/** 取 <body> 内、剥掉 script/style/标签后的可见文本长度 */
function visibleTextLength(html) {
  const body = html.slice(html.indexOf("<body"));
  return body
    .replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z#0-9]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim().length;
}

async function checkPages() {
  const hard = [];
  const soft = [];
  for (const [path, label] of PAGES) {
    let res, body;
    try {
      res = await fetch(BASE + path, { redirect: "manual" });
      body = await res.text();
    } catch (e) {
      // fetch 抛错通常意味着连接被中途切断，即渲染异常导致的截断
      hard.push(`${label}: 传输中断（${e.message}）—— 多半是模板抛异常导致响应截断`);
      continue;
    }
    if (res.status !== 200) {
      hard.push(`${label}: HTTP ${res.status}`);
      continue;
    }
    const marker = ERROR_MARKERS.find((m) => body.includes(m));
    if (marker) {
      hard.push(`${label}: 页面漏出渲染异常痕迹 "${marker}"`);
      continue;
    }
    const len = visibleTextLength(body);
    const base = baselineText.get(label);
    if (base !== undefined && len < Math.max(30, base * COLLAPSE_RATIO)) {
      soft.push(`${label}: 内容明显减少（可见文本 ${len} 字符，基线 ${base}）`);
    }
  }
  return { hard, soft };
}

async function readConfig() {
  return await (await req(`/api/v1alpha1/configmaps/${CM}`)).json();
}

async function writeGroup(cm, group, kv) {
  const cur = JSON.parse(cm.data?.[group] ?? "{}");
  const backup = { ...cur };
  Object.assign(cur, kv);
  cm.data[group] = JSON.stringify(cur);
  const r = await req(`/api/v1alpha1/configmaps/${CM}`, {
    method: "PUT",
    headers: { "X-XSRF-TOKEN": csrfToken(), "content-type": "application/json" },
    body: JSON.stringify(cm),
  });
  return { status: r.status, backup };
}

async function restore(group, backup) {
  const cm = await readConfig();
  cm.data[group] = JSON.stringify(backup);
  await req(`/api/v1alpha1/configmaps/${CM}`, {
    method: "PUT",
    headers: { "X-XSRF-TOKEN": csrfToken(), "content-type": "application/json" },
    body: JSON.stringify(cm),
  });
}

const enumPath = process.argv[2];
if (!enumPath) {
  console.error("用法: node scripts/regression/run.mjs <settings-enum.json>");
  process.exit(2);
}

await login();

const settings = JSON.parse(await readFile(enumPath, "utf8"));
const cases = [];
for (const s of settings) {
  for (const v of s.values) {
    if (JSON.stringify(v) === JSON.stringify(s.default)) continue;
    cases.push({ group: s.group, name: s.name, value: v });
  }
}
console.log(`${cases.length} 个非默认取值 × ${PAGES.length} 个页面 = ${cases.length * PAGES.length} 次渲染\n`);

// 先采集每页基线文本长度，后续以此判定内容坍塌
for (const [path, label] of PAGES) {
  try {
    baselineText.set(label, visibleTextLength(await (await fetch(BASE + path)).text()));
  } catch {
    /* 基线取不到时该页跳过坍塌判定 */
  }
}
console.log("基线文本长度：" + [...baselineText].map(([k, v]) => `${k}=${v}`).join("  ") + "\n");

const baseline = await checkPages();
if (baseline.hard.length) {
  console.log("基线本身不干净，先修基线：");
  for (const b of baseline.hard) console.log("   ", b);
  process.exit(1);
}
console.log("基线干净\n");

const failures = [];
const warnings = [];
let done = 0;
for (const c of cases) {
  const { status, backup } = await writeGroup(await readConfig(), c.group, { [c.name]: c.value });
  if (status >= 300) {
    failures.push({ ...c, why: `配置写入失败 HTTP ${status}` });
  } else {
    const { hard, soft } = await checkPages();
    if (hard.length) failures.push({ ...c, why: hard.join(" | ") });
    if (soft.length) warnings.push({ ...c, why: soft.join(" | ") });
  }
  await restore(c.group, backup);
  if (++done % 25 === 0) {
    console.log(`  ${done}/${cases.length}，失败 ${failures.length}，待看 ${warnings.length}`);
  }
}

console.log(`\n=== ${done} 个取值：${failures.length} 个失败，${warnings.length} 个待看 ===`);
for (const f of failures) {
  console.log(`  ✗ ${f.group}.${f.name} = ${JSON.stringify(f.value)}`);
  console.log(`      ${f.why}`);
}
if (!failures.length) console.log("  无硬性失败");

if (warnings.length) {
  console.log("\n待人工确认（内容量明显减少，也可能就是该配置的正常效果）：");
  for (const w of warnings) {
    console.log(`  ? ${w.group}.${w.name} = ${JSON.stringify(w.value)}`);
    console.log(`      ${w.why}`);
  }
}

// 只有硬性失败才判不通过。内容量变化是启发式信号：
// 例如 list_layout 切成简洁列表本就没有摘要，切成瞬间/朋友圈列表在缺插件时
// 显示的是「插件未启用」提示——都是正确行为，不该判为失败。
process.exit(failures.length ? 1 : 0);
