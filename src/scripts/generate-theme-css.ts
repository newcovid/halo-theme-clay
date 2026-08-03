/*
  把每个配色预设铺成一份只含令牌的 CSS。
  「有哪些预设、各自读哪份源文件」在 theme-tokens.ts 里，光标生成器读的是同一张表。
*/
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { COLOR_PRESETS, LIGHT_TOKENS, presetSelector, type ThemeTokens } from "./theme-tokens.ts";

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

const generatedDir = resolve(import.meta.dirname, "../generated");

mkdirSync(generatedDir, { recursive: true });

for (const preset of COLOR_PRESETS) {
  const themeSelector = presetSelector(preset.value);
  const css = preset.darkTokens
    ? wrapAutoThemeCss(themeSelector, preset.tokens, preset.darkTokens)
    : wrapThemeCss(themeSelector, preset.tokens);

  writeFileSync(resolve(generatedDir, `theme-${preset.value}.css`), css, "utf8");
}

/*
  兜底令牌。每个预设的令牌都挂在 html[theme="…"] 上，取值对不上就一个都不生效——
  而十二个令牌同时未定义，body 的 background-color 与 color 会一起变成
  invalid at computed-value time，整站退成无色，且状态码正常、控制台无报错。

  对不上的路径不止一条：配置里存着已删除的旧取值（比如改名前的 gray）、
  自定义配色的识别码填错、配置从未保存过。所以这份挂在 :root 上、进 base 层，
  由 _runtime/global/styles.css 无条件引入——它比任何预设块都弱（层内 :root 对
  层外 html[theme]，未分层者恒胜），只在真的没有预设匹配时才露出来。
*/
writeFileSync(
  resolve(generatedDir, "theme-fallback.css"),
  wrapThemeCss(":root", LIGHT_TOKENS),
  "utf8",
);
