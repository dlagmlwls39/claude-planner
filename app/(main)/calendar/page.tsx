"use client";
import { useEffect, useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase/client";
import { listMyEventsInRange } from "@/lib/supabase/events";
import { getMonthMatrix, toISODate } from "@/lib/date";
import { MonthGrid } from "@/components/calendar/MonthGrid";
import type { EventRow } from "@/lib/types";

export default function CalendarPage() {
  const supabase = createBrowserSupabase();
  const [cursor, setCursor] = useState(new Date());
  const [selected, setSelected] = useState(new Date());
  const [events, setEvents] = useState<EventRow[]>([]);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();

  useEffect(() => {
    const matrix = getMonthMatrix(year, month);
    const startISO = toISODate(matrix[0][0]);
    const endISO = toISODate(matrix[5][6]);
    listMyEventsInRange(supabase, startISO, endISO).then(setEvents).catch(console.error);
  }, [year, month]);

  return (
    <div className="pt-4">
      <header className="flex items-center justify-between px-5 mb-3">
        <button onClick={() => setCursor(new Date(year, month - 1, 1))}>‹</button>
        <h1 className="font-bold">{year}년 {month + 1}월</h1>
        <button onClick={() => setCursor(new Date(year, month + 1, 1))}>›</button>
      </header>
      <MonthGrid
        year={year} month={month} events={events}
        selectedDate={selected} onSelectDate={setSelected}
      />
    </div>
  );
}
