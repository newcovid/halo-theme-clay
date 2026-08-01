/**
 * 在页面控制台里粘贴执行：检查文本对比度与焦点可见性。
 *
 * 两个容易踩的坑，这里都绕开了：
 *  1. 颜色不能用正则解析。暗色主题的计算值是 `oklab(...)`（来自 color-mix），
 *     按 rgb 读会得到完全错误的比值。这里用 1x1 canvas 让浏览器自己规范化成 sRGB。
 *  2. 焦点不能用 el.focus() 检测。程序化聚焦不触发 :focus-visible，
 *     而浏览器默认焦点环只在 :focus-visible 下绘制，会误报「全部缺失」。
 *     真实结论要用 Tab 键走一遍，或检查 el.matches(':focus-visible')。
 */
(() => {
  const cv = document.createElement("canvas");
  cv.width = cv.height = 1;
  const cx = cv.getContext("2d", { willReadFrequently: true });
  const toRGBA = (css) => {
    cx.clearRect(0, 0, 1, 1);
    cx.fillStyle = "#000";
    cx.fillStyle = css;
    cx.fillRect(0, 0, 1, 1);
    const d = cx.getImageData(0, 0, 1, 1).data;
    return [d[0], d[1], d[2], d[3] / 255];
  };
  const over = (fg, bg) => [0, 1, 2].map((i) => fg[i] * fg[3] + bg[i] * (1 - fg[3]));
  const srgb = (c) => (c /= 255) <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  const lum = ([r, g, b]) => 0.2126 * srgb(r) + 0.7152 * srgb(g) + 0.0722 * srgb(b);
  const ratio = (a, b) => {
    const [l1, l2] = [lum(a), lum(b)].sort((x, y) => y - x);
    return (l1 + 0.05) / (l2 + 0.05);
  };
  const bgOf = (el) => {
    let n = el;
    while (n) {
      const c = toRGBA(getComputedStyle(n).backgroundColor);
      if (c[3] > 0.9) return c.slice(0, 3);
      n = n.parentElement;
    }
    return [255, 255, 255];
  };

  const low = [];
  const seen = new Set();
  for (const el of document.querySelectorAll("p,a,span,li,h1,h2,h3,h4,time,div")) {
    if (!el.offsetParent || !el.textContent.trim()) continue;
    if ([...el.children].some((c) => c.textContent.trim() === el.textContent.trim())) continue;
    const cs = getComputedStyle(el);
    const fg = toRGBA(cs.color);
    const bg = bgOf(el);
    const eff = fg[3] < 1 ? over(fg, bg) : fg.slice(0, 3);
    const r = ratio(eff, bg);
    const sz = parseFloat(cs.fontSize);
    const need = sz >= 24 || (sz >= 18.66 && Number(cs.fontWeight) >= 700) ? 3 : 4.5;
    const k = cs.color + cs.fontSize + el.tagName;
    if (r < need && !seen.has(k)) {
      seen.add(k);
      low.push({ tag: el.tagName, text: el.textContent.trim().slice(0, 20), size: cs.fontSize, ratio: +r.toFixed(2), need });
    }
  }
  return { scheme: document.documentElement.getAttribute("data-color-scheme"), lowContrast: low };
})();
