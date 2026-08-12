import { describe, expect, it } from "vitest";

import {
  addWeeks,
  currentWeekStart,
  formatWeekLabel,
  mondayOf,
  parseWeekStart,
  resolveWeekStart,
  weekDays,
} from "./week";

const utc = (value: string) => new Date(`${value}T00:00:00.000Z`);

describe("mondayOf", () => {
  it.each([
    ["a Monday stays put", "2026-08-10", "2026-08-10"],
    ["a mid-week day walks back", "2026-08-12", "2026-08-10"],
    [
      "a Sunday belongs to the week that began six days earlier",
      "2026-08-16",
      "2026-08-10",
    ],
    ["a Saturday", "2026-08-15", "2026-08-10"],
  ])("%s", (_label, input, expected) => {
    expect(mondayOf(utc(input))).toBe(expected);
  });

  it("crosses a month boundary", () => {
    expect(mondayOf(utc("2026-08-01"))).toBe("2026-07-27");
  });

  it("crosses a year boundary", () => {
    expect(mondayOf(utc("2026-01-01"))).toBe("2025-12-29");
  });
});

describe("parseWeekStart", () => {
  it.each([
    ["gibberish", "not-a-date"],
    ["a partial date", "2026-08"],
    ["nothing", null],
  ])("rejects %s", (_label, value) => {
    expect(parseWeekStart(value)).toBeNull();
  });

  it("accepts an ISO date", () => {
    expect(parseWeekStart("2026-08-10")?.toISOString()).toBe(
      "2026-08-10T00:00:00.000Z",
    );
  });
});

describe("resolveWeekStart", () => {
  it("normalises any day to its Monday", () => {
    expect(resolveWeekStart("2026-08-13")).toBe("2026-08-10");
  });

  it("falls back to the current week for junk", () => {
    expect(resolveWeekStart("../../etc/passwd")).toBe(currentWeekStart());
  });
});

describe("addWeeks", () => {
  it("moves forward and back", () => {
    expect(addWeeks("2026-08-10", 1)).toBe("2026-08-17");
    expect(addWeeks("2026-08-10", -1)).toBe("2026-08-03");
  });

  it("survives a daylight-saving transition", () => {
    // Europe changes clocks on 2026-03-29; UTC arithmetic must not drift.
    expect(addWeeks("2026-03-23", 1)).toBe("2026-03-30");
  });
});

describe("weekDays", () => {
  it("returns seven consecutive days starting on Monday", () => {
    const days = weekDays("2026-08-10");

    expect(days).toHaveLength(7);
    expect(days[0]).toMatchObject({
      index: 0,
      label: "Monday",
      date: "2026-08-10",
      dateLabel: "August 10",
    });
    expect(days[6]).toMatchObject({
      index: 6,
      label: "Sunday",
      date: "2026-08-16",
    });
  });
});

describe("formatWeekLabel", () => {
  it("collapses the month when the week does not cross one", () => {
    expect(formatWeekLabel("2026-08-10")).toBe("Aug 10 – 16");
  });

  it("keeps both months when the week straddles them", () => {
    expect(formatWeekLabel("2026-07-27")).toBe("Jul 27 – Aug 2");
  });
});
