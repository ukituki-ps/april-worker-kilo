/** Минимальные SVG-иконки для меню профиля (аналог lucide в витрине DS), без доп. зависимостей */

import type { CSSProperties } from "react";

type IconProps = {
  size?: number;
  className?: string;
  style?: CSSProperties;
};

const svgProps = (size: number) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none" as const,
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true as const,
});

export function IconUser({ size = 18, className, style }: IconProps): JSX.Element {
  return (
    <svg className={className} style={style} {...svgProps(size)}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

export function IconChevronDown({ size = 14, className, style }: IconProps): JSX.Element {
  return (
    <svg className={className} style={style} {...svgProps(size)}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export function IconCheck({ size = 14, className, style }: IconProps): JSX.Element {
  return (
    <svg className={className} style={style} {...svgProps(size)}>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

export function IconLogOut({ size = 14, className, style }: IconProps): JSX.Element {
  return (
    <svg className={className} style={style} {...svgProps(size)}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" x2="9" y1="12" y2="12" />
    </svg>
  );
}
