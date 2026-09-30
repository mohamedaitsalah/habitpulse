import { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number; color?: string };

function svgProps(size = 18, color?: string) {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: color ?? "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
}

/* ---------------- Navigation ---------------- */

export const TodayIcon = ({ size = 18, color, ...p }: IconProps) => (
  <svg {...svgProps(size, color)} {...p}>
    <path d="M3 10.5 12 3l9 7.5" />
    <path d="M5.5 9.5V20h13V9.5" />
  </svg>
);

export const HabitsIcon = ({ size = 18, color, ...p }: IconProps) => (
  <svg {...svgProps(size, color)} {...p}>
    <rect x="3.5" y="3.5" width="17" height="17" rx="3" />
    <path d="M3.5 9.2h17M3.5 14.8h17M9.2 3.5v17M14.8 3.5v17" />
  </svg>
);

export const TasksIcon = ({ size = 18, color, ...p }: IconProps) => {
  const active = color && color !== "currentColor";
  return (
    <svg {...svgProps(size, color)} {...p}>
      <rect
        x="3.5"
        y="3.5"
        width="17"
        height="17"
        rx="4"
        fill={active ? color : "none"}
        stroke={color ?? "currentColor"}
      />
      <path
        d="M8.2 12.2l2.6 2.6 5-5.4"
        stroke={active ? "#0A0A0A" : (color ?? "currentColor")}
        strokeWidth="2"
      />
    </svg>
  );
};

