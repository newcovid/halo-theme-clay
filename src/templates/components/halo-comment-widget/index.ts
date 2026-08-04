import "./styles.css";
import shadowStyles from "./shadow.css?inline";

/*
  评论组件（plugin-comment-widget v3）整个跑在 shadow DOM 里，主题的普通选择器进不去。
  它对外只暴露一组 --halo-cw-* 自定义属性，颜色、字体、圆角靠那一组就够（见 styles.css）；
  但布局不行——「登录 / 退出登录」和「提交评论」分在两行，是因为组件把它们放进了
  .form__footer 却没给这个盒子任何布局。那几个类名（form__footer / form-login /
  form-logout / form-submit / form-actions）在组件产物里一条样式都没有，是留给外部的钩子。

  shadow root 是 open 的，adoptedStyleSheets 可以从外面追加，追加进去的排在组件自己那几张之后，
  同优先级下后来者胜——所以不需要 !important。组件用的是 Lit，样式只在
  createRenderRoot 时写一次，之后重渲染不会把追加的这张挤掉。

  构造式样式表在 Chrome 73 / Firefox 101 / Safari 16.4 起可用，都低于 package.json 里
  声明的浏览器下限，所以不写降级分支。

  代价是这份样式绑在上游的类名上。上游改名 → 这里静默失效 → 评论区回落到插件默认样式，
  坏的方向是「不好看」而不是「坏掉」，可以接受。
*/

const HOST_SELECTOR = "comment-widget";

let sheet: CSSStyleSheet | undefined;
const trackedRoots = new WeakSet<ShadowRoot>();
let sweepFrame: number | null = null;
let documentObserver: MutationObserver | null = null;

function getSheet(): CSSStyleSheet {
  if (!sheet) {
    sheet = new CSSStyleSheet();
    sheet.replaceSync(shadowStyles);
  }

  return sheet;
}

function adopt(root: ShadowRoot): void {
  const styleSheet = getSheet();
  if (root.adoptedStyleSheets.includes(styleSheet)) {
    return;
  }

  root.adoptedStyleSheets = [...root.adoptedStyleSheets, styleSheet];
}

/**
 * 递归接管一棵 shadow 树：自己先采纳样式，再往下找嵌套的宿主。
 *
 * 组件是多层自定义元素（comment-widget > comment-form > base-form > comment-editor…），
 * 每一层各有自己的 shadow root，需要样式的类名分散在其中几层里。
 * 回复表单、评论条目是交互后才创建的，所以每棵树都挂一个 MutationObserver 等新宿主出现。
 */
function track(root: ShadowRoot): void {
  adopt(root);

  if (!trackedRoots.has(root)) {
    trackedRoots.add(root);
    new MutationObserver(scheduleSweep).observe(root, { childList: true, subtree: true });
  }

  for (const element of root.querySelectorAll<HTMLElement>("*")) {
    if (element.shadowRoot) {
      track(element.shadowRoot);
    }
  }
}

function sweep(): void {
  let found = false;

  for (const host of document.querySelectorAll<HTMLElement>(HOST_SELECTOR)) {
    if (host.shadowRoot) {
      track(host.shadowRoot);
      found = true;
    }
  }

  // 组件是滚动到评论区才挂载的，在那之前只能靠文档级观察等它出现。
  // 一旦接管成功就撤掉：之后新增的宿主都在 shadow 树内部，由每棵树自己的观察器接住。
  if (found && documentObserver) {
    documentObserver.disconnect();
    documentObserver = null;
  }
}

function scheduleSweep(): void {
  if (sweepFrame !== null) {
    return;
  }

  sweepFrame = window.requestAnimationFrame(() => {
    sweepFrame = null;
    sweep();
  });
}

document.addEventListener("DOMContentLoaded", (): void => {
  documentObserver = new MutationObserver(scheduleSweep);
  documentObserver.observe(document.body, { childList: true, subtree: true });
  sweep();
});
