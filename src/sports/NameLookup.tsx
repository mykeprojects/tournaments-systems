import { useEffect, useId, useRef, useState } from "react";

export type NameOption = {
  id: string;
  label: string;
  hint?: string;
};

type NameLookupProps = {
  text: string;
  onTextChange: (value: string) => void;
  options: NameOption[];
  onPick: (id: string) => void;
  placeholder: string;
  ariaLabel: string;
  invalid?: boolean;
};

export function NameLookup({
  text,
  onTextChange,
  options,
  onPick,
  placeholder,
  ariaLabel,
  invalid = false,
}: NameLookupProps) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [broad, setBroad] = useState(true);
  const [copied, setCopied] = useState("");

  useEffect(() => {
    if (!open) {
      return;
    }
    const close = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  useEffect(() => {
    if (!copied) {
      return;
    }
    const timer = window.setTimeout(() => setCopied(""), 1500);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const needle = text.trim().toLocaleLowerCase("es");
  const visible =
    broad || !needle
      ? options
      : options.filter((option) =>
          `${option.label} ${option.hint ?? ""}`.toLocaleLowerCase("es").includes(needle)
        );

  const copyName = async (name: string) => {
    const value = name.trim();
    if (!value) {
      return;
    }
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      const area = document.createElement("textarea");
      area.value = value;
      area.setAttribute("readonly", "");
      document.body.appendChild(area);
      area.select();
      document.execCommand("copy");
      area.remove();
    }
    setCopied(value);
  };

  return (
    <div ref={rootRef} className="relative mt-1.5">
      <div
        className={`flex items-center rounded-lg border bg-[#06101c] ${
          invalid ? "border-red-400" : "border-[#245078] focus-within:border-[#3dff7a]"
        }`}
      >
        <input
          value={text}
          onChange={(event) => {
            onTextChange(event.target.value);
            setBroad(false);
            setOpen(true);
          }}
          onFocus={() => {
            setBroad(true);
            setOpen(true);
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setOpen(false);
            }
          }}
          placeholder={placeholder}
          aria-label={ariaLabel}
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          role="combobox"
          className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-500"
        />
        <button
          type="button"
          aria-label={text.trim() ? `Copiar nombre ${text.trim()}` : "Copiar nombre"}
          title={copied && copied === text.trim() ? "Nombre copiado" : "Copiar nombre"}
          disabled={!text.trim()}
          onClick={() => void copyName(text)}
          className="px-2 text-slate-300 transition hover:text-[#3dff7a] disabled:cursor-not-allowed disabled:opacity-40"
        >
          <CopyIcon />
        </button>
        <button
          type="button"
          aria-label={open ? "Ocultar lista" : "Mostrar lista"}
          onClick={() => {
            setBroad(true);
            setOpen((current) => !current);
          }}
          className="px-2 text-slate-300 transition hover:text-white"
        >
          <ChevronIcon />
        </button>
      </div>
      {copied && (
        <p role="status" className="sr-only">
          Nombre copiado: {copied}
        </p>
      )}
      {open && (
        <ul
          id={listId}
          role="listbox"
          aria-label={ariaLabel}
          className="absolute z-30 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-[#1b3f63] bg-[#071321] py-1 shadow-[0_12px_40px_rgba(0,0,0,0.35)]"
        >
          {visible.length === 0 ? (
            <li className="px-3 py-2 text-sm text-slate-400">Sin resultados</li>
          ) : (
            visible.map((option) => (
              <li key={option.id} className="flex items-center gap-1 pr-1">
                <button
                  type="button"
                  role="option"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    onPick(option.id);
                    setOpen(false);
                  }}
                  className="min-w-0 flex-1 px-3 py-2 text-left text-sm hover:bg-white/5"
                >
                  <span className="block truncate font-semibold text-white">{option.label}</span>
                  {option.hint && <span className="block truncate text-xs text-slate-400">{option.hint}</span>}
                </button>
                <button
                  type="button"
                  aria-label={`Copiar nombre ${option.label}`}
                  title={copied === option.label ? "Nombre copiado" : "Copiar nombre"}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => void copyName(option.label)}
                  className="rounded-lg px-2 py-2 text-slate-300 transition hover:bg-white/5 hover:text-[#3dff7a]"
                >
                  <CopyIcon />
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}

function CopyIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <rect x="9" y="9" width="10" height="10" rx="2" />
      <path d="M5 15V6a1 1 0 0 1 1-1h9" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}
