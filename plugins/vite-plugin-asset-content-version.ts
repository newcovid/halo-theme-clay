/**
 * 给模板里引用的主题静态资源补上按最终内容算的版本号 `?v=`。
 *
 * 为什么需要：
 *
 * rolldown 在 `generateBundle` 之前就把 `[hash]` 定死了，此后还有两个插件继续改产物内容——
 * 类名混淆（把 Tailwind utility 换成 `_a` 这类短名）和生成注释清理。于是「文件名里的哈希」
 * 覆盖的是改写**之前**的字节，而实际落盘的是改写**之后**的字节。两次构建之间，只要某个 CSS
 * 自己的源没动（文件名不变），而全局短名表因为别处的增删重新发号（内容变了），同一个 URL
 * 就会装着不同的字节。
 *
 * 后果不是「样式旧了」而是「样式没了」：`vite-plugin-sri3` 的 `integrity` 算在最终内容上，
 * 老访客缓存里那份旧字节对不上新哈希，浏览器**拒绝加载**整张样式表——`link.sheet` 为 null，
 * 页面塌回近乎无样式的流式布局。v0.3.0 → v0.3.1 实测 54 个同名 CSS 里有 19 个内容不同。
 *
 * 为什么是 `?v=` 而不是改文件名：
 *
 * rolldown 不接受在 `generateBundle` 里增删 bundle 的键，改名这条路是堵死的（只改 `fileName`
 * 会让后续按引用查 bundle 的插件找不到资源）。而 URL 上的查询串同样进浏览器缓存键，
 * 又不影响 Halo 的静态资源解析与 br 协商，成本只有每个引用十来个字节。
 *
 * 顺带它修的是一类问题而不是一处：任何在哈希之后再改内容的步骤，都被这一层兜住。
 *
 * 插入点：必须**晚于** `vite-plugin-sri3`。sri3 按 `href` 去 bundle 里找资源算 integrity，
 * 提前加上查询串会让它找不到而报错；而 integrity 算的是内容、与 URL 无关，所以放在它之后
 * 追加查询串不会让 integrity 失效。sri3 自己也是把钩子挂到 Vite 内部的
 * `vite:build-import-analysis` 上，所以这里用同样的手法再挂一层——本插件在
 * `vite.config.ts` 里排在 `sri()` 之后，`configResolved` 因此也在它之后执行，
 * 追加的钩子自然排在它后面。
 *
 * 没有覆盖到的一处：JS chunk 之间的相对 import。那些 URL 不带 base 前缀，不在这里改写；
 * 它们没有 SRI，最坏情况是缓存里的旧 chunk 与新 CSS 的短名对不上，属于降级而不是塌台。
 */
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { isAbsolute, relative, resolve } from "node:path";

import type { Plugin } from "vite";

interface AssetContentVersionPluginOptions {
  base: string;
}

// 与 sri3 相同的插入点：此时 HTML 产物已经成型，integrity 也已经写好。
const VITE_INTERNAL_ANALYSIS_PLUGIN = "vite:build-import-analysis";

// 8 位 base64url，和 rolldown 自己的哈希段等长，产物里看不出是两套东西。
const VERSION_LENGTH = 8;

const HTML_FILE_EXTENSION = ".html";
const VERSIONED_EXTENSIONS = [".css", ".js"];

interface BundleFileLike {
  code?: string;
  fileName: string;
  source?: string | Uint8Array;
  type: "asset" | "chunk";
}

function isBundleFileLike(value: unknown): value is BundleFileLike {
  return typeof value === "object" && value !== null && "type" in value && "fileName" in value;
}

/** 取出条目的最终字节，二进制资源原样返回。 */
function toFileContent(bundleValue: BundleFileLike): string | Uint8Array | undefined {
  return bundleValue.type === "chunk" ? bundleValue.code : bundleValue.source;
}

function normalizeBasePath(base: string): string {
  const withLeadingSlash = base.startsWith("/") ? base : `/${base}`;
  return withLeadingSlash.endsWith("/") ? withLeadingSlash : `${withLeadingSlash}/`;
}

function escapeRegExp(value: string): string {
  return value.replaceAll(/[.*+?^${}()|[\]\\]/gu, String.raw`\$&`);
}

