"""从 settings.yaml 生成配置项参考文档。

手写的配置参考会立刻过时——2500 行配置，改一处文档就落后一处。
这里从源头导出，`pnpm build` 之后跑一次即可保证与实现一致。

    python scripts/gen-settings-reference.py
"""

import io
import sys
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parent.parent

# 控件类型 -> 人话
KIND = {
    "text": "文本",
    "textarea": "多行文本",
    "number": "数字",
    "switch": "开关",
    "radio": "单选",
    "select": "下拉",
    "checkbox": "多选",
    "color": "颜色",
    "code": "代码",
    "attachment": "附件",
    "attachmentInput": "附件",
    "array": "对象数组",
    "list": "列表",
    "iconify": "图标",
    "menuSelect": "菜单选择",
    "menuCheckbox": "菜单多选",
    "menuRadio": "菜单单选",
    "categorySelect": "分类选择",
    "tagSelect": "标签选择",
    "postSelect": "文章选择",
    "singlePageSelect": "独立页选择",
    "secret": "凭据",
    "group": "分组",
    "repeater": "重复项",
}


def as_text(v: object) -> str:
    """help / label 可能是 FormKit 的条件式 {if, then, else}，把字符串分支摊平。"""
    if v is None:
        return ""
    if isinstance(v, str):
        return v
    if isinstance(v, dict):
        parts = [as_text(v[k]) for k in ("then", "else") if k in v]
        return " / ".join(p for p in parts if p)
    if isinstance(v, list):
        return " / ".join(filter(None, (as_text(x) for x in v)))
    return str(v)


def fmt_default(v: object) -> str:
    if v is None or v == "":
        return "—"
    if isinstance(v, bool):
        return "开" if v else "关"
    if isinstance(v, (list, dict)):
        return "—" if not v else f"`{v}`"
    s = str(v)
    return f"`{s}`" if len(s) <= 40 else f"`{s[:37]}…`"


def walk(node, depth=0, out=None):
    """收集 (深度，字段定义)。array/list 的子项缩进一级。"""
    if out is None:
        out = []
    if isinstance(node, dict):
        if node.get("$formkit") and node.get("name"):
            out.append((depth, node))
            for child in node.get("children") or []:
                walk(child, depth + 1, out)
            return out
        for v in node.values():
            walk(v, depth, out)
    elif isinstance(node, list):
        for v in node:
            walk(v, depth, out)
    return out


def main() -> None:
    doc = yaml.safe_load(io.open(ROOT / "settings.yaml", encoding="utf-8"))
    forms = doc["spec"]["forms"]

    buf: list[str] = []
    w = buf.append
    w("# 配置项参考\n\n")
    w("> 本文件由 `scripts/gen-settings-reference.py` 从 `settings.yaml` 生成，请勿手改。\n")
    w("> 改了配置就重新生成，这样它不会和实现脱节。\n\n")
    # 整文件豁免 lint：这是导出产物，不应被 --fix 改写。
    # 只关 MD013 不够——MD034 会把帮助文案里的裸 URL 自动加尖括号，
    # 中文标点没有空格分隔，会被一起裹进链接里，把内容改坏。
    w("<!-- markdownlint-disable -->\n\n")

    total = sum(len(walk(f)) for f in forms)
    w(f"共 {len(forms)} 个分组、{total} 个配置项。\n\n")

    w("| 分组 | 标签 | 配置项数 |\n| --- | --- | --- |\n")
    for f in forms:
        w(f"| `{f['group']}` | {f.get('label', '')} | {len(walk(f))} |\n")
    w("\n")

    for f in forms:
        w(f"## {f.get('label', f['group'])}\n\n")
        w(f"模板中访问：`theme.config.{f['group']}.<配置项名>`\n\n")
        w("| 配置项 | 类型 | 标签 | 默认值 | 说明 |\n| --- | --- | --- | --- | --- |\n")
        for depth, n in walk(f):
            indent = "└ " * min(depth, 1) if depth else ""
            kind = KIND.get(n.get("$formkit"), n.get("$formkit", ""))
            label = as_text(n.get("label")).replace("|", "\\|")
            help_ = as_text(n.get("help")).replace("|", "\\|").replace("\n", " ")
            cond = n.get("if")
            if cond:
                c = str(cond).replace("|", "\\|")
                help_ = (help_ + f"（仅当 `{c}` 时显示）").strip()
            if len(help_) > 120:
                help_ = help_[:117] + "…"
            w(
                f"| {indent}`{n['name']}` | {kind} | {label} | "
                f"{fmt_default(n.get('value'))} | {help_} |\n"
            )
        w("\n")

    out = ROOT / "docs" / "SETTINGS.md"
    io.open(out, "w", encoding="utf-8", newline="\n").write("".join(buf))
    print(
        f"已生成 {out.relative_to(ROOT).as_posix()}：{len(forms)} 个分组、{total} 个配置项",
        file=sys.stderr,
    )


if __name__ == "__main__":
    main()
