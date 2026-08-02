import "./styles.css";

/*
  用 pointerdown 而不是 click：
  - 反馈要跟着按下走，等到 click（抬起）才画已经晚了半拍；
  - 右键根本不产生 click 事件，而 pointerdown 在系统右键菜单弹出之前就已经派发。

  监听挂在捕获阶段，页面里任何 stopPropagation 都不会把它吞掉。
*/

const MAX_CONCURRENT = 6;

const host = document.getElementById("clay-click-effect");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (host && !prefersReducedMotion) {
  const isSecondaryEnabled = host.dataset.secondary === "true";

  window.addEventListener(
    "pointerdown",
    (event: PointerEvent) => {
      // 触摸屏上手指本身就是反馈，再补一圈波纹只是噪声
      if (event.pointerType === "touch") {
        return;
      }

      const isSecondary = event.button === 2;

      if (event.button !== 0 && !isSecondary) {
        return;
      }

      if (isSecondary && !isSecondaryEnabled) {
        return;
      }

      // 连点时旧的那些还没播完，超过上限就从最老的开始丢
      while (host.childElementCount >= MAX_CONCURRENT) {
        host.firstElementChild?.remove();
      }

      const mark = document.createElement("i");

      mark.className = isSecondary ? "secondary" : "primary";
      mark.style.left = `${event.clientX}px`;
      mark.style.top = `${event.clientY}px`;
      mark.addEventListener("animationend", () => mark.remove(), { once: true });
      host.append(mark);
    },
    { capture: true, passive: true },
  );
}

export {};