type GenerateBundleHook = NonNullable<Plugin["generateBundle"]>;
type GenerateBundleHandler = (...args: unknown[]) => Promise<void> | void;

/** 把逻辑追加到目标插件的 `generateBundle` 之后。 */
function hijackGenerateBundle(plugin: Plugin, afterHook: GenerateBundleHandler): void {
  const hook = plugin.generateBundle;

  if (typeof hook === "object" && hook.handler !== undefined) {
    const originalHandler = hook.handler;
    hook.handler = async function (...args) {
      await originalHandler.apply(this, args);
      await afterHook.apply(this, args);
    };
    return;
  }

  if (typeof hook === "function") {
    plugin.generateBundle = async function (...args) {
      await hook.apply(this, args);
      await afterHook.apply(this, args);
    } satisfies GenerateBundleHook;
  }
}

export default function assetContentVersionPlugin(options: AssetContentVersionPluginOptions): Plugin {
  const normalizedBase = normalizeBasePath(options.base);

  // 捕获 `<base><path>.css|.js`，后面紧跟引号才算完整引用；
  // 已经带查询串或锚点的引用不会命中，重复执行也是幂等的。
  const referenceRegex = new RegExp(
    `${escapeRegExp(normalizedBase)}([\\w./@-]+(?:${VERSIONED_EXTENSIONS.map((extension) => escapeRegExp(extension)).join("|")}))(?=["'\\s>])`,
    "gu",
  );

  let publicDir: string | false = false;

  /**
   * publicDir 里的文件不进 bundle，但一样被模板引用、一样被 sri3 加上 integrity，
   * 于是同样吃「名字没变、字节变了」这一口。这里按 sri3 的做法从磁盘读一份。
   */
  const readPublicAssetVersion = (fileName: string): string | undefined => {
    if (publicDir === false) {
      return undefined;
    }

    const filePath = resolve(publicDir, fileName);
    const relativePath = relative(publicDir, filePath);

    // 防目录穿越：引用只能落在 publicDir 之内。
    if (relativePath.startsWith("..") || isAbsolute(relativePath)) {
      return undefined;
    }

    try {
      return createHash("sha256").update(readFileSync(filePath)).digest("base64url").slice(0, VERSION_LENGTH);
    } catch {
      return undefined;
    }
  };

  const appendVersions = (bundle: Record<string, unknown>): void => {
    const versionByFileName = new Map<string, string>();

    for (const bundleValue of Object.values(bundle)) {
      if (!isBundleFileLike(bundleValue)) {
        continue;
      }

      const content = toFileContent(bundleValue);

      if (content === undefined) {
        continue;
      }

      if (!VERSIONED_EXTENSIONS.some((extension) => bundleValue.fileName.endsWith(extension))) {
        continue;
      }

      versionByFileName.set(
        bundleValue.fileName,
        createHash("sha256").update(content).digest("base64url").slice(0, VERSION_LENGTH),
      );
    }

    for (const bundleValue of Object.values(bundle)) {
      if (!isBundleFileLike(bundleValue) || !bundleValue.fileName.endsWith(HTML_FILE_EXTENSION)) {
        continue;
      }

      const source = bundleValue.source;

      if (typeof source !== "string") {
        continue;
      }

      bundleValue.source = source.replaceAll(referenceRegex, (reference, fileName: string) => {
        const version = versionByFileName.get(fileName) ?? readPublicAssetVersion(fileName);

        return version === undefined ? reference : `${reference}?v=${version}`;
      });
    }
  };

  return {
    name: "asset-content-version",
    apply: "build",
    enforce: "post",
    configResolved(config) {
      publicDir = config.publicDir;

      const internalAnalysisPlugin = config.plugins.find((plugin) => plugin.name === VITE_INTERNAL_ANALYSIS_PLUGIN);

      if (internalAnalysisPlugin === undefined) {
        throw new Error("asset-content-version requires Vite's build import analysis plugin");
      }

      hijackGenerateBundle(internalAnalysisPlugin, (_outputOptions, bundle) => {
        appendVersions(bundle as Record<string, unknown>);
      });
    },
  };
}
