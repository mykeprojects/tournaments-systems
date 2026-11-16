type Axis = {
  label: string;
  value: number;
  average?: number | null;
};

export function RadarChart({ axes }: { axes: Axis[] }) {
  const size = 280;
  const center = size / 2;
  const radius = 78;
  const point = (index: number, scale: number) => {
    const angle = -Math.PI / 2 + (index * 2 * Math.PI) / axes.length;
    return [center + Math.cos(angle) * radius * scale, center + Math.sin(angle) * radius * scale] as const;
  };
  const polygon = (scaleFor: (axis: Axis) => number) =>
    axes.map((axis, index) => point(index, scaleFor(axis)).join(",")).join(" ");

  if (axes.length < 3) {
    return null;
  }

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="mx-auto h-64 w-full max-w-xs">
      {[0.25, 0.5, 0.75, 1].map((level) => (
        <polygon key={level} points={polygon(() => level)} fill="none" stroke="rgba(148,163,184,0.28)" />
      ))}
      {axes.map((axis, index) => {
        const [x, y] = point(index, 1);
        const [labelX, labelY] = point(index, 1.28);
        return (
          <g key={axis.label}>
            <line x1={center} y1={center} x2={x} y2={y} stroke="rgba(148,163,184,0.28)" />
            <text x={labelX} y={labelY} textAnchor="middle" dominantBaseline="middle" fill="#e2e8f0" fontSize="11">
              {axis.label}
            </text>
            <text x={labelX} y={labelY + 13} textAnchor="middle" fill="#3dff7a" fontSize="12" fontWeight="700">
              {axis.value}
            </text>
          </g>
        );
      })}
      <polygon
        points={polygon((axis) => Math.min(1, (axis.average ?? 0) / 100))}
        fill="none"
        stroke="rgba(226,232,240,0.7)"
        strokeDasharray="4 4"
      />
      <polygon
        points={polygon((axis) => Math.min(1, axis.value / 100))}
        fill="rgba(56,189,248,0.28)"
        stroke="#38bdf8"
        strokeWidth="2"
      />
    </svg>
  );
}

export function ScoreBars({ items }: { items: { label: string; value: number }[] }) {
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item.label} className="grid grid-cols-[92px_minmax(0,1fr)_28px] items-center gap-2 text-xs">
          <span className="truncate text-slate-300">{item.label}</span>
          <span className="h-2 overflow-hidden rounded-full bg-white/10">
            <span className="block h-full rounded-full bg-[#3dff7a]" style={{ width: `${Math.max(0, Math.min(100, item.value))}%` }} />
          </span>
          <span className="text-right font-bold text-white">{item.value}</span>
        </li>
      ))}
    </ul>
  );
}
