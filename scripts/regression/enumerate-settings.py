"""枚举 settings.yaml 中可离散取值的配置项，供 run.mjs 逐项回归。

用法：python scripts/regression/enumerate-settings.py [settings.yaml] > out.json
"""

import io
import json
import sys

import yaml

PATH = sys.argv[1] if len(sys.argv) > 1 else "settings.yaml"

doc = yaml.safe_load(io.open(PATH, encoding="utf-8"))
out = []

for form in doc["spec"]["forms"]:
    group = form["group"]

    def walk(node, group=group):
        if isinstance(node, dict):
            kind = node.get("$formkit")
            name = node.get("name")
            if name and kind in ("switch", "radio", "select", "checkbox"):
                values = None
                if kind == "switch":
                    values = [True, False]
                elif node.get("options"):
                    opts = node["options"]
                    if all(isinstance(o, dict) and "value" in o for o in opts):
                        values = [o["value"] for o in opts]
                if values:
                    out.append(
                        {
                            "group": group,
                            "name": name,
                            "kind": kind,
                            "default": node.get("value"),
                            "values": values,
                        }
                    )
            for v in node.values():
                walk(v, group)
        elif isinstance(node, list):
            for v in node:
                walk(v, group)

    walk(form)

# 去重（同名字段可能在多语言块里重复）
seen = set()
uniq = []
for s in out:
    key = (s["group"], s["name"])
    if key in seen:
        continue
    seen.add(key)
    uniq.append(s)

combos = sum(len(s["values"]) for s in uniq)
print(f"# 可离散取值的配置项：{len(uniq)}，取值总数：{combos}", file=sys.stderr)
by_group = {}
for s in uniq:
    by_group.setdefault(s["group"], 0)
    by_group[s["group"]] += 1
for g, n in sorted(by_group.items(), key=lambda x: -x[1]):
    print(f"#   {g:28} {n}", file=sys.stderr)

json.dump(uniq, sys.stdout, ensure_ascii=False)
