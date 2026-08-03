/*
  切换本地站点的配色方案，供逐档目视核对。

    HALO_USERNAME=… HALO_PASSWORD=… node scripts/fixtures/set-preset.mjs light-gray

  取值见 settings.yaml 的 color_schema：
    light / dark / auto / light-blue / dark-blue / auto-blue / light-gray / dark-gray / auto-gray

  只改这一项，其余配置原样保留。切换后刷新页面即可——模板从磁盘读，无需重装主题。
*/
import { csrfToken, login, req } from "../regression/halo-client.mjs";

const CONFIG_MAP = "halo-theme-clay-configmap";
const PRESETS = new Set([
  "auto",
  "auto-blue",
  "auto-gray",
  "dark",
  "dark-blue",
  "dark-gray",
  "light",
  "light-blue",
  "light-gray",
]);

const preset = process.argv[2];
if (!PRESETS.has(preset)) {
  console.error(`未知配色：${preset ?? "(未给)"}\n可选：${[...PRESETS].sort().join(" / ")}`);
  process.exit(1);
}

await login();

const path = `/api/v1alpha1/configmaps/${CONFIG_MAP}`;
const configMap = await (await req(path)).json();
const styles = JSON.parse(configMap.data?.styles ?? "{}");
const before = styles.color_schema;
styles.color_schema = preset;
configMap.data.styles = JSON.stringify(styles);

const res = await req(path, {
  body: JSON.stringify(configMap),
  headers: { "content-type": "application/json", "X-XSRF-TOKEN": csrfToken() },
  method: "PUT",
});

console.log(res.ok ? `配色 ${before ?? "(未设)"} → ${preset}` : `失败：${res.status} ${await res.text()}`);
process.exit(res.ok ? 0 : 1);
