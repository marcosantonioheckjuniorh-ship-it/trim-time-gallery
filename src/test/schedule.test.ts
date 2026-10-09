import { describe, expect, it } from "vitest";
import { DEFAULT_HOURS, slotsFor, hoursLabel } from "@/lib/schedule";

const cfg = (special = {}) => ({ hours: DEFAULT_HOURS, special });

describe("schedule", () => {
  it("monday opens at 13:30 and last slot is 19:30", () => {
    const s = slotsFor("2026-10-12", cfg());
    expect(s[0]).toBe("13:30");
    expect(s.at(-1)).toBe("19:30");
  });
  it("saturday runs 08:00 to 15:00", () => {
    const s = slotsFor("2026-10-10", cfg());
    expect(s[0]).toBe("08:00");
    expect(s.at(-1)).toBe("14:30");
  });
  it("sunday is closed", () => {
    expect(slotsFor("2026-10-11", cfg())).toEqual([]);
  });
  it("a holiday closes a normal working day", () => {
    expect(slotsFor("2026-10-13", cfg({ "2026-10-13": { open: null, close: null, reason: "Feriado" } }))).toEqual([]);
  });
  it("special hours override the weekday hours", () => {
    const s = slotsFor("2026-10-13", cfg({ "2026-10-13": { open: "10:00", close: "12:00", reason: "" } }));
    expect(s).toEqual(["10:00", "10:30", "11:00", "11:30"]);
  });
  it("labels group tuesday to friday", () => {
    expect(hoursLabel(DEFAULT_HOURS)).toContain("Ter a Sex · 9h às 20h");
  });
});
