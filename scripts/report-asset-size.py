"""把构建产物的体积摘要打到标准输出（CI 里直接追加进 job summary）。

    pnpm build
    python scripts/report-asset-size.py

上游有一套 page-size 审计工作流，硬分叉时没有跟着搬——它依赖上游自己的基线数据。
这里退一步：不做「页面重了多少」的判定，只把每次构建的产物摊开给人看，
让体积变化在 PR 里可见，而不是等到发版才发现多了一兆。

真正的页面重量要连着一个跑起来的 Halo 才测得到（scripts/regression/page-weight.mjs），
因为一页实际取哪几个片段取决于用户选中的配置项。这里量的是「货架上有多少」，
不是「一页拿走多少」，两者不要混为一谈。
"""

import sys
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ASSETS = ROOT / "templates"
DIST = ROOT / "dist"

# 归类：后缀 -> 人话
KINDS = {
    ".css": "CSS",
    ".js": "JS",
    ".woff2": "字体",
    ".html": "模板",
    ".png": "图片",
    ".jpg": "图片",
    ".svg": "图片",
    ".ico": "图片",
}


def kib(n: float) -> str:
    return f"{n / 1024:,.1f}"


def main() -> None:
    if not ASSETS.is_dir():
        raise SystemExit("templates/ 不存在——先跑 pnpm build")

    raw: dict[str, int] = defaultdict(int)
    br: dict[str, int] = defaultdict(int)
    count: dict[str, int] = defaultdict(int)
    biggest: list[tuple[int, str]] = []

    for f in ASSETS.rglob("*"):
        if not f.is_file() or f.suffix == ".br":
            continue
        kind = KINDS.get(f.suffix, "其它")
        size = f.stat().st_size
        raw[kind] += size
        count[kind] += 1
        brotli = f.with_name(f.name + ".br")
        # 预压缩只对文本类产物生成，字体和图片没有 .br 兄弟——
        # 那种情况下传输的就是原文件，按原大小计入。
        transfer = brotli.stat().st_size if brotli.exists() else size
        br[kind] += transfer
        biggest.append((transfer, f.name))

    print("## 构建产物体积\n")
    print("| 类型 | 文件数 | 原始 (KiB) | 传输 (KiB) |")
    print("| --- | ---: | ---: | ---: |")
    for kind in sorted(raw, key=lambda k: -br[k]):
        print(f"| {kind} | {count[kind]} | {kib(raw[kind])} | {kib(br[kind])} |")
    print(f"| **合计** | **{sum(count.values())}** | **{kib(sum(raw.values()))}** | **{kib(sum(br.values()))}** |")

    print("\n<details><summary>传输体积最大的 15 个文件</summary>\n")
    print("| 文件 | 传输 (KiB) |")
    print("| --- | ---: |")
    for size, name in sorted(biggest, reverse=True)[:15]:
        print(f"| `{name}` | {kib(size)} |")
    print("\n</details>")

    zips = sorted(DIST.glob("*.zip")) if DIST.is_dir() else []
    if zips:
        print("\n### 发行包\n")
        print("| 包 | 大小 (MiB) |")
        print("| --- | ---: |")
        for z in zips:
            print(f"| `{z.name}` | {z.stat().st_size / 1024 / 1024:,.2f} |")

    print(
        "\n> 这是货架上的全部产物。单个页面只会取其中用户选中的那些片段，"
        "实际页面重量见 `scripts/regression/page-weight.mjs`（需要跑着的 Halo）。",
        file=sys.stdout,
    )


if __name__ == "__main__":
    main()
