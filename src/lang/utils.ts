/**
 * 国际化工具函数
 */
import i18n from "./index";

/**
 * 翻译路由标题
 * 用于面包屑、侧边栏、标签页等场景
 *
 * 查找优先级：route.${name} → route.${title} → 原始 title
 * 静态路由的 meta.title 本身就是 key（如 "dashboard"），通过 title 回退即可命中；
 * 动态路由的 meta.title 是中文（如 "系统管理"），需要借助 route.name（如 "System"）才能命中。
 */
export function translateRouteTitle(title: string, name?: string): string {
  if (name) {
    const nameKey = `route.${name}`;
    if (i18n.global.te(nameKey)) return i18n.global.t(nameKey);
  }
  const titleKey = `route.${title}`;
  return i18n.global.te(titleKey) ? i18n.global.t(titleKey) : title;
}
