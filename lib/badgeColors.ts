import type { CSSProperties } from "react";

export type BadgeColor = "red" | "violet" | "light";

export const BADGE_COLORS: { value: BadgeColor; label: string; bg: string; text: string }[] = [
  { value: "red",    label: "Red",    bg: "#C1121F", text: "#FFFFFF" },
  { value: "violet", label: "Violet", bg: "#3A2E4F", text: "#FFFFFF" },
  { value: "light",  label: "Light",  bg: "#F4F4F4", text: "#1E1E1E" },
];

export function getBadgeStyle(color: BadgeColor | string | null | undefined): CSSProperties {
  const c = BADGE_COLORS.find((x) => x.value === color) ?? BADGE_COLORS[0];
  return { backgroundColor: c.bg, color: c.text };
}
