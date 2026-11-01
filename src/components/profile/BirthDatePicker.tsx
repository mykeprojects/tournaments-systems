import { useEffect, useMemo, useRef, useState } from "react";
import {
  calendarCells,
  formatDisplayDate,
  isAfterDay,
  isSameDay,
  monthOptions,
  parseISODate,
  startOfMonth,
  toISODate,
  weekdayLabels,
  yearOptions,
} from "../../domain/profile/birthDate";

type BirthDatePickerProps = {
  id: string;
  value: string;
  max: string;
  required?: boolean;
  inputClassName: string;
  onChange: (value: string) => void;
};

type PopoverPosition = {
  top: number;
  left: number;
};

const POPOVER_WIDTH = 280;
const POPOVER_HEIGHT = 268;
const VIEWPORT_GAP = 8;

const defaultVisibleMonth = (value: string, max: string): Date => {
  return (
    parseISODate(value) ??
    parseISODate(max) ??
    new Date(new Date().getFullYear() - 18, 0, 1)
  );
};

const positionPopover = (trigger: DOMRect): PopoverPosition => {
  const spaceBelow = window.innerHeight - trigger.bottom;
  const openBelow = spaceBelow >= POPOVER_HEIGHT + VIEWPORT_GAP;
  const top = openBelow
    ? trigger.bottom + VIEWPORT_GAP
    : trigger.top - VIEWPORT_GAP - POPOVER_HEIGHT;
  const left = trigger.right - POPOVER_WIDTH;

  return {
    top: Math.min(
      Math.max(VIEWPORT_GAP, top),
      window.innerHeight - POPOVER_HEIGHT - VIEWPORT_GAP
    ),
    left: Math.min(
      Math.max(VIEWPORT_GAP, left),
      window.innerWidth - POPOVER_WIDTH - VIEWPORT_GAP
    ),
  };
};

const BirthDatePicker = ({
  id,
  value,
  max,
  required,
  inputClassName,
  onChange,
}: BirthDatePickerProps) => {
  const selectedDate = parseISODate(value);
  const maxDate = parseISODate(max) ?? new Date();
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [popoverPosition, setPopoverPosition] = useState<PopoverPosition | null>(
    null
  );
  const [visibleMonth, setVisibleMonth] = useState(() =>
    startOfMonth(defaultVisibleMonth(value, max))
  );

  const updatePosition = () => {
    const trigger = triggerRef.current?.getBoundingClientRect();
    if (trigger) {
      setPopoverPosition(positionPopover(trigger));
    }
  };

  useEffect(() => {
    const nextSelected = parseISODate(value);
    if (nextSelected) {
      setVisibleMonth(startOfMonth(nextSelected));
    }
  }, [value]);

  useEffect(() => {
    if (!isOpen) {
      setPopoverPosition(null);
      return;
    }

    updatePosition();

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    document.addEventListener("mousedown", handlePointerDown);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, [isOpen]);

  const cells = useMemo(() => calendarCells(visibleMonth), [visibleMonth]);
  const years = useMemo(() => yearOptions(maxDate), [maxDate]);

  const selectMonth = (monthIndex: number) => {
    setVisibleMonth(new Date(visibleMonth.getFullYear(), monthIndex, 1));
  };

  const selectYear = (year: number) => {
    setVisibleMonth(new Date(year, visibleMonth.getMonth(), 1));
  };

  return (
    <div ref={containerRef} className="relative">
      <input
        id={id}
        type="text"
        readOnly
        required={required}
        value={value}
        tabIndex={-1}
        className="sr-only"
        onChange={() => undefined}
      />
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className={`${inputClassName} flex items-center justify-between text-left`}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
      >
        <span className={value ? "text-white" : "text-slate-500"}>
          {formatDisplayDate(value)}
        </span>
        <span aria-hidden="true" className="ml-3 text-lime-300">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <rect
              x="3"
              y="5"
              width="18"
              height="16"
              rx="2"
              stroke="currentColor"
              strokeWidth="1.8"
            />
            <path
              d="M3 10h18M8 3v4M16 3v4"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        </span>
      </button>
      {isOpen && popoverPosition && (
        <div
          role="dialog"
          aria-label="Calendario"
          style={{
            top: popoverPosition.top,
            left: popoverPosition.left,
            width: POPOVER_WIDTH,
          }}
          className="fixed z-50 rounded-xl border border-slate-700 bg-[#0b1711] p-3 shadow-2xl"
        >
          <div className="mb-2 grid grid-cols-2 gap-2">
            <label className="sr-only" htmlFor={`${id}-month`}>
              Mes
            </label>
            <select
              id={`${id}-month`}
              value={visibleMonth.getMonth()}
              onChange={(event) => selectMonth(Number(event.target.value))}
              className="rounded-lg border border-slate-700 bg-[#07110d] px-2 py-1.5 text-xs text-white"
            >
              {monthOptions().map((month, index) => (
                <option key={month} value={index}>
                  {month}
                </option>
              ))}
            </select>
            <label className="sr-only" htmlFor={`${id}-year`}>
              Año
            </label>
            <select
              id={`${id}-year`}
              value={visibleMonth.getFullYear()}
              onChange={(event) => selectYear(Number(event.target.value))}
              className="rounded-lg border border-slate-700 bg-[#07110d] px-2 py-1.5 text-xs text-white"
            >
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-7 gap-0.5 text-center text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            {weekdayLabels().map((label) => (
              <span key={label}>{label}</span>
            ))}
          </div>
          <div className="mt-1 grid grid-cols-7 gap-0.5">
            {cells.map((day, index) => {
              if (!day) {
                return <span key={`empty-${index}`} />;
              }

              const iso = toISODate(day);
              const disabled = isAfterDay(day, maxDate);
              const selected = Boolean(selectedDate && isSameDay(day, selectedDate));

              return (
                <button
                  key={iso}
                  type="button"
                  disabled={disabled}
                  onClick={() => {
                    onChange(iso);
                    setIsOpen(false);
                  }}
                  className={`h-7 rounded-md text-xs transition ${
                    selected
                      ? "bg-lime-400 font-bold text-[#102016]"
                      : disabled
                        ? "cursor-not-allowed text-slate-600"
                        : "text-slate-200 hover:bg-white/10"
                  }`}
                >
                  {day.getDate()}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default BirthDatePicker;
