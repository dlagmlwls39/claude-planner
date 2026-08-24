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
    <form onSubmit={submit} className="space-y-3.5">
      <input className="field" placeholder="일정 제목"
        value={title} onChange={(e) => setTitle(e.target.value)} required />
      <label className="flex items-center gap-2 text-sm text-ink">
        <input type="checkbox" className="h-4 w-4 accent-brand" checked={isAllDay} onChange={(e) => setIsAllDay(e.target.checked)} />
        종일
      </label>
      {!isAllDay && (
        <div className="flex gap-2">
          <input type="time" className="field flex-1"
            value={start} onChange={(e) => setStart(e.target.value)} />
          <input type="time" className="field flex-1"
            value={end} onChange={(e) => setEnd(e.target.value)} />
        </div>
      )}
      <div className="flex gap-2.5">
        {COLORS.map((c) => (
          <button type="button" key={c} onClick={() => setColor(c)}
            className={`w-8 h-8 rounded-full transition-transform ${color === c ? "ring-2 ring-offset-2 ring-brand scale-110" : ""}`}
            style={{ backgroundColor: c }} />
        ))}
      </div>
      <textarea className="field" placeholder="메모"
        value={memo} onChange={(e) => setMemo(e.target.value)} />
      <label className="flex items-center gap-2 text-sm text-ink">
        <input type="checkbox" className="h-4 w-4 accent-brand" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} />
        친구에게 공개
      </label>
      <div className="flex gap-2 pt-2">
        <button type="button" onClick={onCancel}
          className="btn btn-ghost flex-1 py-2.5">취소</button>
        <button className="btn btn-primary flex-1 py-2.5">저장</button>
      </div>
    </form>
  );
}
