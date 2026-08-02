"""生成自托管的中文衬线字体资源（Noto Serif SC / SIL OFL 1.1）。

## 为什么需要它

主题的识别点是衬线标题配无衬线正文，但拉丁衬线是自托管的、中文衬线不是——
中文标题能不能显示成宋体，取决于访客设备里恰好装没装某个中文衬线。

    Windows  SimSun / 宋体              有
    macOS    Songti SC                  有
    iOS      Songti SC                  有
    Android  只随 Noto Sans CJK          没有

也就是说安卓访客看到的中文标题一律是黑体，衬线/无衬线的对比整个消失。
自托管中文衬线是唯一能让所有访客一致的办法。

## 分档策略

整套字体 2.4 MB，不能整包下发；但按 `unicode-range` 切片是浏览器原生的按需加载——
只有页面上真正出现的字所在的分片才会被请求。难点在于怎么切。

用过的两组实测数据：

1. 中文衬线在本主题里只用于 h1 / h2 / blockquote / 站点名，
   一个页面上的不重复汉字大约 40～100 个，散落在常用字表里。
2. 按谷歌那样 188 字一片平切，一个页面会命中 12 片、471 KB——
   因为字太散，每片都只用上几个字，却要付整片的体积。

所以分成两档，而不是均匀切片：

    常用档  按字频排序的前 2451 字，一个文件 410 KB，精确 unicode-range，**后声明**
    生僻档  其余 10353 字，按码位切成 58 个连续窗口，粗 unicode-range，**先声明**

浏览器对同族 @font-face 的重叠 `unicode-range` 取**后声明者优先**（已实测确认），
于是常用字命中常用档、只发一个请求；页面上出现生僻字时才额外拉一个生僻分片。
粗窗口让生僻档的 unicode-range 短得多——精确写法要 55 KB CSS，粗窗口只要 2 KB。

字频顺序取自谷歌字体为本字体族切分的 101 个分片：它们按字频聚类，
分片序号越大越常用。顺序落盘在 `scripts/fonts/noto-serif-sc.order.txt`，
不必每次构建都去联网重算。

## 用法

    python scripts/build-cjk-serif.py

产物写入 `src/templates/_runtime/global/fonts/clay-cjk/`（woff2 + 生成的 styles.css）。
源字体 25 MB，不入库，缺失时自动下载到 `.cache/fonts/`。
产物是确定性的，改了参数才需要重跑，日常构建不依赖本脚本。
"""

import io
import sys
import urllib.request
from pathlib import Path

from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

ROOT = Path(__file__).resolve().parent.parent
CACHE = ROOT / ".cache" / "fonts"
ORDER = ROOT / "scripts" / "fonts" / "noto-serif-sc.order.txt"
OUT = ROOT / "src" / "templates" / "_runtime" / "global" / "fonts" / "clay-cjk"

SOURCE_URL = "https://raw.githubusercontent.com/google/fonts/main/ofl/notoserifsc/NotoSerifSC%5Bwght%5D.ttf"
SOURCE = CACHE / "NotoSerifSC[wght].ttf"

# @font-face 里用的族名。刻意不叫 "Noto Serif SC"：
# 同名会和访客本机安装的版本混起来，同一个站点在不同机器上落到不同字面，
# 而这次改动的整个目的就是让所有访客看到同一套字。
FAMILY = "Clay Serif SC"
WEIGHT = 400
# 常用档字数。2344 是实测拐点：仓库里 58 条真实中文标题共 190 个不重复汉字，
# 前 2344 字覆盖 189 个（99.5%），再往上要多付 130 KB 才能收下最后一个字。
COMMON_COUNT = 2344
# 生僻档每片字数。约 40 KB 一片——页面出现一个生僻字时的追加代价。
RARE_CHUNK = 180

# 无论字频排到哪里都要收进常用档的区段。标点几乎每个标题都会用到，
# 一旦落在生僻档里，一个顿号就要多拉一片 40 KB。
ALWAYS_COMMON = [
    (0x3000, 0x303F),  # CJK 符号和标点：。、〈〉【】…
    (0xFF01, 0xFF60),  # 全角形式：，；：？！（）以及全角数字与拉丁
]

# 只接管中日韩相关区段。拉丁、通用标点、符号、emoji 都留给 Source Serif 4
# 和系统字体：把它们纳进来会让粗窗口误抓，凭空触发几百 KB 的下载。
BLOCKS = [
    (0x2E80, 0x2EFF),  # CJK 部首补充
    (0x2F00, 0x2FDF),  # 康熙部首
    (0x2FF0, 0x2FFF),  # 表意文字描述符
    (0x3000, 0x303F),  # CJK 符号和标点
    (0x3040, 0x30FF),  # 平假名 / 片假名
    (0x3100, 0x312F),  # 注音符号
    (0x3190, 0x319F),  # 汉文标注
    (0x31A0, 0x31BF),  # 注音扩展
    (0x31C0, 0x31EF),  # CJK 笔画
    (0x3200, 0x32FF),  # 带圈 CJK 字母及月份
    (0x3300, 0x33FF),  # CJK 兼容
    (0x3400, 0x4DBF),  # CJK 扩展 A
    (0x4E00, 0x9FFF),  # CJK 统一表意文字
    (0xF900, 0xFAFF),  # CJK 兼容表意文字
    (0xFE10, 0xFE1F),  # 竖排形式
    (0xFE30, 0xFE4F),  # CJK 兼容形式
    (0xFF00, 0xFFEF),  # 半角及全角形式
]


def log(msg: str) -> None:
    print(msg, file=sys.stderr, flush=True)


