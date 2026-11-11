import type { ReactNode } from "react";

export type IconName =
  | "download"
  | "plus"
  | "save"
  | "reset"
  | "shield"
  | "user"
  | "users"
  | "key"
  | "idCard"
  | "link"
  | "checkbox"
  | "trophy"
  | "calendar"
  | "ticket"
  | "stadium"
  | "chart"
  | "ball"
  | "check"
  | "close"
  | "warning"
  | "info"
  | "scale"
  | "cube"
  | "modules"
  | "pencil"
  | "trash";

type IconProps = {
  name: IconName;
  className?: string;
  title?: string;
};

const ICONS: Record<IconName, ReactNode> = {
  download: (
    <>
      <path d="M4 16.5V18a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-1.5" />
      <path d="M12 4v12M8 12l4 4 4-4" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  save: (
    <>
      <path d="M5 5h11l3 3v11H5V5z" />
      <path d="M8 5v4h8V5M8 19v-6h8v6" />
    </>
  ),
  reset: (
    <>
      <path d="M4 12a8 8 0 0 1 13.7-5.7L20 8" />
      <path d="M20 4v4h-4M20 12a8 8 0 0 1-13.7 5.7L4 16" />
      <path d="M4 20v-4h4" />
    </>
  ),
  shield: <path d="M12 3 5 6v6c0 4.2 2.8 7.9 7 9 4.2-1.1 7-4.8 7-9V6l-7-3z" />,
  user: (
    <>
      <circle cx="12" cy="8" r="3.2" />
      <path d="M5 19c1.4-3.1 3.8-4.5 7-4.5S17.6 15.9 19 19" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="2.8" />
      <path d="M3.8 18.5c1.1-2.6 3-3.8 5.2-3.8 2.3 0 4.1 1.2 5.2 3.8" />
      <circle cx="16.2" cy="8.5" r="2.3" />
      <path d="M15 14.7c1.8.1 3.3 1.1 4.3 3.3" />
    </>
  ),
  key: (
    <>
      <circle cx="8" cy="14" r="3.2" />
      <path d="M11 14h9v3M16 14v3" />
    </>
  ),
  idCard: (
    <>
      <rect x="3" y="6" width="18" height="12" rx="2" />
      <circle cx="9" cy="12" r="1.8" />
      <path d="M13 11h5M13 14h4" />
    </>
  ),
  link: (
    <>
      <path d="M10 13a5 5 0 0 0 7.1.1l1.8-1.8a5 5 0 0 0-7.1-7.1L10.5 5.5" />
      <path d="M14 11a5 5 0 0 0-7.1-.1L5.1 12.7a5 5 0 0 0 7.1 7.1L13.5 18.5" />
    </>
  ),
  checkbox: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="3" />
      <path d="M8 12.2 10.6 15 16 9" />
    </>
  ),
  trophy: (
    <>
      <path d="M8 5h8v4a4 4 0 0 1-8 0V5z" />
      <path d="M8 7H5a3 3 0 0 0 3 3M16 7h3a3 3 0 0 1-3 3M12 13v3M9 20h6M10 20v-4h4v4" />
    </>
  ),
  calendar: (
    <>
      <rect x="4" y="6" width="16" height="14" rx="2" />
      <path d="M4 10h16M8 4v4M16 4v4" />
    </>
  ),
  ticket: (
    <>
      <path d="M4 8a2 2 0 0 0 2-2h12a2 2 0 0 0 2 2v8a2 2 0 0 0-2 2H6a2 2 0 0 0-2-2V8z" />
      <path d="M12 8v8" />
    </>
  ),
  stadium: (
    <>
      <path d="M4 18V9l8-4 8 4v9" />
      <path d="M4 14c2.5 1.5 5.2 2.2 8 2.2S17.5 15.5 20 14" />
      <path d="M9 18h6" />
    </>
  ),
  chart: (
    <>
      <path d="M5 19V9M12 19V5M19 19v-7" />
      <path d="M3 19h18" />
    </>
  ),
  ball: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 4c2 2.5 3 5.2 3 8s-1 5.5-3 8M12 4c-2 2.5-3 5.2-3 8s1 5.5 3 8M4.5 9.5h15M4.5 14.5h15" />
    </>
  ),
  check: <path d="M5.5 12.5 10 17l8.5-9" />,
  close: <path d="M7 7l10 10M17 7 7 17" />,
  warning: (
    <>
      <path d="M12 4 3.5 19h17L12 4z" />
      <path d="M12 10v4M12 16.5v.5" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 11v5M12 8v.5" />
    </>
  ),
  scale: (
    <>
      <path d="M12 4v16M7 20h10" />
      <path d="M12 7h7l-2.2 4.5A3 3 0 0 1 14 13h-2M12 7H5l2.2 4.5A3 3 0 0 0 10 13h2" />
    </>
  ),
  cube: (
    <>
      <path d="M12 4 20 8.5v7L12 20 4 15.5v-7L12 4z" />
      <path d="M12 20v-7M4 8.5 12 13l8-4.5" />
    </>
  ),
  modules: (
    <>
      <rect x="4" y="4" width="6.5" height="6.5" rx="1.2" />
      <rect x="13.5" y="4" width="6.5" height="6.5" rx="1.2" />
      <rect x="4" y="13.5" width="6.5" height="6.5" rx="1.2" />
      <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.2" />
    </>
  ),
  pencil: (
    <>
      <path d="M4 16.5 14.5 6a1.8 1.8 0 0 1 2.5 0l1 1a1.8 1.8 0 0 1 0 2.5L7.5 20H4v-3.5z" />
      <path d="M13 7.5 16.5 11" />
    </>
  ),
  trash: (
    <>
      <path d="M5 8h14M10 8V6h4v2M7 8l1 12h8l1-12" />
    </>
  ),
};

const Icon = ({ name, className = "h-4 w-4", title }: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden={title ? undefined : true}
    role={title ? "img" : undefined}
    aria-label={title}
  >
    {ICONS[name]}
  </svg>
);

export default Icon;
