/*
  生成 Clay 内置光标组。

  为什么是生成的而不是手写的 CSS：
  一套光标要出四份——浅色 / 深色 各一套，每套再出 1x / 2x 两种像素密度（见下方 RETINA 说明）。
  同一个箭头写四遍，改一次颜色就得改四处，迟早对不上。这里把「形状」和「配色」拆开，
  形状只写一次，配色套两份，密度由 SVG 根节点的 width/height 决定，四份由脚本铺开。

  产物是 CSS 自定义属性表，不含任何选择器：
  哪些元素用哪种光标由 _runtime/global/cursors/selectors.css 决定，那份是三种光标模式共用的。
  「自定义上传」模式只需要覆写同名变量，不必再抄一遍选择器列表。

  交互色跟随配色预设，取自 theme-tokens.ts 的同一张表（即各预设的 --color-primary），
  不再抄一份 clay 字面值——此前蓝、灰预设下页面变了色而指针还是橙的，就是抄那一份的代价。
  但**只有交互色跟随**：轮廓与主体填充仍按明暗两档取 theme-light / theme-dark 的
  base-100 / base-content。六个预设的 base-100 只有两个取值，base-content 之间也只差灰阶一档，
  24px 上分辨不出，为此把整套形状再铺四遍不值当（产物会从 58 KB 涨到 175 KB）。
  于是产物分两层：明暗两档铺全部形状，各预设只覆写用到交互色的那几个——
  哪几个由 usesInteractiveColor() 探测，不是手写清单，改形状时不会漏。
  设计上这也更说得通：指针的轮廓是主题的签名，跟着预设变的是它身上的那点强调色。

  描边一律用 paint-order='stroke'：同一条路径先描边后填充，描边只露出填充之外的一半，
  于是一条 path 就同时得到实心主体和 1.5px 轮廓。轮廓色永远是填充色的反色，
  这样光标压在代码块、图片、任何异色区域上都还剩一圈能看清的边。
*/
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { COLOR_PRESETS, DARK_TOKENS, LIGHT_TOKENS, presetSelector, type ThemeTokens } from "./theme-tokens.ts";

export interface CursorPalette {
  /** 交互色，取所在预设 --color-primary 的字面值 */
  clay: string;
  /** 主体填充 */
  fill: string;
  /** 失效态 */
  muted: string;
  /** 轮廓，恒为 fill 的反色 */
  outline: string;
}

export interface CursorShape {
  /** 变量解析不到时回落的系统关键字 */
  fallback: string;
  height: number;
  /** 热点，单位与 viewBox 一致 */
  hotspot: [number, number];
  /** CSS 变量后缀，与 cursor 关键字同名 */
  name: string;
  render: (palette: CursorPalette) => string;
  width: number;
}

function paletteOf(tokens: ThemeTokens): CursorPalette {
  return {
    clay: tokens["--color-primary"],
    fill: tokens["--color-base-content"],
    /* 失效态与等待态的轨道色。不跟随预设：它要表达的是「这里没有交互」，
       正好是交互色的反面，跟着交互色走会把两种语义搅在一起。 */
    muted: "#8a867d",
    outline: tokens["--color-base-100"],
  };
}

const LIGHT = paletteOf(LIGHT_TOKENS);
const DARK = paletteOf(DARK_TOKENS);

/* 描边总宽 3，paint-order 之后露出 1.5 */
const OUTLINE_WIDTH = 3;
/* 纯描边图形（十字、圆环这类没有填充主体的）另配一层同形状的底描边当轮廓 */
const HALO_EXTRA = 2.4;

/*
  箭头。左缘垂直，右缘自笔尖起 42°，两缘等长 16.5；尾巴是挂在头部下缘上的一个平行四边形，
  长 8.4、宽 3，头尾比 2:1。笔尖落在 (2,2)，正好给 1.5px 轮廓留出余量，热点即 (2,2)。
*/
const ARROW = "M2 2L2 18.5L5.6 17.1L8.4 25L11.2 24L8.5 16L13 14.3Z";

