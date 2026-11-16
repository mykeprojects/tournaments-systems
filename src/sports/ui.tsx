import { useState, type ReactNode } from "react";
import { EyeIcon, PencilIcon, TrashIcon } from "./glyphs";
import { initials } from "./format";

export type NoticeTone = "ok" | "error" | "warn";

export type Notice = {
  tone: NoticeTone;
  title?: string;
  message: string;
};

export function Panel({
  title,
  extra,
  children,
  className = "",
}: {
  title?: string;
  extra?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-2xl border border-[#1b3f63] bg-[#071321]/95 shadow-[0_12px_40px_rgba(0,0,0,0.25)] ${className}`}>
      {(title || extra) && (
        <header className="flex items-center justify-between gap-3 border-b border-white/5 px-4 py-3">
          {title ? <h2 className="text-sm font-bold text-white">{title}</h2> : <span />}
          {extra}
        </header>
      )}
      {children}
    </section>
  );
}

export function PageHeader({
  icon,
  title,
  subtitle,
  actions,
}: {
  icon: ReactNode;
  title: string;
  subtitle: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#3dff7a]/30 bg-[#3dff7a]/10 text-[#3dff7a]">
          {icon}
        </span>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white">{title}</h1>
          <p className="mt-1 text-sm text-slate-400">{subtitle}</p>
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
    </div>
  );
}

export function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="sports-modal-title"
        className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-2xl border border-[#1e4468] bg-[#071422] p-6 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between gap-3">
          <h2 id="sports-modal-title" className="text-lg font-bold">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="rounded-lg border border-white/10 px-2 py-1 text-slate-300">
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function NoticeBanner({ notice, onClose }: { notice: Notice | null; onClose: () => void }) {
  if (!notice) {
    return null;
  }
  const toneClass =
    notice.tone === "ok"
      ? "border-emerald-400/40 bg-[#062216] text-emerald-100"
      : notice.tone === "warn"
        ? "border-amber-300/40 bg-[#2a1c06] text-amber-100"
        : "border-red-400/50 bg-[#2a0c12] text-red-100";
  const position = notice.tone === "ok" ? "top-24" : "bottom-6";
  return (
    <div className={`fixed right-6 z-[70] w-[min(100%-2rem,24rem)] rounded-xl border px-4 py-3 shadow-2xl ${position} ${toneClass}`} role={notice.tone === "ok" ? "status" : "alert"}>
      <div className="flex items-start justify-between gap-3">
        <div>
          {notice.title && <p className="text-sm font-bold">{notice.title}</p>}
          <p className="text-sm leading-5">{notice.message}</p>
        </div>
        <button type="button" onClick={onClose} aria-label="Cerrar aviso" className="text-lg leading-none">
          ×
        </button>
      </div>
    </div>
  );
}

export function Field({
  label,
  required = false,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="block text-xs font-semibold text-slate-300">
      <span>
        {label}
        {required && <span className="text-red-400"> *</span>}
      </span>
      {children}
      {error && <span className="mt-1 block font-medium text-red-400">{error}</span>}
    </label>
  );
}

export function StatusPill({ status }: { status: "activo" | "inactivo" }) {
  const active = status === "activo";
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${active ? "bg-emerald-400/15 text-emerald-300" : "bg-slate-500/20 text-slate-300"}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${active ? "bg-emerald-300" : "bg-slate-400"}`} />
      {active ? "Activo" : "Inactivo"}
    </span>
  );
}

export function IconButton({
  label,
  tone,
  onClick,
}: {
  label: string;
  tone: "view" | "edit" | "delete";
  onClick: () => void;
}) {
  const toneClass =
    tone === "view"
      ? "border-cyan-400/40 text-cyan-300 hover:bg-cyan-400/10"
      : tone === "edit"
        ? "border-sky-400/40 text-sky-300 hover:bg-sky-400/10"
        : "border-red-400/40 text-red-300 hover:bg-red-400/10";
  return (
    <button type="button" aria-label={label} title={label} onClick={onClick} className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border ${toneClass}`}>
      {tone === "view" ? <EyeIcon /> : tone === "edit" ? <PencilIcon /> : <TrashIcon />}
    </button>
  );
}

export function Crest({ name, color, large = false }: { name: string; color: string; large?: boolean }) {
  return (
    <span
      className={`flex items-center justify-center rounded-xl font-black text-white ${large ? "h-24 w-24 text-xl" : "h-10 w-10 text-xs"}`}
      style={{ background: `linear-gradient(160deg, ${color}, #07111d 78%)`, boxShadow: `inset 0 0 0 1px ${color}` }}
    >
      {initials(name)}
    </span>
  );
}

export function Avatar({ name }: { name: string }) {
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-slate-500 to-slate-800 text-xs font-bold text-white">
      {initials(name)}
    </span>
  );
}

export function Pager({
  page,
  pageCount,
  from,
  to,
  total,
  onPage,
}: {
  page: number;
  pageCount: number;
  from: number;
  to: number;
  total: number;
  onPage: (page: number) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-t border-white/5 px-4 py-3 text-xs text-slate-400">
      <span>Mostrando {from} a {to} de {total}</span>
      <div className="flex items-center gap-1">
        <button type="button" disabled={page <= 1} onClick={() => onPage(page - 1)} className="rounded-md border border-white/10 px-2 py-1 disabled:opacity-40">‹</button>
        <span className="rounded-md bg-[#3dff7a] px-2 py-1 font-bold text-[#04210f]">{page}</span>
        <button type="button" disabled={page >= pageCount} onClick={() => onPage(page + 1)} className="rounded-md border border-white/10 px-2 py-1 disabled:opacity-40">›</button>
      </div>
    </div>
  );
}

export function usePaged<T>(items: T[], pageSize: number, resetKey = "") {
  const [page, setPage] = useState(1);
  const [seenKey, setSeenKey] = useState(resetKey);
  const activePage = seenKey === resetKey ? page : 1;
  if (seenKey !== resetKey) {
    setSeenKey(resetKey);
    setPage(1);
  }
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(activePage, pageCount);
  const start = (safePage - 1) * pageSize;
  return {
    page: safePage,
    setPage,
    pageCount,
    current: items.slice(start, start + pageSize),
    from: items.length === 0 ? 0 : start + 1,
    to: Math.min(start + pageSize, items.length),
    total: items.length,
  };
}

export function EmptyNote({ children }: { children: ReactNode }) {
  return <p className="px-4 py-8 text-center text-sm text-slate-400">{children}</p>;
}
