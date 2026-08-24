"use client";
import { useState } from "react";
import type { EventRow } from "@/lib/types";
import type { EventInput } from "@/lib/supabase/events";

const COLORS = ["#A7F3D0", "#FBCFE8", "#DDD6FE", "#FDE68A", "#BFDBFE"];

export function EventForm({
  date, initial, onSubmit, onCancel,
}: {
  date: string;
  initial?: EventRow;
  onSubmit: (input: EventInput) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [isAllDay, setIsAllDay] = useState(initial?.is_all_day ?? true);
  const [start, setStart] = useState(initial?.start_time ?? "");
  const [end, setEnd] = useState(initial?.end_time ?? "");
  const [color, setColor] = useState(initial?.color ?? COLORS[0]);
  const [memo, setMemo] = useState(initial?.memo ?? "");
  const [isPublic, setIsPublic] = useState(initial?.is_public ?? false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit({
      title: title.trim(),
      date,
      is_all_day: isAllDay,
      start_time: isAllDay ? null : (start || null),
      end_time: isAllDay ? null : (end || null),
      color, memo: memo.trim() || null, is_public: isPublic,
    });
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <input className="w-full rounded-xl border px-3 py-2" placeholder="일정 제목"
        value={title} onChange={(e) => setTitle(e.target.value)} required />
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={isAllDay} onChange={(e) => setIsAllDay(e.target.checked)} />
        종일
      </label>
      {!isAllDay && (
        <div className="flex gap-2">
          <input type="time" className="flex-1 rounded-xl border px-3 py-2"
            value={start} onChange={(e) => setStart(e.target.value)} />
          <input type="time" className="flex-1 rounded-xl border px-3 py-2"
            value={end} onChange={(e) => setEnd(e.target.value)} />
        </div>
      )}
      <div className="flex gap-2">
        {COLORS.map((c) => (
          <button type="button" key={c} onClick={() => setColor(c)}
            className={`w-7 h-7 rounded-full ${color === c ? "ring-2 ring-pastel-ink" : ""}`}
            style={{ backgroundColor: c }} />
        ))}
      </div>
      <textarea className="w-full rounded-xl border px-3 py-2" placeholder="메모"
        value={memo} onChange={(e) => setMemo(e.target.value)} />
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} />
        친구에게 공개
      </label>
      <div className="flex gap-2 pt-2">
        <button type="button" onClick={onCancel}
          className="flex-1 rounded-xl bg-gray-100 py-2">취소</button>
        <button className="flex-1 rounded-xl bg-pastel-pink py-2 font-semibold">저장</button>
      </div>
    </form>
  );
}