function solid(d: string, fill: string, palette: CursorPalette): string {
  return (
    `<path d='${d}' fill='${fill}' stroke='${palette.outline}' stroke-width='${OUTLINE_WIDTH}'` +
    ` stroke-linejoin='round' stroke-linecap='round' paint-order='stroke'/>`
  );
}

function stroked(d: string, color: string, width: number, palette: CursorPalette): string {
  return (
    `<path d='${d}' fill='none' stroke='${palette.outline}' stroke-width='${width + HALO_EXTRA}'` +
    ` stroke-linecap='round' stroke-linejoin='round'/>` +
    `<path d='${d}' fill='none' stroke='${color}' stroke-width='${width}'` +
    ` stroke-linecap='round' stroke-linejoin='round'/>`
  );
}

function roundedRect(x: number, y: number, size: number, radius: number): string {
  return `<rect x='${x}' y='${y}' width='${size}' height='${size}' rx='${radius}'`;
}

export const CURSOR_SHAPES: CursorShape[] = [
  {
    fallback: "default",
    height: 27,
    hotspot: [2, 2],
    name: "default",
    render: (p) => solid(ARROW, p.fill, p),
    width: 15,
  },
  {
    /* 链接光标不画手：手在 24px 上永远糊成一团。改成同一支箭头换成交互色，
       再在右侧点一颗同色圆点——颜色之外还有一处形状差异，色觉障碍下同样能分辨。 */
    fallback: "pointer",
    height: 27,
    hotspot: [2, 2],
    name: "pointer",
    render: (p) =>
      solid(ARROW, p.clay, p) +
      `<circle cx='11.6' cy='6.4' r='2.1' fill='${p.clay}' stroke='${p.outline}'` +
      ` stroke-width='${OUTLINE_WIDTH}' paint-order='stroke'/>`,
    width: 16,
  },
  {
    /* 衬线 I 型光标。衬线与竖干之间用一段短圆角过渡而不是直角，
       和 --clay-font-serif 的字面呼应，也是整套主题唯一的识别特征。 */
    fallback: "text",
    height: 24,
    hotspot: [7, 12],
    name: "text",
    render: (p) =>
      solid(
        "M2.8 3.2L11.2 3.2L11.2 4.4L9.2 4.4Q7.9 4.4 7.9 5.7L7.9 18.3Q7.9 19.6 9.2 19.6L11.2 19.6" +
          "L11.2 20.8L2.8 20.8L2.8 19.6L4.8 19.6Q6.1 19.6 6.1 18.3L6.1 5.7Q6.1 4.4 4.8 4.4L2.8 4.4Z",
        p.fill,
        p,
      ),
    width: 14,
  },
  {
    fallback: "vertical-text",
    height: 14,
    hotspot: [12, 7],
    name: "vertical-text",
    render: (p) =>
      `<g transform='translate(5 -5) rotate(-90 7 12)'>` +
      solid(
        "M2.8 3.2L11.2 3.2L11.2 4.4L9.2 4.4Q7.9 4.4 7.9 5.7L7.9 18.3Q7.9 19.6 9.2 19.6L11.2 19.6" +
          "L11.2 20.8L2.8 20.8L2.8 19.6L4.8 19.6Q6.1 19.6 6.1 18.3L6.1 5.7Q6.1 4.4 4.8 4.4L2.8 4.4Z",
        p.fill,
        p,
      ) +
      `</g>`,
    width: 24,
  },
  {
    fallback: "help",
    height: 27,
    hotspot: [2, 2],
    name: "help",
    render: (p) =>
      solid(ARROW, p.fill, p) +
      `<circle cx='18.5' cy='7.4' r='5.2' fill='${p.clay}' stroke='${p.outline}'` +
      ` stroke-width='${OUTLINE_WIDTH}' paint-order='stroke'/>` +
      `<path d='M16.5 5.6A2.05 2.05 0 0 1 20.4 6.4C20.4 7.7 18.6 7.9 18.6 9.15' fill='none'` +
      ` stroke='${p.outline}' stroke-width='1.5' stroke-linecap='round'/>` +
      `<circle cx='18.6' cy='10.8' r='0.85' fill='${p.outline}'/>`,
    width: 26,
  },
  {
    /* 进度弧不是直接压在轨道上，而是先垫一层轮廓色的同形状描边：
       弧与轨道之间因此永远隔着一条发丝线，两者的分辨不依赖亮度差。
       灰色预设里交互色本身就在灰阶上，少了这条线就只剩一个几乎均匀的圆环。 */
    fallback: "wait",
    height: 24,
    hotspot: [12, 12],
    name: "wait",
    render: (p) =>
      `<circle cx='12' cy='12' r='7.5' fill='none' stroke='${p.outline}' stroke-width='${2.6 + HALO_EXTRA}'/>` +
      `<circle cx='12' cy='12' r='7.5' fill='none' stroke='${p.muted}' stroke-width='2.6'/>` +
      stroked("M12 4.5A7.5 7.5 0 0 1 19.5 12", p.clay, 2.6, p),
    width: 24,
  },
  {
    fallback: "cell",
    height: 24,
    hotspot: [12, 12],
    name: "cell",
    render: (p) =>
      stroked("M12 1.8L12 7.2M12 16.8L12 22.2M1.8 12L7.2 12M16.8 12L22.2 12", p.fill, 1.7, p) +
      `${roundedRect(7.2, 7.2, 9.6, 2.6)} fill='none' stroke='${p.outline}' stroke-width='${1.7 + HALO_EXTRA}'/>` +
      `${roundedRect(7.2, 7.2, 9.6, 2.6)} fill='none' stroke='${p.fill}' stroke-width='1.7'/>`,
    width: 24,
  },
  {
    fallback: "crosshair",
    height: 24,
    hotspot: [12, 12],
    name: "crosshair",
    render: (p) =>
      stroked("M12 1.8L12 9M12 15L12 22.2M1.8 12L9 12M15 12L22.2 12", p.fill, 1.7, p) +
      `<circle cx='12' cy='12' r='1' fill='${p.clay}' stroke='${p.outline}' stroke-width='2' paint-order='stroke'/>`,
    width: 24,
  },
  {
    fallback: "move",
    height: 24,
    hotspot: [12, 12],
    name: "move",
    render: (p) =>
      solid(
        "M12 1.8L15.6 6L13.4 6L13.4 10.6L18 10.6L18 8.4L22.2 12L18 15.6L18 13.4L13.4 13.4L13.4 18L15.6 18" +
          "L12 22.2L8.4 18L10.6 18L10.6 13.4L6 13.4L6 15.6L1.8 12L6 8.4L6 10.6L10.6 10.6L10.6 6L8.4 6Z",
        p.fill,
        p,
      ),
    width: 24,
  },
  {
    fallback: "not-allowed",
    height: 24,
    hotspot: [12, 12],
    name: "not-allowed",
    render: (p) =>
      `<circle cx='12' cy='12' r='8.2' fill='none' stroke='${p.outline}' stroke-width='${2.4 + HALO_EXTRA}'/>` +
      stroked("M6.2 17.8L17.8 6.2", p.muted, 2.4, p) +
      `<circle cx='12' cy='12' r='8.2' fill='none' stroke='${p.muted}' stroke-width='2.4'/>`,
    width: 24,
  },
  {
    /* grab / grabbing 也不画手：空心圆角方 → 实心圆角方，
       「松开」到「攥住」的状态差比手掌的开合在 24px 上清楚得多。 */
    fallback: "grab",
    height: 24,
    hotspot: [12, 12],
    name: "grab",
    render: (p) =>
      `${roundedRect(5.8, 5.8, 12.4, 3.8)} fill='none' stroke='${p.outline}' stroke-width='${2 + HALO_EXTRA}'/>` +
      `${roundedRect(5.8, 5.8, 12.4, 3.8)} fill='none' stroke='${p.fill}' stroke-width='2'/>`,
    width: 24,
  },
  {
    fallback: "grabbing",
    height: 24,
    hotspot: [12, 12],
    name: "grabbing",
    render: (p) =>
      `${roundedRect(7.4, 7.4, 9.2, 2.9)} fill='${p.clay}' stroke='${p.outline}'` +
      ` stroke-width='${OUTLINE_WIDTH}' stroke-linejoin='round' paint-order='stroke'/>`,
    width: 24,
  },
  {
    fallback: "ew-resize",
    height: 24,
    hotspot: [12, 12],
    name: "ew-resize",
    render: (p) =>
      solid(
        "M1.8 12L6.4 8.2L6.4 10.6L17.6 10.6L17.6 8.2L22.2 12L17.6 15.8L17.6 13.4L6.4 13.4L6.4 15.8Z",
        p.fill,
        p,
      ),
    width: 24,
  },
];

