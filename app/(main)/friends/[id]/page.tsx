"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createBrowserSupabase } from "@/lib/supabase/client";
import { listFriendEventsInRange } from "@/lib/supabase/events";
import { getMonthMatrix, toISODate, isSameDay } from "@/lib/date";
import { MonthGrid } from "@/components/calendar/MonthGrid";
import { BottomSheet } from "@/components/ui/BottomSheet";
import type { EventRow } from "@/lib/types";

export default function FriendCalendarPage() {
  const supabase = createBrowserSupabase();
  const params = useParams<{ id: string }>();
  const friendId = params.id;
  const [cursor, setCursor] = useState(new Date());
  const [selected, setSelected] = useState(new Date());
  const [events, setEvents] = useState<EventRow[]>([]);
  const [sheetOpen, setSheetOpen] = useState(false);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();

  useEffect(() => {
    const matrix = getMonthMatrix(year, month);
    listFriendEventsInRange(supabase, friendId, toISODate(matrix[0][0]), toISODate(matrix[5][6]))
      .then(setEvents)
      .catch(console.error);
    // supabase 인스턴스는 렌더마다 새로 만들어지므로 의존성에서 제외한다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, month, friendId]);

  const dayEvents = events.filter((e) => isSameDay(new Date(e.date + "T00:00"), selected));

  return (
    <div className="px-4 pt-6">
      <header className="flex items-center justify-between mb-1">
        <button
          onClick={() => setCursor(new Date(year, month - 1, 1))}
          className="flex h-9 w-9 items-center justify-center rounded-full text-brand-dark hover:bg-brand-soft"
        >
          ‹
        </button>
        <h1 className="text-lg font-bold text-ink">친구 캘린더</h1>
        <button
          onClick={() => setCursor(new Date(year, month + 1, 1))}
          className="flex h-9 w-9 items-center justify-center rounded-full text-brand-dark hover:bg-brand-soft"
        >
          ›
        </button>
      </header>
      <p className="text-center text-sm text-ink/60 mb-1">{year}년 {month + 1}월</p>
      <p className="text-center text-xs text-ink/45 mb-3">공개된 일정만 보여요</p>
      <MonthGrid
        year={year}
        month={month}
        events={events}
        selectedDate={selected}
        onSelectDate={(d) => {
          setSelected(d);
          setSheetOpen(true);
        }}
      />
      <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)}>
        <h2 className="text-lg font-bold text-ink mb-2">{toISODate(selected)}</h2>
        {dayEvents.length === 0 && (
          <p className="text-sm text-ink/45 py-4">공개된 일정이 없어요</p>
        )}
        {dayEvents.map((e) => (
          <div key={e.id} className="card flex items-center gap-3 p-3.5 mb-2">
            <span className="w-1.5 h-9 rounded-full" style={{ backgroundColor: e.color }} />
            <div>
              <p className="font-medium text-ink">{e.title}</p>
              {!e.is_all_day && (
                <p className="text-xs text-ink/45">{e.start_time}~{e.end_time}</p>
              )}
            </div>
          </div>
        ))}
      </BottomSheet>
    </div>
  );
}
