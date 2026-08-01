/**
 * Halo 控制台 API 的最小客户端，供回归脚本使用。
 *
 * 登录一定要走 RSA：`/login` 把 `password` 渲染成 hidden 字段，页面内联 JS 用
 * jsencrypt（RSA PKCS#1 v1.5）加密后才提交。直接提交明文恒返回 invalid-credential。
 * 改变状态的 API 还需要把 `XSRF-TOKEN` cookie 的值放进 `X-XSRF-TOKEN` 请求头。
 *
 * 地址与凭据从环境变量读取，不写死在仓库里：
 *   HALO_BASE_URL   默认 http://localhost:8090
 *   HALO_USERNAME   必填
 *   HALO_PASSWORD   必填
 */

import crypto from "node:crypto";
import process from "node:process";

export const BASE = process.env.HALO_BASE_URL ?? "http://localhost:8090";

const jar = new Map();
export const cookieHeader = () => [...jar].map(([k, v]) => `${k}=${v}`).join("; ");

const absorb = (r) => {
  for (const c of r.headers.getSetCookie?.() ?? []) {
    const [p] = c.split(";");
    const i = p.indexOf("=");
    if (i > 0) jar.set(p.slice(0, i).trim(), p.slice(i + 1).trim());
  }
};

export async function req(path, opts = {}) {
  const r = await fetch(BASE + path, {
    ...opts,
    redirect: "manual",
    headers: { ...(opts.headers || {}), cookie: cookieHeader() },
  });
  absorb(r);
  return r;
}

export function csrfToken() {
  return jar.get("XSRF-TOKEN");
}

export async function login(username = process.env.HALO_USERNAME, password = process.env.HALO_PASSWORD) {
  if (!username || !password) {
    throw new Error("请设置 HALO_USERNAME 与 HALO_PASSWORD 环境变量");
  }
  const page = await (await req("/login")).text();
  const csrf = page.match(/name="_csrf" value="([^"]+)"/)?.[1];
  const pub = page.match(/const publicKey = "([^"]+)"/)?.[1]?.replace(/\\\//g, "/");
  if (!csrf || !pub) throw new Error("未能从登录页提取 CSRF 或 RSA 公钥");
  const enc = crypto
    .publicEncrypt(
      {
        key: crypto.createPublicKey({ key: Buffer.from(pub, "base64"), format: "der", type: "spki" }),
        padding: crypto.constants.RSA_PKCS1_PADDING,
      },
      Buffer.from(password),
    )
    .toString("base64");
  const r = await req("/login", {
    method: "POST",
    body: new URLSearchParams({ username, password: enc, _csrf: csrf }),
    headers: { "content-type": "application/x-www-form-urlencoded" },
  });
  if (r.status !== 302) throw new Error("登录失败: HTTP " + r.status);
  return r.headers.get("location");
}