/*
  哪些形状身上带交互色，靠探测而不是靠手写清单：用四个不可能出现在颜色值里的哨兵
  跑一遍 render，看产物里有没有 clay 那一个。新增形状、或者给旧形状加一笔交互色，
  预设覆写层会自动跟上，不会出现「改了形状但只有默认预设变了」这种半截生效。
*/
export function usesInteractiveColor(shape: CursorShape): boolean {
  return shape
    .render({ clay: "__CLAY__", fill: "__FILL__", muted: "__MUTED__", outline: "__OUTLINE__" })
    .includes("__CLAY__");
}

const INTERACTIVE_SHAPES = CURSOR_SHAPES.filter((shape) => usesInteractiveColor(shape));

/*
  data: URI 里只需要转义会提前终止 url("...") 或被 CSS 当成注释/结构记号的字符。
  形状里统一用单引号写属性，于是双引号根本不会出现。% 必须最先换，否则会把后面
  刚插进去的 %23 再编码一次。
*/
function encodeSvg(markup: string): string {
  return markup
    .replaceAll(/\s+/g, " ")
    .trim()
    .replaceAll("%", "%25")
    .replaceAll("#", "%23")
    .replaceAll("<", "%3C")
    .replaceAll(">", "%3E");
}

export function renderCursorSvg(shape: CursorShape, palette: CursorPalette, scale: number): string {
  return (
    `<svg xmlns='http://www.w3.org/2000/svg' width='${shape.width * scale}' height='${shape.height * scale}'` +
    ` viewBox='0 0 ${shape.width} ${shape.height}'>${shape.render(palette)}</svg>`
  );
}

