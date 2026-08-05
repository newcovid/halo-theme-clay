import { resolve } from "node:path";

import { includeIgnoreFile } from "@eslint/compat";
import js from "@eslint/js";
import html from "eslint-plugin-html";
import oxlint from "eslint-plugin-oxlint";
import { defineConfig, globalIgnores } from "eslint/config";
import globals from "globals";
import tseslint from "typescript-eslint";

const gitignorePath = resolve(import.meta.dirname, ".gitignore");

const browserTsFiles = [
  "src/templates/**/*.ts",
  "src/types/**/*.d.ts",
  // 在浏览器控制台里执行的审计脚本，虽然放在 scripts/ 下但不是 Node 侧
  "scripts/regression/a11y-audit.js",
];

const nodeFiles = [
  "src/scripts/**/*.ts",
  "scripts/**/*.{js,mjs,ts}",
  "vite.config.ts",
  "plugins/**/*.ts",
  "eslint.config.js",
  "stylelint.config.js",
  ".github/scripts/**/*.{js,ts}",
];

const browserLanguageOptions = {
  ecmaVersion: "latest",
  sourceType: "module",
  globals: {
    ...globals.browser,
  },
};

const htmlLanguageOptions = {
  ecmaVersion: "latest",
  sourceType: "script",
  globals: {
    ...globals.browser,
  },
};

const qrcodeHtmlLanguageOptions = {
  ...htmlLanguageOptions,
  globals: {
    ...htmlLanguageOptions.globals,
    QRCode: "readonly",
  },
};

const nodeLanguageOptions = {
  ecmaVersion: 2024,
  sourceType: "module",
  globals: {
    ...globals.node,
  },
};

export default defineConfig(
  globalIgnores(["src/templates/public/assets/lib/**/*"]),
  includeIgnoreFile(gitignorePath),
  js.configs.recommended,
  tseslint.configs.strict,
  tseslint.configs.stylistic,
  {
    // Browser-side TS/JS covered by tsconfig.browser.json.
    files: browserTsFiles,
    languageOptions: browserLanguageOptions,
  },
  {
    // HTML templates: eslint-plugin-html lints inline scripts with classic script semantics.
    files: ["src/templates/**/*.html"],
    plugins: { html },
    languageOptions: htmlLanguageOptions,
  },
  {
    // HTML template with an extra global provided by EasyQRCodeJS.
    files: ["src/templates/public/assets/qrcode.html"],
    plugins: { html },
    languageOptions: qrcodeHtmlLanguageOptions,
  },
  {
    // Node-side config/build/tooling covered by tsconfig.node.json.
    files: nodeFiles,
    languageOptions: nodeLanguageOptions,
  },
  ...oxlint.buildFromOxlintConfigFile("./.oxlintrc.json"),
);
