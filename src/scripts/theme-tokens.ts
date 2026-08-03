/*
  配色预设表。两个生成器共用：generate-theme-css.ts 把它铺成令牌表，
  generate-cursor-css.ts 从中取交互色，好让内置光标跟着预设走。

  在此之前这张表只存在于 generate-theme-css.ts 里，光标那边则把 clay 的两个字面值
  抄了一份——于是蓝、灰预设下页面变了色、指针还是橙的。两处各写一份「有哪些预设」
  正是漂移的来源，合并到这里之后，新增预设只需要动这一个数组。
*/
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

export type ThemeTokens = Record<string, string>;

/** data-color-scheme 的三档归类 */
export type ColorScheme = "auto" | "dark" | "light";

export interface ColorPreset {
  /** 深色档令牌，仅 auto 档有——静态档由 scheme 自己决定明暗 */
  darkTokens?: ThemeTokens;
  /** 静态档令牌；auto 档存其浅色档 */
  tokens: ThemeTokens;
  /** 设置项取值，同时是 <html theme="..."> 的属性值与产物文件名后缀 */
  value: string;
  scheme: ColorScheme;
}

// 配色源文件的固定形状：12 个令牌，字母序。列表本身就是字母序，
// 所以「逐项等于这个序列」一次性覆盖了齐全、无重复、无错名、顺序正确四件事。
//
// 之前这里什么都不查。漏掉一个令牌照样构建成功：html[theme="dark"] 少掉那个变量，
// 而合成出来的 auto 档深色 @media 块也跟着少，于是只有「自动 + 夜间」这一种组合下
// 颜色是错的——静默、且只在一半时间里出现。重复声明则会被 Object.fromEntries
// 静默地后者覆盖前者。都在这里拦住。
export const REQUIRED_TOKENS = [
  "--color-accent",
  "--color-accent-content",
  "--color-base-100",
  "--color-base-200",
  "--color-base-300",
  "--color-base-content",
  "--color-neutral",
  "--color-neutral-content",
  "--color-primary",
  "--color-primary-content",
  "--color-secondary",
  "--color-secondary-content",
] as const;

export const THEMES_DIR = resolve(import.meta.dirname, "../templates/_runtime/styles/themes");

export function parseThemeTokens(themePath: string): ThemeTokens {
  const themeContent = readFileSync(themePath, "utf8").replaceAll("\r\n", "\n").trim();
  const themeMatch = themeContent.match(/^:root\s*\{\n([\s\S]*?)\n\}$/);

  if (!themeMatch) {
    throw new Error(`Theme source must be a single :root block: ${themePath}`);
  }

  const themeDeclarations = themeMatch[1].split("\n").filter((line) => line.trim() !== "");

  const entries = themeDeclarations.map((line): [string, string] => {
    const declaration = line.trim().replace(/;$/, "");
    const separatorIndex = declaration.indexOf(":");

    if (separatorIndex === -1) {
      throw new Error(`Invalid CSS declaration in ${themePath}: ${line}`);
    }

    return [declaration.slice(0, separatorIndex).trim(), declaration.slice(separatorIndex + 1).trim()];
  });

  const names = entries.map(([name]) => name);

  if (names.length !== REQUIRED_TOKENS.length || names.some((name, index) => name !== REQUIRED_TOKENS[index])) {
    throw new Error(
      `Theme source must declare exactly these ${REQUIRED_TOKENS.length} tokens in this order: ${themePath}\n` +
        `  expected: ${REQUIRED_TOKENS.join(", ")}\n` +
        `  actual:   ${names.join(", ")}`,
    );
  }

  return Object.fromEntries(entries);
}

function load(name: string): ThemeTokens {
  return parseThemeTokens(resolve(THEMES_DIR, `theme-${name}.css`));
}

/*
  签名档。光标生成器把这两套的 base-100 / base-content 当作明暗两档的轮廓与填充——
  六个预设的 base-100 只有这两个取值，base-content 之间也只差灰阶一档。
*/
export const LIGHT_TOKENS = load("light");
export const DARK_TOKENS = load("dark");

const light = LIGHT_TOKENS;
const dark = DARK_TOKENS;
const lightBlue = load("light-blue");
const darkBlue = load("dark-blue");
const lightGray = load("light-gray");
const darkGray = load("dark-gray");

/*
  三个 auto 档是合成的，不是手写的：取同族的浅深一对，浅色档直接铺开，
  深色档进 @media (prefers-color-scheme: dark)。
*/
export const COLOR_PRESETS: ColorPreset[] = [
  { scheme: "light", tokens: light, value: "light" },
  { scheme: "dark", tokens: dark, value: "dark" },
  { darkTokens: dark, scheme: "auto", tokens: light, value: "auto" },
  { scheme: "light", tokens: lightBlue, value: "light-blue" },
  { scheme: "dark", tokens: darkBlue, value: "dark-blue" },
  { darkTokens: darkBlue, scheme: "auto", tokens: lightBlue, value: "auto-blue" },
  { scheme: "light", tokens: lightGray, value: "light-gray" },
  { scheme: "dark", tokens: darkGray, value: "dark-gray" },
  { darkTokens: darkGray, scheme: "auto", tokens: lightGray, value: "auto-gray" },
];

export function presetSelector(value: string): string {
  return `html[theme="${value}"]`;
}