def source_font() -> Path:
    if SOURCE.exists():
        return SOURCE
    CACHE.mkdir(parents=True, exist_ok=True)
    log(f"下载源字体 {SOURCE_URL}")
    with urllib.request.urlopen(SOURCE_URL, timeout=300) as r, io.open(SOURCE, "wb") as f:
        f.write(r.read())
    return SOURCE


def instanced() -> Path:
    """把可变字体固化到 wght=400。主题只在 400 字重用衬线，多余的轴白占体积。"""
    out = CACHE / f"NotoSerifSC-{WEIGHT}.ttf"
    if out.exists():
        return out
    log(f"固化字重 {WEIGHT}")
    font = TTFont(source_font())
    instancer.instantiateVariableFont(font, {"wght": WEIGHT}, inplace=True, updateFontNames=True)
    font.save(out)
    return out


def order() -> list[int]:
    # 注释行里也有汉字，不跳过的话它们会被当成最高频的字排到最前面。
    lines = io.open(ORDER, encoding="utf-8").read().splitlines()
    text = "".join(line for line in lines if not line.startswith("#"))
    seen: dict[int, None] = {}
    for ch in text:
        cp = ord(ch)
        if any(a <= cp <= b for a, b in BLOCKS):
            seen.setdefault(cp)
    return list(seen)


def write_subset(src: Path, codepoints: list[int], dest: Path) -> int:
    options = subset.Options()
    options.flavor = "woff2"
    options.hinting = False
    options.desubroutinize = False
    options.name_IDs = ["*"]
    options.name_legacy = True
    options.name_languages = ["*"]
    options.layout_features = ["ccmp", "locl", "mark", "mkmk", "kern", "liga", "calt", "rlig"]
    font = subset.load_font(str(src), options)
    subsetter = subset.Subsetter(options=options)
    subsetter.populate(unicodes=codepoints)
    subsetter.subset(font)
    subset.save_font(font, str(dest), options)
    font.close()
    return dest.stat().st_size


def ranges(codepoints: list[int]) -> str:
    """合并成 unicode-range 书写形式。"""
    codepoints = sorted(codepoints)
    out: list[str] = []
    i = 0
    while i < len(codepoints):
        j = i
        while j + 1 < len(codepoints) and codepoints[j + 1] == codepoints[j] + 1:
            j += 1
        out.append(f"U+{codepoints[i]:X}" if i == j else f"U+{codepoints[i]:X}-{codepoints[j]:X}")
        i = j + 1
    return ", ".join(out)


def face(src_name: str, unicode_range: str) -> str:
    return (
        "@font-face {\n"
        "  font-display: swap;\n"
        f'  font-family: "{FAMILY}";\n'
        "  font-style: normal;\n"
        f"  font-weight: {WEIGHT};\n"
        f'  src: url("./{src_name}") format("woff2");\n'
        f"  unicode-range: {unicode_range};\n"
        "}\n"
    )


def main() -> None:
    src = instanced()
    pool = order()
    forced = {cp for a, b in ALWAYS_COMMON for cp in range(a, b + 1) if cp in set(pool)}
    common = list(dict.fromkeys(pool[:COMMON_COUNT] + sorted(forced)))
    rare = sorted(set(pool) - set(common))
    log(f"字表 {len(pool)} 字 = 常用 {len(common)} + 生僻 {len(rare)}")

    OUT.mkdir(parents=True, exist_ok=True)
    for stale in OUT.glob("*.woff2"):
        stale.unlink()

    faces: list[str] = []
    total = 0

    # 生僻档先声明。窗口按码位连续铺满，相邻窗口首尾相接不留缝：
    # 缝里的码位（字表之外的生僻字）没有任何 @font-face 认领，会直接回落到系统字体，
    # 那样中文标题里会混进一个黑体字。让窗口连续，至少能保证「要么有字，要么整体回落」。
    chunks = [rare[i : i + RARE_CHUNK] for i in range(0, len(rare), RARE_CHUNK)]
    lower = BLOCKS[0][0]
    for index, chunk in enumerate(chunks):
        name = f"rare-{index:02d}.woff2"
        upper = BLOCKS[-1][1] if index == len(chunks) - 1 else chunk[-1]
        size = write_subset(src, chunk, OUT / name)
        total += size
        faces.append(face(name, f"U+{lower:X}-{upper:X}"))
        lower = upper + 1

    # 常用档后声明，精确 unicode-range——重叠处后声明者优先，
    # 于是常用字始终走这一档，上面那些粗窗口只有遇到生僻字才会被拉取。
    common_size = write_subset(src, common, OUT / "common.woff2")
    total += common_size
    faces.append(face("common.woff2", ranges(common)))

    header = (
        "/*\n"
        " * 由 scripts/build-cjk-serif.py 生成，不要手改。\n"
        " *\n"
        " * Noto Serif SC, SIL Open Font License 1.1, Copyright 2012 Google Inc.\n"
        f" * 固化到 wght={WEIGHT}，按字频切成常用档 + 生僻档，详见脚本头部注释。\n"
        " */\n\n"
        "/* 常用档那条 unicode-range 有一千多段，csstree 的取值匹配器跑到一万五千次迭代就放弃，\n"
        "   然后把整个取值报成 Unknown value。是 linter 的规模上限，不是语法问题。 */\n"
        "/* stylelint-disable at-rule-descriptor-value-no-unknown */\n\n"
    )
    io.open(OUT / "styles.css", "w", encoding="utf-8", newline="\n").write(header + "\n".join(faces))

    css_size = (OUT / "styles.css").stat().st_size
    log(f"常用档 {common_size / 1024:.0f} KB，生僻档 {len(chunks)} 片 {(total - common_size) / 1024 / 1024:.2f} MB")
    log(f"合计 {total / 1024 / 1024:.2f} MB，CSS {css_size / 1024:.1f} KB")


if __name__ == "__main__":
    main()
