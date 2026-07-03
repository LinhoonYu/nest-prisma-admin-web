/**
 * 应用设置相关类型定义
 */

import type { ThemeMode } from "@/enums";

export interface AppSettings {
  title: string;
  version: string;
  showSettings: boolean;
  showTagsView: boolean;
  tagsViewStyle: "card" | "line";
  showAppLogo: boolean;
  layout: "left" | "top" | "mix" | "double";
  themePalette: string;
  themeColors: Record<string, string>;
  theme: ThemeMode;
  size: string;
  language: string;
  showWatermark: boolean;
  watermarkContent: string;
  sidebarColorScheme: "classic-blue" | "minimal-white";
}
