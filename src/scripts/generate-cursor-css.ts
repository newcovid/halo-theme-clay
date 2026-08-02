/*
  生成 Clay 内置光标组。

  为什么是生成的而不是手写的 CSS：
  一套光标要出四份——浅色 / 深色 各一套，每套再出 1x / 2x 两种像素密度（见下方 RETINA 说明）。
  同一个箭头写四遍，改一次颜色就得改四处，迟早对不上。这里把「形状」和「配色」拆开，
  形状只写一次，配色套两份，密度由 SVG 根节点的 width/height 决定，四份由脚本铺开。

  产物是 CSS 自定义属性表，不含任何选择器：
  哪些元素用哪种光标由 _runtime/global/cursors/selectors.css 决定，那份是三种光标模式共用的。
  「自定义上传」模式只需要覆写同名变量，不必再抄一遍选择器列表。

  配色只分浅深两档，不跟随七个配色预设。光标是主题的签名，蓝色预设是同一套主题的变体，
  没有理由让指针也跟着变蓝；clay 取的是对应明暗档 --color-primary 的字面值。

  描边一律用 paint-order='stroke'：同一条路径先描边后填充，描边只露出填充之外的一半，
  于是一条 path 就同时得到实心主体和 1.5px 轮廓。轮廓色永远是填充色的反色，
  这样光标压在代码块、图片、任何异色区域上都还剩一圈能看清的边。
*/
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

export interface CursorPalette {
  /** 交互色，取所在明暗档 --color-primary 的字面值 */
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

const LIGHT: CursorPalette = { clay: "#c0502b", fill: "#141413", muted: "#8a867d", outline: "#faf9f5" };
const DARK: CursorPalette = { clay: "#d97757", fill: "#faf9f5", muted: "#8a867d", outline: "#141413" };

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
    fallback: "wait",
    height: 24,
    hotspot: [12, 12],
    name: "wait",
    render: (p) =>
      `<circle cx='12' cy='12' r='7.5' fill='none' stroke='${p.outline}' stroke-width='${2.6 + HALO_EXTRA}'/>` +
      `<circle cx='12' cy='12' r='7.5' fill='none' stroke='${p.muted}' stroke-width='2.6'/>` +
      `<path d='M12 4.5A7.5 7.5 0 0 1 19.5 12' fill='none' stroke='${p.clay}'` +
      ` stroke-width='2.6' stroke-linecap='round'/>`,
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

function block(selector: string, palette: CursorPalette, retina: boolean, indent: string): string {
  const declarations = CURSOR_SHAPES.map(
    (shape) => `${indent}  --clay-cursor-${shape.name}: ${cursorValue(shape, palette, retina)};`,
  ).join("\n");

  return `${indent}${selector} {\n${declarations}\n${indent}}\n`;
}

/*
  深色档挂在 [data-color-scheme]（<html> 上恒有，自定义配色方案也会写这个属性），
  而不是挂在 [theme]：后者有七个预设值再加任意多个自定义 id，逐个列举既冗长又会漏。
*/
function layer(retina: boolean, indent: string): string {
  return (
    block(":root", LIGHT, retina, indent) +
    "\n" +
    block('html[data-color-scheme="dark"]', DARK, retina, indent) +
    "\n" +
    `${indent}@media (prefers-color-scheme: dark) {\n` +
    block('html[data-color-scheme="auto"]', DARK, retina, `${indent}  `) +
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
