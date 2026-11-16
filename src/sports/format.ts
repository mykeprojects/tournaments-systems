export const fieldClass = (invalid = false) =>
  `mt-1.5 w-full rounded-lg border bg-[#06101c] px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-[#3dff7a] ${
    invalid ? "border-red-400" : "border-[#245078]"
  }`;

export const primaryButtonClass =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-[#3dff7a] px-4 py-2.5 text-sm font-extrabold text-[#04210f] transition hover:bg-[#62ff96] disabled:cursor-not-allowed disabled:opacity-60";

export const ghostButtonClass =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-[#245078] px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-[#3dff7a]/50";

export function formatDate(iso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) {
    return iso;
  }
  return `${match[3]}/${match[2]}/${match[1]}`;
}

export function todayIso(): string {
  const date = new Date();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export function addYears(iso: string, years: number): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) {
    return iso;
  }
  return `${Number(match[1]) + years}-${match[2]}-${match[3]}`;
}

export function uid(prefix: string): string {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
}

export function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function displayPerson(email: string | undefined): string {
  if (!email) {
    return "Carlos Ramírez";
  }
  const local = email.split("@")[0] ?? "";
  if (local.replace(/\./g, "").toLowerCase().includes("carlos")) {
    return "Carlos Ramírez";
  }
  return local
    .replace(/[._]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}
