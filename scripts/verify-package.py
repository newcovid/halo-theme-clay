"""核对 dist/ 下的发行包：内容对得上、没夹带工程文件。

    python scripts/package-theme.py
    python scripts/verify-package.py [--expect-version 0.3.4]

三件事分别对应一类真实事故：

1. **`?v=` 与被引资源的字节一致。** 资源文件名里的哈希覆盖的是类名混淆**之前**的字节，
   而落盘的是之后的字节；同名不同内容会让老访客的缓存过不了 SRI 校验，浏览器直接丢掉整张
   样式表——页面塌成无样式而所有常规排查手段都显示正常。`vite-plugin-asset-content-version`
   按最终内容补 `?v=`，这里核对它确实补对了。见 plugins/vite-plugin-asset-content-version.ts。

2. **包里没有工程文件。** 打包用的是显式清单而不是通配，但清单会被人改。仓库、release
   和 zip 都是公开的，`.claude/`、`.agents/`、本机绝对路径、凭据都不能出现在里面。

3. **两个包内容一致、版本一致。** 英文包只该替换 settings / theme / annotation-settings /
   README 四个文件，别的都该逐字节相同；版本号来自 theme.yaml，发版时还要与 tag 对上。
"""

import argparse
import base64
import hashlib
import posixpath
import re
import sys
import zipfile
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parent.parent
DIST = ROOT / "dist"

# Windows 控制台默认是 GBK，编不出 ✓ / ✗ 会直接抛 UnicodeEncodeError——
# 校验通过了却以异常收场。降级成 '?' 比崩掉好。
for _stream in (sys.stdout, sys.stderr):
    _stream.reconfigure(errors="replace")

# 包内路径前缀 -> 主题 base。模板里写的是 /themes/<name>/assets/x.css，
# 而包里它躺在 templates/assets/x.css。
TEMPLATE_DIR = "templates"

# 只有这四个文件允许在两个包之间不同
EN_DIFFERS = {
    "settings.yaml",
    "theme.yaml",
    "annotation-settings.yaml",
    "README.md",
}

# 出现即失败。工程文件、智能体侧工具链、本机痕迹。
FORBIDDEN_PATH_PARTS = [
    ".agents/",
    ".claude/",
    ".git/",
    ".github/",
    "docs/",
    "node_modules/",
    "plugins/",
    "scripts/",
    "src/",
]
FORBIDDEN_NAMES = {
    ".autocorrectignore",
    ".editorconfig",
    ".gitignore",
    "CLAUDE.md",
    "eslint.config.js",
    "package.json",
    "pnpm-lock.yaml",
    "pnpm-workspace.yaml",
    "skills-lock.json",
    "stylelint.config.js",
    "tsconfig.json",
    "vite.config.ts",
}

# 文本内容里不能出现的痕迹：会话标识与本机绝对路径
FORBIDDEN_CONTENT = [
    re.compile(r"claude\.ai/code/session"),
    re.compile(r"Claude-Session"),
    re.compile(r"[A-Za-z]:[\\/](?:Users|desktop|cache)[\\/]", re.IGNORECASE),
]
TEXT_SUFFIXES = {".css", ".html", ".js", ".json", ".md", ".properties", ".txt", ".yaml"}

VERSION_RE = re.compile(r'/themes/[\w-]+/([\w./@-]+\.(?:css|js))\?v=([\w-]{8})')


def fail(msg: str) -> None:
    print(f"  ✗ {msg}", file=sys.stderr)
    fail.count += 1  # type: ignore[attr-defined]


fail.count = 0  # type: ignore[attr-defined]


def content_version(data: bytes) -> str:
    """与插件同款：sha256 -> base64url -> 前 8 位。"""
    digest = hashlib.sha256(data).digest()
    return base64.urlsafe_b64encode(digest).decode("ascii").rstrip("=")[:8]


