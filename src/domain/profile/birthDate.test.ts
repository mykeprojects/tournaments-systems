import { describe, expect, it } from "vitest";
import {
  calendarCells,
  formatDisplayDate,
  parseISODate,
  toISODate,
} from "./birthDate";

describe("birthDate", () => {
  it("parses and formats a valid ISO date", () => {
    const date = parseISODate("2001-03-15");
    expect(date).not.toBeNull();
    expect(toISODate(date as Date)).toBe("2001-03-15");
    expect(formatDisplayDate("2001-03-15")).toBe("15/03/2001");
  });

  it("rejects invalid dates", () => {
    expect(parseISODate("2001-02-31")).toBeNull();
    expect(formatDisplayDate("")).toBe("Selecciona una fecha");
  });

  it("builds a Monday-first month grid", () => {
    const cells = calendarCells(new Date(2026, 2, 1));
    expect(cells[0]).toBeNull();
    expect(cells[6]?.getDate()).toBe(1);
    expect(cells.filter(Boolean)).toHaveLength(31);
  });
});