function dataUri(shape: CursorShape, palette: CursorPalette, scale: number): string {
  return `data:image/svg+xml,${encodeSvg(renderCursorSvg(shape, palette, scale))}`;
}

/*
  RETINA：Safari 把 SVG 光标按 1x 栅格化后再放大，在 2x 屏上是糊的（Chrome / Firefox 不会）。
  解法是给同一张图再声明一份 width/height 翻倍的版本走 image-set。
  image-set 不能靠「同名声明写两遍」降级——自定义属性的值不做语法校验，后一条永远覆盖前一条，
  浏览器不认识时整条 cursor 会变成 invalid at computed-value time 并回落到继承值。
  所以这一层必须整个包在 @supports 里，探测不过就停在上面的 1x 声明。
*/
const RETINA_SUPPORTS = `(cursor: -webkit-image-set(url("data:image/svg+xml,%3Csvg/%3E") 1x) 0 0, default)`;

function cursorValue(shape: CursorShape, palette: CursorPalette, retina: boolean): string {
  const [hotspotX, hotspotY] = shape.hotspot;
  const base = `url("${dataUri(shape, palette, 1)}")`;

  if (!retina) {
    return `${base} ${hotspotX} ${hotspotY}, ${shape.fallback}`;
  }

  return (
    `-webkit-image-set(${base} 1x, url("${dataUri(shape, palette, 2)}") 2x)` +
    ` ${hotspotX} ${hotspotY}, ${shape.fallback}`
  );
}

