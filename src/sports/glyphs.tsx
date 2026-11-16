import type { ReactNode } from "react";
import type { SkillGlyph } from "./types";

type IconProps = { className?: string };

function Svg({ className, children }: IconProps & { children: ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
      {children}
    </svg>
  );
}

export function BallIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <Svg className={className}>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 4.2 14.2 9h4.2l-3.4 2.6 1.3 4.2L12 13.4 7.7 15.8l1.3-4.2L5.6 9h4.2L12 4.2Z" />
    </Svg>
  );
}

export function TeamsIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <Svg className={className}>
      <circle cx="8" cy="9" r="2.2" />
      <circle cx="16" cy="9" r="2.2" />
      <path d="M4.5 18c.6-2.2 2.2-3.4 3.5-3.4S11 15.8 11.5 18M12.5 18c.6-2.2 2.2-3.4 3.5-3.4s2.9 1.2 3.5 3.4" />
    </Svg>
  );
}

export function UsersIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <Svg className={className}>
      <circle cx="9" cy="8" r="2.4" />
      <circle cx="16" cy="9" r="2" />
      <path d="M4.5 18c.5-2.4 2.2-3.6 4.5-3.6s4 .1 4.5 3.6M13 14.6c1.2-.4 2.4-.5 3.4-.5 1.8 0 3.2.9 3.8 2.9" />
    </Svg>
  );
}

export function ShieldIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M12 3.5 19 6.2v5.2c0 4.2-2.8 6.8-7 8.6-4.2-1.8-7-4.4-7-8.6V6.2L12 3.5Z" />
      <path d="m9 12 2 2 4-4" />
    </Svg>
  );
}

export function PlayerIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <Svg className={className}>
      <circle cx="12" cy="8" r="3" />
      <path d="M6 19c1-3 3.2-4.5 6-4.5S17 16 18 19" />
    </Svg>
  );
}

export function StarIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <Svg className={className}>
      <path d="m12 4 1.8 4.2L18.4 9l-3.2 2.9.9 4.6L12 14.8 7.9 16.5l.9-4.6L5.6 9l4.6-.8L12 4Z" />
    </Svg>
  );
}

export function ChartIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M5 19V9M10 19V5M15 19v-7M20 19V8" />
    </Svg>
  );
}

export function EyeIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M3 12s3.2-5 9-5 9 5 9 5-3.2 5-9 5-9-5-9-5Z" />
      <circle cx="12" cy="12" r="2" />
    </Svg>
  );
}

export function PencilIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M4 20h4l10-10-4-4L4 16v4Z" />
      <path d="m13 7 4 4" />
    </Svg>
  );
}

export function TrashIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M5 7h14M9 7V5h6v2M8 7l.7 12h6.6L16 7" />
    </Svg>
  );
}

export function SkillMark({ glyph, className = "h-5 w-5" }: { glyph: SkillGlyph; className?: string }) {
  if (glyph === "run") {
    return (
      <Svg className={className}>
        <circle cx="14" cy="5" r="1.6" />
        <path d="m8 21 3-6 2 2 3-1M10 10l3 2 3-2 2 3" />
      </Svg>
    );
  }
  if (glyph === "heart") {
    return (
      <Svg className={className}>
        <path d="M12 19s-6-3.6-6-8a3.4 3.4 0 0 1 6-1.6A3.4 3.4 0 0 1 18 11c0 4.4-6 8-6 8Z" />
      </Svg>
    );
  }
  if (glyph === "shield") {
    return (
      <Svg className={className}>
        <path d="M12 3 6 6v6c0 4 2.6 6.4 6 8 3.4-1.6 6-4 6-8V6l-6-3Z" />
      </Svg>
    );
  }
  if (glyph === "eye") {
    return <EyeIcon className={className} />;
  }
  if (glyph === "crown") {
    return (
      <Svg className={className}>
        <path d="m4 16 2-8 6 4 6-4 2 8H4Z" />
      </Svg>
    );
  }
  if (glyph === "target") {
    return (
      <Svg className={className}>
        <circle cx="12" cy="12" r="7" />
        <circle cx="12" cy="12" r="3" />
        <path d="M12 3v2M12 19v2M3 12h2M19 12h2" />
      </Svg>
    );
  }
  return <BallIcon className={className} />;
}

export function SportMark({ name, className = "h-5 w-5" }: { name: string; className?: string }) {
  const key = name.toLocaleLowerCase("es");
  if (key.includes("baloncesto")) {
    return (
      <Svg className={className}>
        <circle cx="12" cy="12" r="8" />
        <path d="M12 4v16M4 12h16M7 7c2 2 3 3.2 5 5M17 7c-2 2-3 3.2-5 5" />
      </Svg>
    );
  }
  if (key.includes("voleibol") || key.includes("natación") || key.includes("natacion")) {
    return (
      <Svg className={className}>
        <circle cx="12" cy="12" r="8" />
        <path d="M5 14c2-2 4-2 7 0s5 2 7 0" />
      </Svg>
    );
  }
  if (key.includes("tenis")) {
    return (
      <Svg className={className}>
        <circle cx="8" cy="15" r="3" />
        <path d="m10 13 8-8M16 4l3 3" />
      </Svg>
    );
  }
  return <BallIcon className={className} />;
}