def check_forbidden(z: zipfile.ZipFile, label: str) -> None:
    for name in z.namelist():
        lowered = name.lower()
        if any(part in lowered for part in FORBIDDEN_PATH_PARTS):
            fail(f"{label}: 夹带工程路径 {name}")
        if posixpath.basename(name) in FORBIDDEN_NAMES:
            fail(f"{label}: 夹带工程文件 {name}")


def check_content(z: zipfile.ZipFile, label: str) -> None:
    for info in z.infolist():
        if info.is_dir() or Path(info.filename).suffix not in TEXT_SUFFIXES:
            continue
        if info.file_size > 2_000_000:
            continue
        text = z.read(info.filename).decode("utf-8", "replace")
        for pattern in FORBIDDEN_CONTENT:
            m = pattern.search(text)
            if m:
                fail(f"{label}: {info.filename} 含 {m.group(0)!r}")


def check_versioned_refs(z: zipfile.ZipFile, label: str) -> int:
    """模板里每个 ?v= 都要等于被引资源的最终内容哈希。"""
    checked = 0
    for name in z.namelist():
        if not name.startswith(f"{TEMPLATE_DIR}/") or not name.endswith(".html"):
            continue
        html = z.read(name).decode("utf-8", "replace")
        for asset, stamped in VERSION_RE.findall(html):
            target = f"{TEMPLATE_DIR}/{asset}"
            try:
                data = z.read(target)
            except KeyError:
                fail(f"{label}: {name} 引用了包里没有的 {target}")
                continue
            actual = content_version(data)
            if actual != stamped:
                fail(f"{label}: {target} 标 {stamped}，实际 {actual}")
            checked += 1
    return checked


def check_pair(zh: zipfile.ZipFile, en: zipfile.ZipFile) -> None:
    zh_names, en_names = set(zh.namelist()), set(en.namelist())
    if zh_names != en_names:
        fail(f"两包条目不同：仅中文 {sorted(zh_names - en_names)[:5]}，仅英文 {sorted(en_names - zh_names)[:5]}")
        return
    differing = {n for n in zh_names if zh.read(n) != en.read(n)}
    if differing != EN_DIFFERS:
        extra = differing - EN_DIFFERS
        missing = EN_DIFFERS - differing
        if extra:
            fail(f"英文包多改了：{sorted(extra)}")
        if missing:
            fail(f"英文包没换：{sorted(missing)}")


def package_version(z: zipfile.ZipFile) -> str:
    return str(yaml.safe_load(z.read("theme.yaml").decode("utf-8"))["spec"]["version"])


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--expect-version", help="同时核对包内版本号与它一致（发版时传 tag）")
    args = ap.parse_args()

    expected = args.expect_version.lstrip("v") if args.expect_version else None

    zips = sorted(DIST.glob("*.zip"))
    if len(zips) != 2:
        raise SystemExit(f"dist/ 下应有 2 个 zip，实际 {len(zips)} 个——先跑 scripts/package-theme.py")

    opened: dict[str, zipfile.ZipFile] = {}
    for path in zips:
        label = "en" if path.stem.endswith("-en") else "zh"
        z = zipfile.ZipFile(path)
        opened[label] = z

        version = package_version(z)
        if expected and version != expected:
            fail(f"{path.name}: 包内版本 {version}，期望 {expected}")
        check_forbidden(z, path.name)
        check_content(z, path.name)
        refs = check_versioned_refs(z, path.name)
        print(f"  {path.name:46} {len(z.namelist()):4} 项  版本 {version}  带版本号引用 {refs} 处")

    if "zh" in opened and "en" in opened:
        check_pair(opened["zh"], opened["en"])
        if package_version(opened["zh"]) != package_version(opened["en"]):
            fail("两个包的版本号不一致")

    if fail.count:  # type: ignore[attr-defined]
        raise SystemExit(f"发行包校验失败：{fail.count} 项")  # type: ignore[attr-defined]
    print("  ✓ 发行包校验通过")


if __name__ == "__main__":
    main()