function block(
  selectors: string[],
  shapes: CursorShape[],
  palette: CursorPalette,
  retina: boolean,
  indent: string,
): string {
  const declarations = shapes
    .map((shape) => `${indent}  --clay-cursor-${shape.name}: ${cursorValue(shape, palette, retina)};`)
    .join("\n");

  return `${indent}${selectors.join(",\n" + indent)} {\n${declarations}\n${indent}}\n`;
}

/*
  预设覆写层。按「明暗档 + 交互色」归并选择器：同族的 light-blue 与 auto-blue 共用一条规则，
  auto-blue 的深色档另外进 @media。与默认预设同交互色的（light / dark / auto）不出现在这里，
  它们已经由下面的基础层覆盖。
*/
interface OverrideRule {
  clay: string;
  half: "dark" | "light";
  selectors: string[];
}

function collectOverrides(): { media: OverrideRule[]; unconditional: OverrideRule[] } {
  const unconditional = new Map<string, OverrideRule>();
  const media = new Map<string, OverrideRule>();

  const push = (bucket: Map<string, OverrideRule>, half: "dark" | "light", clay: string, selector: string) => {
    if (clay === (half === "dark" ? DARK : LIGHT).clay) {
      return;
    }
    const key = `${half}|${clay}`;
    const existing = bucket.get(key);
    if (existing) {
      existing.selectors.push(selector);
    } else {
      bucket.set(key, { clay, half, selectors: [selector] });
    }
  };

  for (const preset of COLOR_PRESETS) {
    const selector = presetSelector(preset.value);

    if (preset.darkTokens) {
      push(unconditional, "light", preset.tokens["--color-primary"], selector);
      push(media, "dark", preset.darkTokens["--color-primary"], selector);
      continue;
    }

    push(unconditional, preset.scheme === "dark" ? "dark" : "light", preset.tokens["--color-primary"], selector);
  }

  return { media: [...media.values()], unconditional: [...unconditional.values()] };
}

function overrideBlock(rule: OverrideRule, retina: boolean, indent: string): string {
  const palette = { ...(rule.half === "dark" ? DARK : LIGHT), clay: rule.clay };
  return block(rule.selectors, INTERACTIVE_SHAPES, palette, retina, indent);
}

/*
  基础层挂在 [data-color-scheme]（<html> 上恒有，自定义配色方案也会写这个属性），
  而不是挂在 [theme]：后者有九个预设值再加任意多个自定义 id，逐个列举既冗长又会漏。
  覆写层才按 [theme] 精确点名，两者特异性相同（都是 html + 一个属性），靠源码顺序分先后，
  所以覆写层必须排在基础层之后——@media 内外各自成序，故两层都要各带一份 @media 块。
*/
function layer(retina: boolean, indent: string): string {
  const { media, unconditional } = collectOverrides();
  const nested = `${indent}  `;

  return (
    block([":root"], CURSOR_SHAPES, LIGHT, retina, indent) +
    "\n" +
    block(['html[data-color-scheme="dark"]'], CURSOR_SHAPES, DARK, retina, indent) +
    "\n" +
    unconditional.map((rule) => overrideBlock(rule, retina, indent) + "\n").join("") +
    `${indent}@media (prefers-color-scheme: dark) {\n` +
    block(['html[data-color-scheme="auto"]'], CURSOR_SHAPES, DARK, retina, nested) +
    media.map((rule) => "\n" + overrideBlock(rule, retina, nested)).join("") +
    `${indent}}\n`
  );
}

export function buildCursorCss(): string {
  return (
    "/* 由 src/scripts/generate-cursor-css.ts 生成，请勿直接编辑。 */\n" +
    layer(false, "") +
    "\n" +
    `@supports ${RETINA_SUPPORTS} {\n` +
    layer(true, "  ") +
    "}\n"
  );
}

const generatedDir = resolve(import.meta.dirname, "../generated");

mkdirSync(generatedDir, { recursive: true });
writeFileSync(resolve(generatedDir, "clay-cursors.css"), buildCursorCss(), "utf8");