export const GoalsIcon = ({ size = 18, color, ...p }: IconProps) => (
  <svg {...svgProps(size, color)} {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <circle cx="12" cy="12" r="4.6" />
    <circle cx="12" cy="12" r="1.3" fill={color ?? "currentColor"} stroke="none" />
  </svg>
);

export const InsightsIcon = ({ size = 18, color, ...p }: IconProps) => (
  <svg {...svgProps(size, color)} {...p}>
    <path d="M4 20V13" />
    <path d="M9.7 20V9.5" />
    <path d="M15.4 20v-6" />
    <path d="M21 20V5.5" />
  </svg>
);

export const SettingsIcon = ({ size = 18, color, ...p }: IconProps) => (
  <svg {...svgProps(size, color)} {...p}>
    <circle cx="12" cy="12" r="3.1" />
    <path d="M19.5 12a7.5 7.5 0 0 0-.1-1.2l2-1.5-2-3.4-2.3 1a7.6 7.6 0 0 0-2-1.2L14.7 3H9.3l-.4 2.7a7.6 7.6 0 0 0-2 1.2l-2.3-1-2 3.4 2 1.5a7.6 7.6 0 0 0 0 2.4l-2 1.5 2 3.4 2.3-1a7.6 7.6 0 0 0 2 1.2l.4 2.7h5.4l.4-2.7a7.6 7.6 0 0 0 2-1.2l2.3 1 2-3.4-2-1.5c.06-.4.1-.8.1-1.2Z" />
  </svg>
);

/* ---------------- Actions ---------------- */

export const PlusIcon = ({ size = 16, color, ...p }: IconProps) => (
  <svg {...svgProps(size, color)} strokeWidth={2.2} {...p}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const CheckIcon = ({ size = 14, color, ...p }: IconProps) => (
  <svg {...svgProps(size, color)} strokeWidth={3.2} {...p}>
    <path d="M4.5 12.5l5 5L19.5 7" />
  </svg>
);

export const XIcon = ({ size = 16, color, ...p }: IconProps) => (
  <svg {...svgProps(size, color)} strokeWidth={2} {...p}>
    <path d="M18 6L6 18M6 6l12 12" />
  </svg>
);

export const ChevronLeftIcon = ({ size = 14, color, ...p }: IconProps) => (
  <svg {...svgProps(size, color)} strokeWidth={2} {...p}>
    <path d="M14.5 5.5 8 12l6.5 6.5" />
  </svg>
);

export const ChevronRightIcon = ({ size = 14, color, ...p }: IconProps) => (
  <svg {...svgProps(size, color)} strokeWidth={2} {...p}>
    <path d="M9.5 5.5 16 12l-6.5 6.5" />
  </svg>
);

export const ChevronDownIcon = ({ size = 12, color, ...p }: IconProps) => (
  <svg {...svgProps(size, color)} strokeWidth={2} {...p}>
    <path d="M5.5 9 12 15.5 18.5 9" />
  </svg>
);

export const PencilIcon = ({ size = 13, color, ...p }: IconProps) => (
  <svg {...svgProps(size, color)} {...p}>
    <path d="M12.5 20h8.5" />
    <path d="M16.6 3.6a2.1 2.1 0 0 1 3 3L7.5 18.7l-4 1.1 1.1-4Z" />
  </svg>
);

export const TrashIcon = ({ size = 13, color, ...p }: IconProps) => (
  <svg {...svgProps(size, color)} {...p}>
    <path d="M3.5 6.5h17M8.5 6.5V4.8a1.3 1.3 0 0 1 1.3-1.3h4.4a1.3 1.3 0 0 1 1.3 1.3v1.7" />
    <path d="M18.5 6.5 17.6 20a1.5 1.5 0 0 1-1.5 1.4H7.9A1.5 1.5 0 0 1 6.4 20L5.5 6.5" />
  </svg>
);

export const CopyIcon = ({ size = 13, color, ...p }: IconProps) => (
  <svg {...svgProps(size, color)} {...p}>
    <rect x="8.5" y="8.5" width="12" height="12" rx="2.5" />
    <path d="M16 8.5V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2.5" />
  </svg>
);

export const PinIcon = ({ size = 15, color, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color ?? "currentColor"} {...p}>
    <path d="M14.6 2.3a1 1 0 0 0-1.4 0l-.7.7a1 1 0 0 0 0 1.4l.3.3-4.3 3.6-2.6-.5a1 1 0 0 0-.9 1.7l3.6 3.6-4.2 5.5a.6.6 0 0 0 .9.8l5.4-4.2 3.6 3.6a1 1 0 0 0 1.7-.9l-.5-2.6 3.6-4.3.3.3a1 1 0 0 0 1.4-1.4Z" />
  </svg>
);

export const FreezeIcon = ({ size = 14, color = "#3B82F6", ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M12 2.5v19M3.7 7.2l16.6 9.6M20.3 7.2 3.7 16.8" />
    <path d="M9.6 4.4 12 6.8l2.4-2.4M9.6 19.6 12 17.2l2.4 2.4" />
  </svg>
);

export const TrendingUpIcon = ({ size = 14, color, ...p }: IconProps) => (
  <svg {...svgProps(size, color)} {...p}>
    <path d="M3 17.5 9 11l4 4 8-8.5" />
    <path d="M14.5 6.5H21v6.5" />
  </svg>
);

export const BrainIcon = ({ size = 14, color, ...p }: IconProps) => (
  <svg {...svgProps(size, color)} {...p}>
    <path d="M9.5 4a3 3 0 0 0-3 3v.6A3 3 0 0 0 4.6 12a3 3 0 0 0 1.9 4.4V17a3 3 0 0 0 3 3h.5V4Z" />
    <path d="M14.5 4a3 3 0 0 1 3 3v.6A3 3 0 0 1 19.4 12a3 3 0 0 1-1.9 4.4V17a3 3 0 0 1-3 3h-.5V4Z" />
  </svg>
);

export const TargetIcon = ({ size = 14, color, ...p }: IconProps) => (
  <svg {...svgProps(size, color)} {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <circle cx="12" cy="12" r="4.5" />
  </svg>
);

/* Emoji glyphs used in the reference UI */
export const FIRE = "🔥";
export const MEDALS = ["🥇", "🥈", "🥉"];

export const LIFE_AREA_EMOJI: Record<string, string> = {
  "Health & Fitness": "💪",
  "Career Growth": "📈",
  "Finances & Wealth": "💰",
  "Relationships": "❤️",
  "Romance & Love": "💗",
  "Spirituality": "✨",
  "Home": "🏠",
  "Adventure & Travel": "🧭",
  "Fun & Hobbies": "🎮",
  "Community": "🌐",
};

export const StarIcon = ({ size = 12, color = "#E8B93A", ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} {...p}>
    <path d="M12 2.6l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.5 6.1 20.6l1.2-6.5L2.5 9.5l6.6-.9Z" />
  </svg>
);

export const SparkleIcon = ({ size = 18, color, ...p }: IconProps) => (
  <svg {...svgProps(size, color)} {...p}>
    <path d="M12 3.5l1.9 5.4 5.4 1.9-5.4 1.9L12 18.1l-1.9-5.4-5.4-1.9 5.4-1.9Z" />
  </svg>
);