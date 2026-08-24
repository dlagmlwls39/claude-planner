import { describe, it, expect } from "vitest";
import { getMonthMatrix, toISODate, isSameDay, getYearOptions } from "@/lib/date";

describe("date utils", () => {
  it("toISODate: 로컬 날짜를 YYYY-MM-DD로 포맷", () => {
    expect(toISODate(new Date(2026, 6, 10))).toBe("2026-07-10");
  });

  it("isSameDay: 같은 날이면 true", () => {
    expect(isSameDay(new Date(2026, 6, 10, 9), new Date(2026, 6, 10, 22))).toBe(true);
    expect(isSameDay(new Date(2026, 6, 10), new Date(2026, 6, 11))).toBe(false);
  });

  it("getMonthMatrix: 6주 x 7일 그리드, 일요일 시작", () => {
    const m = getMonthMatrix(2026, 6); // 2026년 7월
    expect(m).toHaveLength(6);
    expect(m[0]).toHaveLength(7);
    // 2026-07-01은 수요일 → 첫 주 첫 칸(일요일)은 6/28
    expect(toISODate(m[0][0])).toBe("2026-06-28");
  });

  it("getYearOptions: 현재 연도 기준으로 빠른 이동용 연도 범위를 제공", () => {
    const years = getYearOptions(2026);
    expect(years[0]).toBe(2016);
    expect(years[years.length - 1]).toBe(2036);
    expect(years).toContain(2026);
  });
});
