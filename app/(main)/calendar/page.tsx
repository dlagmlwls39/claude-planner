"use client";
import { useEffect, useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase/client";
import { listMyEventsInRange } from "@/lib/supabase/events";
import { getMonthMatrix, toISODate, isSameDay, getYearOptions } from "@/lib/date";
import { MonthGrid } from "@/components/calendar/MonthGrid";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { DaySheet } from "@/components/calendar/DaySheet";
import type { EventRow } from "@/lib/types";

export default function CalendarPage() {
  const supabase = createBrowserSupabase();
  const [cursor, setCursor] = useState(new Date());
  const [selected, setSelected] = useState(new Date());
  const [events, setEvents] = useState<EventRow[]>([]);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerYear, setPickerYear] = useState(new Date().getFullYear());
  const [pickerMonth, setPickerMonth] = useState(new Date().getMonth());

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const yearOptions = getYearOptions(year);
  const monthOptions = Array.from({ length: 12 }, (_, index) => index + 1);

  function reload() {
    const matrix = getMonthMatrix(year, month);
    listMyEventsInRange(supabase, toISODate(matrix[0][0]), toISODate(matrix[5][6]))
      .then(setEvents).catch(console.error);
  }
  useEffect(reload, [year, month]);

  function handleSelect(d: Date) {
    setSelected(d);
    setSheetOpen(true);
  }

  function openPicker() {
    setPickerYear(year);
    setPickerMonth(month);
    setPickerOpen(true);
  }

  function applyPicker() {
    const nextDate = new Date(pickerYear, pickerMonth, 1);
    setCursor(nextDate);
    setSelected(nextDate);
    setPickerOpen(false);
  }

  return (
    <div className="px-4 pt-6">
      <header className="relative mb-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setCursor(new Date(year, month - 1, 1))}
            className="flex h-9 w-9 items-center justify-center rounded-full text-brand-dark hover:bg-brand-soft"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={openPicker}
            className="rounded-full px-3 py-1.5 text-lg font-bold text-ink transition hover:bg-brand-soft"
          >
            {year}년 {month + 1}월
          </button>
          <button
            onClick={() => setCursor(new Date(year, month + 1, 1))}
            className="flex h-9 w-9 items-center justify-center rounded-full text-brand-dark hover:bg-brand-soft"
          >
            ›
          </button>
        </div>

        {pickerOpen && (
          <div className="absolute left-1/2 top-full z-20 mt-2 w-[220px] -translate-x-1/2 rounded-2xl border border-ink/10 bg-white p-3 shadow-lg">
            <div className="grid grid-cols-2 gap-2">
              <label className="space-y-1 text-[11px] font-medium text-ink/60">
                <span>연도</span>
                <select
                  value={pickerYear}
                  onChange={(event) => setPickerYear(Number(event.target.value))}
                  className="w-full rounded-xl border border-ink/10 bg-brand-soft/30 px-2 py-2 text-sm text-ink outline-none"
                >
                  {yearOptions.map((optionYear) => (
                    <option key={optionYear} value={optionYear}>{optionYear}년</option>
                  ))}
                </select>
              </label>

              <label className="space-y-1 text-[11px] font-medium text-ink/60">
                <span>월</span>
                <select
                  value={pickerMonth}
                  onChange={(event) => setPickerMonth(Number(event.target.value))}
                  className="w-full rounded-xl border border-ink/10 bg-brand-soft/30 px-2 py-2 text-sm text-ink outline-none"
                >
                  {monthOptions.map((optionMonth) => (
                    <option key={optionMonth} value={optionMonth - 1}>{optionMonth}월</option>
                  ))}
                </select>
              </label>
            </div>

            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => setPickerOpen(false)}
                className="flex-1 rounded-xl border border-ink/10 bg-white px-2 py-2 text-sm font-medium text-ink/70"
              >
                닫기
              </button>
              <button
                type="button"
                onClick={applyPicker}
                className="flex-1 rounded-xl bg-brand px-2 py-2 text-sm font-medium text-white"
              >
                이동
              </button>
            </div>
          </div>
        )}
      </header>
      <MonthGrid
        year={year} month={month} events={events}
        selectedDate={selected} onSelectDate={handleSelect}
      />
      <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)}>
        <DaySheet
          dateISO={toISODate(selected)}
          events={events.filter((e) => isSameDay(new Date(e.date + "T00:00"), selected))}
          onChanged={reload}
        />
      </BottomSheet>
    </div>
  );
}
