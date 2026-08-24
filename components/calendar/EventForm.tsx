"use client";
import { useEffect, useState } from "react";
import type { EventRow, Profile } from "@/lib/types";
import type { EventInput } from "@/lib/supabase/events";
import { createBrowserSupabase } from "@/lib/supabase/client";
import { listFriends } from "@/lib/supabase/friends";
import { Avatar } from "@/components/ui/Avatar";

const COLORS = ["#A7F3D0", "#FBCFE8", "#DDD6FE", "#FDE68A", "#BFDBFE"];

export function EventForm({
  date, initial, canInvite = false, initialFriendIds = [], onSubmit, onCancel,
}: {
  date: string;
  initial?: EventRow;
  canInvite?: boolean;
  initialFriendIds?: string[];
  onSubmit: (input: EventInput, friendIds: string[]) => void | Promise<void>;
  onCancel: () => void;
}) {
  const isNew = !initial;
  const supabase = createBrowserSupabase();
  const [title, setTitle] = useState(initial?.title ?? "");
  const [isAllDay, setIsAllDay] = useState(initial?.is_all_day ?? true);
  const [start, setStart] = useState(initial?.start_time ?? "");
  const [end, setEnd] = useState(initial?.end_time ?? "");
  const [color, setColor] = useState(initial?.color ?? COLORS[0]);
  const [memo, setMemo] = useState(initial?.memo ?? "");
  const [isPublic, setIsPublic] = useState(initial?.is_public ?? false);

  const [withFriends, setWithFriends] = useState(initialFriendIds.length > 0);
  const [friends, setFriends] = useState<Profile[]>([]);
  const [selected, setSelected] = useState<string[]>(initialFriendIds);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // 신규는 토글, 수정(주최자)은 항상 목록 표시
  const listVisible = canInvite && (isNew ? withFriends : true);

  useEffect(() => {
    if (listVisible && friends.length === 0) {
      listFriends(supabase).then(setFriends).catch(console.error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listVisible]);

  function toggleFriend(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const friendIds = canInvite ? (isNew && !withFriends ? [] : selected) : [];
      await onSubmit(
        {
          title: title.trim(),
          date,
          is_all_day: isAllDay,
          start_time: isAllDay ? null : (start || null),
          end_time: isAllDay ? null : (end || null),
          color, memo: memo.trim() || null, is_public: isPublic,
        },
        friendIds
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "저장에 실패했어요.");
    } finally {
      setSaving(false);
    }
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

      {canInvite && (
        <div className="rounded-xl bg-brand-soft/40 p-3 space-y-2">
          {isNew ? (
            <label className="flex items-center gap-2 text-sm text-ink">
              <input type="checkbox" className="h-4 w-4 accent-brand"
                checked={withFriends} onChange={(e) => setWithFriends(e.target.checked)} />
              친구와 함께하기
            </label>
          ) : (
            <p className="text-sm font-medium text-ink">친구와 함께하기</p>
          )}
          {listVisible && (
            <div className="space-y-1.5">
              {friends.length === 0 && (
                <p className="text-xs text-ink/45">함께할 친구가 없어요.</p>
              )}
              {friends.map((f) => {
                const on = selected.includes(f.id);
                return (
                  <button type="button" key={f.id} onClick={() => toggleFriend(f.id)}
                    className={`flex w-full items-center gap-2 rounded-xl px-2 py-1.5 transition ${on ? "bg-white shadow-sm" : ""}`}>
                    <Avatar url={f.avatar_url} color={f.avatar_color} nickname={f.nickname} className="w-7 h-7 text-xs" />
                    <span className="flex-1 text-left text-sm text-ink">{f.nickname}</span>
                    <span className={`flex h-5 w-5 items-center justify-center rounded-full text-xs ${on ? "bg-brand text-white" : "border border-ink/20 text-transparent"}`}>✓</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {error && <p className="text-sm text-rose-400">{error}</p>}

      <div className="flex gap-2 pt-2">
        <button type="button" onClick={onCancel} disabled={saving}
          className="btn btn-ghost flex-1 py-2.5">취소</button>
        <button disabled={saving} className="btn btn-primary flex-1 py-2.5">
          {saving ? "저장 중…" : "저장"}
        </button>
      </div>
    </form>
  );
}
