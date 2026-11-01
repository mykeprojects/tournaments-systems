const WEEKDAY_LABELS = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sá", "Do"];
const MONTH_LABELS = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

export const parseISODate = (value: string): Date | null => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
};

export const toISODate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const formatDisplayDate = (value: string): string => {
  const date = parseISODate(value);
  if (!date) {
    return "Selecciona una fecha";
  }

  return `${String(date.getDate()).padStart(2, "0")}/${String(
    date.getMonth() + 1
  ).padStart(2, "0")}/${date.getFullYear()}`;
};

export const startOfMonth = (date: Date): Date =>
  new Date(date.getFullYear(), date.getMonth(), 1);

export const addMonths = (date: Date, amount: number): Date =>
  new Date(date.getFullYear(), date.getMonth() + amount, 1);

export const isSameDay = (left: Date, right: Date): boolean =>
  left.getFullYear() === right.getFullYear() &&
  left.getMonth() === right.getMonth() &&
  left.getDate() === right.getDate();

export const isAfterDay = (date: Date, limit: Date): boolean => {
  const current = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const maximum = new Date(limit.getFullYear(), limit.getMonth(), limit.getDate());
  return current.getTime() > maximum.getTime();
};

export const monthLabel = (date: Date): string =>
  `${MONTH_LABELS[date.getMonth()]} ${date.getFullYear()}`;

export const monthOptions = (): string[] => MONTH_LABELS;

export const yearOptions = (max: Date, minYear = 1920): number[] => {
  const years: number[] = [];
  for (let year = max.getFullYear(); year >= minYear; year -= 1) {
    years.push(year);
  }
  return years;
};

export const weekdayLabels = (): string[] => WEEKDAY_LABELS;

export const calendarCells = (month: Date): Array<Date | null> => {
  const firstDay = startOfMonth(month);
  const leadingEmpty = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(
    firstDay.getFullYear(),
    firstDay.getMonth() + 1,
    0
  ).getDate();
  const cells: Array<Date | null> = Array.from(
    { length: leadingEmpty },
    () => null
  );

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(new Date(firstDay.getFullYear(), firstDay.getMonth(), day));
  }

  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  return cells;
};
