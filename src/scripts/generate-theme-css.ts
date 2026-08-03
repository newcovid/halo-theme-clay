import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

type ThemeTokens = Record<string, string>;

// 配色源文件的固定形状：12 个令牌，字母序。列表本身就是字母序，
// 所以「逐项等于这个序列」一次性覆盖了齐全、无重复、无错名、顺序正确四件事。
//
// 之前这里什么都不查。漏掉一个令牌照样构建成功：html[theme="dark"] 少掉那个变量，
// 而合成出来的 auto 档深色 @media 块也跟着少，于是只有「自动 + 夜间」这一种组合下
// 颜色是错的——静默、且只在一半时间里出现。重复声明则会被 Object.fromEntries
// 静默地后者覆盖前者。都在这里拦住。
const REQUIRED_TOKENS = [
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

function parseThemeTokens(themePath: string): ThemeTokens {
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

function formatThemeDeclarations(themeTokens: ThemeTokens): string {
  return Object.entries(themeTokens)
    .map(([name, value]) => `  ${name}: ${value};`)
    .join("\n");
}

function wrapThemeCss(themeSelector: string, themeTokens: ThemeTokens): string {
  return `${themeSelector} {\n${formatThemeDeclarations(themeTokens)}\n}\n`;
}

function indentCssBlock(cssContent: string): string {
  return cssContent
    .split("\n")
    .filter((line) => line !== "")
    .map((line) => `  ${line}`)
    .join("\n");
}

function wrapAutoThemeCss(themeSelector: string, lightTokens: ThemeTokens, darkTokens: ThemeTokens): string {
  return `${wrapThemeCss(themeSelector, lightTokens)}\n@media (prefers-color-scheme: dark) {\n${indentCssBlock(
    wrapThemeCss(themeSelector, darkTokens).trimEnd(),
  )}\n}\n`;
}

const themesDir = resolve(import.meta.dirname, "../templates/_runtime/styles/themes");
const generatedDir = resolve(import.meta.dirname, "../generated");

const themeLight = parseThemeTokens(resolve(themesDir, "theme-light.css"));
const themeDark = parseThemeTokens(resolve(themesDir, "theme-dark.css"));
const themeLightBlue = parseThemeTokens(resolve(themesDir, "theme-light-blue.css"));
const themeDarkBlue = parseThemeTokens(resolve(themesDir, "theme-dark-blue.css"));
const themeGray = parseThemeTokens(resolve(themesDir, "theme-gray.css"));
const themeDarkGray = parseThemeTokens(resolve(themesDir, "theme-dark-gray.css"));
// 浅色灰的取值名是 `gray` 而不是 `light-gray`——上游就叫这个，改名会让已保存的配置失效。
// 深色与自动两档是后补的，按 blue 系的命名走。
const staticThemes = [
  ["theme-light.css", 'html[theme="light"]', themeLight],
  ["theme-dark.css", 'html[theme="dark"]', themeDark],
  ["theme-light-blue.css", 'html[theme="light-blue"]', themeLightBlue],
  ["theme-dark-blue.css", 'html[theme="dark-blue"]', themeDarkBlue],
  ["theme-gray.css", 'html[theme="gray"]', themeGray],
  ["theme-dark-gray.css", 'html[theme="dark-gray"]', themeDarkGray],
] as const;
const autoThemes = [
  ["theme-auto.css", 'html[theme="auto"]', themeLight, themeDark],
  ["theme-auto-blue.css", 'html[theme="auto-blue"]', themeLightBlue, themeDarkBlue],
  ["theme-auto-gray.css", 'html[theme="auto-gray"]', themeGray, themeDarkGray],
] as const;

mkdirSync(generatedDir, { recursive: true });

for (const [fileName, themeSelector, themeTokens] of staticThemes) {
  writeFileSync(resolve(generatedDir, fileName), wrapThemeCss(themeSelector, themeTokens), "utf8");
}

for (const [fileName, themeSelector, lightTokens, darkTokens] of autoThemes) {
  writeFileSync(resolve(generatedDir, fileName), wrapAutoThemeCss(themeSelector, lightTokens, darkTokens), "utf8");
}
