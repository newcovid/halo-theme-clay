/*
  生成一份**不依赖指针**的视觉评审页。

  动机：光标和悬停在手机、平板上根本不存在——触屏既没有指针可看，也没有 hover 可触发。
  而这两样恰好是最近改动最多的地方。所以把它们改写成不需要指针也能看的形式：
    · 悬停 → 自动循环播放，另有「重播」按钮
    · 光标 → 直接把 SVG 原图放大铺开，当静物看
    · 点击特效 → 触屏上本来就能触发，原样保留

  光标图形从 generate-cursor-css.ts 直接导入，不另抄一份，改了形状这页跟着变。

  用法：
    node --experimental-strip-types scripts/fixtures/build-review-page.mjs [输出路径]
*/
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

import { CURSOR_SHAPES, renderCursorSvg } from "../../src/scripts/generate-cursor-css.ts";
import { COLOR_PRESETS } from "../../src/scripts/theme-tokens.ts";

// 默认落在 dist/ 而不是仓库根：这是个评审产物，不该出现在 git status 里
const OUT = process.argv[2] ?? resolve(import.meta.dirname, "../../dist/clay-review.html");

/** 六个静态预设（auto 档没有自己的取值，跳过） */
const PRESETS = COLOR_PRESETS.filter((p) => p.scheme !== "auto");

const LABEL = {
  dark: "暗色",
  "dark-blue": "暗色 · 蓝",
  "dark-gray": "暗色 · 灰",
  light: "浅色",
  "light-blue": "浅色 · 蓝",
  "light-gray": "浅色 · 灰",
};

const token = (preset, name) => preset.tokens[name];

/** 一格链接样张 */
function specimen(preset, index) {
  const t = (n) => token(preset, n);
  return `
  <section class="panel" style="
    --color-base-100:${t("--color-base-100")};
    --color-base-content:${t("--color-base-content")};
    --color-primary:${t("--color-primary")};
    --color-accent:${t("--color-accent")};
  " data-index="${index}">
    <p class="name">${LABEL[preset.value]} <span class="slug">${preset.value}</span></p>
    <p class="spec">
      正文里的<a class="rule" href="#">这一条链接</a>静止时挂一条断线，
      轮到它时实线自左向右把断线补齐；<a class="rule" href="#">另一条</a>同理。
    </p>
    <p class="spec small">导航与标签静止不挂线：<a class="rule bare nav" href="#">文章</a> · <a class="rule bare" href="#">#排版</a></p>
  </section>`;
}

/*
  一个光标图形，直接内联 SVG（放大 3 倍当静物看）。
  卡片底色必须跟着该档的 base-100 走：这些图形的轮廓是填充色的反色，
  浅色档的箭头带白轮廓，画在深色卡片上会糊成一团，预览就不忠实了。
*/
function cursorCard(shape, preset, label) {
  const svg = renderCursorSvg(shape, paletteOf(preset), 3).replace(
    "<svg ",
    `<svg role="img" aria-label="${shape.name}" `,
  );
  const tone = preset.scheme === "dark" ? "on-dark" : "on-light";
  return `<figure class="cursor ${tone}"><div class="art">${svg}</div><figcaption>${shape.name}<span>${label}</span></figcaption></figure>`;
}

const light = PRESETS.find((p) => p.value === "light");
const dark = PRESETS.find((p) => p.value === "dark");
const paletteOf = (preset) => ({
  clay: token(preset, "--color-primary"),
  fill: token(preset, "--color-base-content"),
  muted: "#8a867d",
  outline: token(preset, "--color-base-100"),
});

/** 带交互色的那几个形状，按三个色系各出一版，用来看「光标跟着配色变」 */
const accentShapes = CURSOR_SHAPES.filter((s) =>
  s.render({ clay: "__C__", fill: "_f", muted: "_m", outline: "_o" }).includes("__C__"),
);

