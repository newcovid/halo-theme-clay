import "./styles.css";
import { isVisible } from "@runtime/scripts/animations/base";
import { slideDown } from "@runtime/scripts/animations/slide-down";
import { slideUp } from "@runtime/scripts/animations/slide-up";

// --clay-duration 的毫秒值。全站过渡都是这一个数，展开菜单没有理由自成一格。
const ANIMATION_DURATION = 200;

document.addEventListener("DOMContentLoaded", (): void => {
  const mobileMenuIcon: HTMLElement | null = document.querySelector("#header-component > #nav > ul > .icon > a");
  const mobileMenuItems: NodeListOf<HTMLElement> | null = document.querySelectorAll(
    "#header-component > #nav > ul > li:not(:first-child)",
  );
  // 移动端 主页页眉菜单 按钮事件 绑定
  mobileMenuIcon?.addEventListener("click", (): void => {
    // 检查第一个菜单项是否可见来判断菜单状态
    const willExpand = !isVisible(mobileMenuItems[0]);
    // 设置 aria-expanded。样式挂在这个属性上，不另加类，状态只有一处来源。
    mobileMenuIcon.setAttribute("aria-expanded", String(willExpand));
    // 展开/收起：逐项做高度过渡。
    // 原先是 50ms 的淡入淡出——半个 --clay-duration 都不到，读起来就是「啪」地出现，
    // 和文章页底部子菜单（同一份 slide 助手）也对不上。改成同一条曲线、同一个时长后，
    // 三处展开动效才是同一个动作。
    mobileMenuItems.forEach((item) => {
      if (willExpand) {
        slideDown(item, ANIMATION_DURATION);
      } else {
        slideUp(item, ANIMATION_DURATION);
      }
    });
  });
});
