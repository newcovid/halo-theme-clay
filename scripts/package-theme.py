"""把主题打包成可上传 Halo 的 zip。

产出两个包：默认（简体中文）与英文。Halo 没有「本地化的 settings.yaml」这种机制，
所以多语言配置界面只能靠发多个包实现——英文包用 i18n-settings/*.en.yaml
替换掉根部的 settings.yaml / theme.yaml / annotation-settings.yaml。
这是上游 halo-theme-higan-hz 的做法，这里用 Python 重写以便跨平台且不依赖 zip 命令。

打包前需要先构建：

    pnpm build
    python scripts/package-theme.py

产物在 dist/ 下。

不用 @halo-dev/theme-package-cli 的原因：它按 `*.yaml` 通配收根目录，
会把 pnpm-lock.yaml / pnpm-workspace.yaml 一并塞进包里，而且不产出英文包。
"""

import io
import shutil
import sys
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DIST = ROOT / "dist"

# 显式清单，不用通配——避免把工程文件误打进发行包
INCLUDE = [
    "templates",
    "i18n",
    "theme.yaml",
    "settings.yaml",
    "annotation-settings.yaml",
    "screenshot.png",
    "README.md",
    "LICENSE",
]

# 英文包的替换映射：包内路径 <- 源文件
EN_OVERRIDES = {
    "settings.yaml": "i18n-settings/settings.en.yaml",
    "theme.yaml": "i18n-settings/theme.en.yaml",
    "annotation-settings.yaml": "i18n-settings/annotation-settings.en.yaml",
}


def theme_meta() -> tuple[str, str]:
    import yaml

    d = yaml.safe_load(io.open(ROOT / "theme.yaml", encoding="utf-8"))
    return d["metadata"]["name"], str(d["spec"]["version"])


def collect() -> list[tuple[Path, str]]:
    """返回 (磁盘路径，包内路径) 列表。"""
    out: list[tuple[Path, str]] = []
    for item in INCLUDE:
        p = ROOT / item
        if not p.exists():
            print(f"  ! 清单里的 {item} 不存在，跳过", file=sys.stderr)
            continue
        if p.is_dir():
            for f in sorted(p.rglob("*")):
                if f.is_file():
                    out.append((f, f.relative_to(ROOT).as_posix()))
        else:
            out.append((p, item))
    return out


def build_zip(name: str, overrides: dict[str, str]) -> Path:
    target = DIST / name
    files = collect()
    overridden = set(overrides)
    with zipfile.ZipFile(target, "w", zipfile.ZIP_DEFLATED, compresslevel=9) as z:
        for disk, inzip in files:
            if inzip in overridden:
                continue  # 由 override 提供
            z.write(disk, inzip)
        for inzip, src in overrides.items():
            sp = ROOT / src
            if not sp.exists():
                raise SystemExit(f"英文包缺少替换源：{src}")
            z.write(sp, inzip)
    return target


def main() -> None:
    if not (ROOT / "templates").is_dir():
        raise SystemExit("templates/ 不存在——先跑 pnpm build")
    if DIST.exists():
        shutil.rmtree(DIST)
    DIST.mkdir()

    name, version = theme_meta()
    for suffix, ov in (("zh-hans", {}), ("en", EN_OVERRIDES)):
        z = build_zip(f"{name}-{version}-{suffix}.zip", ov)
        n = len(zipfile.ZipFile(z).namelist())
        print(f"  {z.name:44} {z.stat().st_size / 1024 / 1024:5.2f} MB   {n} 项")


if __name__ == "__main__":
    main()
