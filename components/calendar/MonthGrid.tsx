"use client";
import type { EventRow } from "@/lib/types";
import { getMonthMatrix, toISODate, isSameDay } from "@/lib/date";
import { DayCell } from "./DayCell";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

export function MonthGrid({
  year, month, events, selectedDate, onSelectDate,
}: {
  year: number;
  month: number;
  events: EventRow[];
  selectedDate: Date;
  onSelectDate: (d: Date) => void;
}) {
  const matrix = getMonthMatrix(year, month);
  const today = new Date();
  const byDate = new Map<string, EventRow[]>();
  for (const e of events) {
    const arr = byDate.get(e.date) ?? [];
    arr.push(e);
    byDate.set(e.date, arr);
  }

  return (
    <div className="px-3">
      <div className="grid grid-cols-7 text-center text-xs text-pastel-ink/50 mb-1">
        {WEEKDAYS.map((w) => <div key={w}>{w}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {matrix.flat().map((d) => (
          <DayCell
            key={toISODate(d)}
            date={d}
            events={byDate.get(toISODate(d)) ?? []}
            isSelected={isSameDay(d, selectedDate)}
            isToday={isSameDay(d, today)}
            inMonth={d.getMonth() === month}
            onClick={() => onSelectDate(d)}
          />
        ))}
      </div>
    </div>
  );
}
