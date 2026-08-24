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
    <div className="pt-4">
      <header className="flex items-center justify-between px-5 mb-1">
        <button onClick={() => setCursor(new Date(year, month - 1, 1))}>‹</button>
        <h1 className="font-bold">친구 캘린더</h1>
        <button onClick={() => setCursor(new Date(year, month + 1, 1))}>›</button>
      </header>
      <p className="text-center text-sm text-pastel-ink/60 mb-1">{year}년 {month + 1}월</p>
      <p className="px-5 text-xs text-pastel-ink/50 mb-2">공개된 일정만 보여요</p>
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
        <h2 className="font-bold mb-2">{toISODate(selected)}</h2>
        {dayEvents.length === 0 && (
          <p className="text-sm text-pastel-ink/50 py-4">공개된 일정이 없어요</p>
        )}
        {dayEvents.map((e) => (
          <div key={e.id} className="flex items-center gap-2 rounded-xl border p-3 mb-2">
            <span className="w-2 h-8 rounded-full" style={{ backgroundColor: e.color }} />
            <div>
              <p className="font-medium">{e.title}</p>
              {!e.is_all_day && (
                <p className="text-xs text-pastel-ink/50">{e.start_time}~{e.end_time}</p>
              )}
            </div>
          </div>
        ))}
      </BottomSheet>
    </div>
  );
}