const html = `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
<title>Clay 视觉评审 · 无需指针</title>
<style>
  *, *::before, *::after { box-sizing: border-box; }
  :root {
    --ink: #141413; --paper: #f5f4ed; --card: #faf9f5; --muted: #5e5d59; --line: #e8e6dc;
    --ease: cubic-bezier(0.4, 0, 0.2, 1);
    --rule-dash: 6px; --rule-period: 9px; --rule-thin: 1px; --rule-thick: 2px; --rule-duration: 0.2s;
  }
  @media (prefers-color-scheme: dark) {
    :root { --ink: #f5f4ed; --paper: #141413; --card: #1f1e1d; --muted: #b0aea5; --line: #30302e; }
  }
  body {
    background: var(--paper); color: var(--ink); margin: 0;
    font: 400 16px/1.7 "Inter", -apple-system, "Segoe UI", system-ui, sans-serif;
    padding: max(24px, env(safe-area-inset-top)) 16px 64px;
  }
  .wrap { margin: 0 auto; max-width: 760px; }
  h1 { font: 400 clamp(26px, 6vw, 36px)/1.15 "Source Serif 4", "Songti SC", Georgia, serif; letter-spacing: -0.01em; margin: 0 0 10px; }
  h2 { font: 400 clamp(20px, 4.5vw, 26px)/1.2 "Source Serif 4", "Songti SC", Georgia, serif; letter-spacing: -0.01em; margin: 48px 0 6px; }
  .lede { color: var(--muted); margin: 0 0 6px; }
  .tip { color: var(--muted); font-size: 14px; margin: 0 0 20px; }
  button {
    background: var(--ink); border: 0; border-radius: 8px; color: var(--paper);
    font: 500 14px/1 inherit; padding: 11px 16px; margin-bottom: 20px;
  }

  /* ── 链接规则线：自动循环，无需悬停 ── */
  .grid { display: grid; gap: 12px; }
  /* 描一道极淡的边：暗色格的底色和这页在夜间模式下的底色是同一个值，
     不描边的话暗色那三格会整个融进背景，看不出是一张卡片。 */
  .panel {
    background: var(--color-base-100);
    border: 1px solid color-mix(in oklab, var(--color-base-content) 14%, transparent);
    border-radius: 12px; color: var(--color-base-content); padding: 18px 18px 20px;
  }
  .name { font: 500 11px/1 ui-monospace, "JetBrains Mono", monospace; letter-spacing: 0.08em; margin: 0 0 12px; opacity: 0.55; text-transform: uppercase; }
  .name .slug { opacity: 0.6; }
  .spec { margin: 0 0 8px; }
  .spec.small { font-size: 14px; opacity: 0.85; }
  .rule {
    background-image: linear-gradient(var(--color-accent) 0 0),
      repeating-linear-gradient(90deg, currentcolor 0 var(--rule-dash), transparent var(--rule-dash) var(--rule-period));
    background-position: 0 100%; background-repeat: no-repeat, repeat-x;
    background-size: 0 var(--rule-thick), 100% var(--rule-thin);
    color: inherit; text-decoration: none;
    transition: background-size var(--rule-duration) var(--ease);
  }
  .rule.bare { background-image: linear-gradient(var(--color-accent) 0 0); background-size: 0 var(--rule-thick); }
  .rule.nav { background-image: linear-gradient(var(--color-primary) 0 0); }
  .panel.play .rule { background-size: 100% var(--rule-thick), 100% var(--rule-thin); }
  .panel.play .rule.bare { background-size: 100% var(--rule-thick); }

  /* ── 光标静物 ── */
  .cursors { display: grid; gap: 10px; grid-template-columns: repeat(auto-fill, minmax(96px, 1fr)); }
  .cursor { background: var(--card); border-radius: 10px; margin: 0; padding: 12px 8px 10px; text-align: center; }
  .cursor.on-dark { background: #141413; }
  .cursor.on-light { background: #faf9f5; }
  .cursor .art { align-items: center; display: flex; height: 84px; justify-content: center; }
  .cursor figcaption { color: var(--muted); font: 500 10px/1.4 ui-monospace, monospace; margin-top: 6px; }
  .cursor figcaption span { display: block; opacity: 0.6; }

  /* ── 点击特效：触屏可触发 ── */
  #tapzone { background: var(--card); border: 1px dashed var(--line); border-radius: 12px; padding: 40px 16px; text-align: center; color: var(--muted); }
  #marks { height: 0; left: 0; pointer-events: none; position: fixed; top: 0; width: 0; z-index: 9; }
  #marks > i { border: 1.5px solid var(--ink); box-sizing: border-box; display: block; position: fixed; transform: translate(-50%, -50%); border-radius: 50%;
    animation: pop 420ms var(--ease) forwards; }
  @keyframes pop { 0% { height: 8px; width: 8px; opacity: 1 } 55% { opacity: .62 } 100% { height: 34px; width: 34px; opacity: 0 } }

  @media (prefers-reduced-motion: reduce) {
    :root { --rule-duration: 1ms; }
    #marks { display: none; }
  }
</style>
</head>
<body>
<div class="wrap">
  <h1>Clay 视觉评审</h1>
  <p class="lede">这一页不需要鼠标。悬停被改写成自动循环，光标被摊开成静物，点击特效在触屏上本来就能触发。</p>

  <h2>链接规则线</h2>
  <p class="tip">静止是一条断线，轮到时实线自左向右把它补齐。变化落在形状和方向上，颜色只是搭在上面——所以灰色档在明度差很小时仍然读得出来。六格依次播放。</p>
  <button id="replay" type="button">重播一轮</button>
  <div class="grid">${PRESETS.map(specimen).join("")}</div>

  <h2>内置光标</h2>
  <p class="tip">手机上没有指针，这里把 13 种形状按原始 SVG 放大三倍摊开。轮廓与填充只分明暗两档，跟着预设变的只有它们身上那点交互色。</p>
  <div class="cursors">
    ${CURSOR_SHAPES.map((s) => cursorCard(s, light, "浅色")).join("\n    ")}
  </div>
  <div class="cursors" style="margin-top:10px">
    ${CURSOR_SHAPES.map((s) => cursorCard(s, dark, "暗色")).join("\n    ")}
  </div>

  <h2>交互色跟随预设</h2>
  <p class="tip">只有这 ${accentShapes.length} 种形状身上带交互色，也只有它们随预设改变。同一支箭头，三种色系。</p>
  <div class="cursors">
    ${PRESETS.map((p) => accentShapes.map((s) => cursorCard(s, p, LABEL[p.value])).join("\n    ")).join("\n    ")}
  </div>

  <h2>点击特效</h2>
  <p class="tip">在下面这块区域点一下（触屏直接点即可）。站点上左键落圆、右键落圆角方，颜色分别取当前配色的 primary 与 accent。</p>
  <div id="tapzone">点这里</div>
</div>
<div id="marks" aria-hidden="true"></div>

<script>
  // 悬停改成轮播：一格一格地亮，看得清铺展方向
  const panels = [...document.querySelectorAll(".panel")];
  let timer;
  function runCycle() {
    clearTimeout(timer);
    panels.forEach((p) => p.classList.remove("play"));
    panels.forEach((p, i) => {
      setTimeout(() => p.classList.add("play"), 400 + i * 700);
      setTimeout(() => p.classList.remove("play"), 400 + i * 700 + 1600);
    });
    timer = setTimeout(runCycle, 400 + panels.length * 700 + 2400);
  }
  runCycle();
  document.getElementById("replay").addEventListener("click", runCycle);

  // 点击特效：只保留左键那一半，触屏上也能看
  const host = document.getElementById("marks");
  document.getElementById("tapzone").addEventListener("pointerdown", (e) => {
    const mark = document.createElement("i");
    mark.style.left = e.clientX + "px";
    mark.style.top = e.clientY + "px";
    mark.addEventListener("animationend", () => mark.remove(), { once: true });
    host.append(mark);
  });
</script>
</body>
</html>
`;

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, html, "utf8");
console.log(`已生成 ${OUT}`);
console.log(`  链接样张 ${PRESETS.length} 格 · 光标 ${CURSOR_SHAPES.length} 种 · 带交互色的 ${accentShapes.length} 种`);
