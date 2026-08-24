"use client";
import { useEffect, useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase/client";
import { listMyEventsInRange } from "@/lib/supabase/events";
import { getMonthMatrix, toISODate, isSameDay } from "@/lib/date";
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

  const year = cursor.getFullYear();
  const month = cursor.getMonth();

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

  return (
    <div className="pt-4">
      <header className="flex items-center justify-between px-5 mb-3">
        <button onClick={() => setCursor(new Date(year, month - 1, 1))}>‹</button>
        <h1 className="font-bold">{year}년 {month + 1}월</h1>
        <button onClick={() => setCursor(new Date(year, month + 1, 1))}>›</button>
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
