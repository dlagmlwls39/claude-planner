"use client";
import { useEffect, useState } from "react";
import type { EventRow, TodoRow } from "@/lib/types";
import { createBrowserSupabase } from "@/lib/supabase/client";
import { createEvent, updateEvent, deleteEvent, type EventInput } from "@/lib/supabase/events";
import {
  inviteFriendsToEvent,
  removeEventParticipants,
  listParticipantsForEvents,
  leaveEvent,
  type EventParticipant,
} from "@/lib/supabase/event-invites";
import { listTodosByDate, createTodo, toggleTodo, deleteTodo } from "@/lib/supabase/todos";
import { TodoItem } from "@/components/todos/TodoItem";
import { FriendsIcon } from "@/components/ui/icons";
import { EventForm } from "./EventForm";

export function DaySheet({
  dateISO, events, onChanged,
}: {
  dateISO: string;
  events: EventRow[];
  onChanged: () => void;
}) {
  const supabase = createBrowserSupabase();
  const [editing, setEditing] = useState<EventRow | "new" | null>(null);
  const [editParticipantIds, setEditParticipantIds] = useState<string[]>([]);
  const [meId, setMeId] = useState<string | null>(null);
  const [participants, setParticipants] = useState<Map<string, EventParticipant[]>>(new Map());
  const [todos, setTodos] = useState<TodoRow[]>([]);
  const [todoTitle, setTodoTitle] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setMeId(data.user?.id ?? null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function reloadTodos() {
    listTodosByDate(supabase, dateISO).then(setTodos).catch(console.error);
  }
  useEffect(reloadTodos, [dateISO]);

  const sharedIds = events.filter((e) => e.is_shared).map((e) => e.id);
  const sharedKey = sharedIds.join(",");
  useEffect(() => {
    listParticipantsForEvents(supabase, sharedIds).then(setParticipants).catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sharedKey]);

  function openEdit(e: EventRow) {
    const ids = (participants.get(e.id) ?? []).map((p) => p.profile.id);
    setEditParticipantIds(ids);
    setEditing(e);
  }

  async function handleSubmit(input: EventInput, friendIds: string[]) {
    if (editing === "new") {
      const created = await createEvent(supabase, input);
      if (friendIds.length > 0) await inviteFriendsToEvent(supabase, created.id, friendIds);
    } else if (editing) {
      await updateEvent(supabase, editing.id, input);
      const existing = editParticipantIds;
      const toAdd = friendIds.filter((id) => !existing.includes(id));
      const toRemove = existing.filter((id) => !friendIds.includes(id));
      if (toAdd.length > 0) await inviteFriendsToEvent(supabase, editing.id, toAdd);
      if (toRemove.length > 0) await removeEventParticipants(supabase, editing.id, toRemove);
    }
    setEditing(null);
    onChanged();
  }

  async function handleDelete(id: string) {
    await deleteEvent(supabase, id);
    onChanged();
  }

  async function handleLeave(id: string) {
    await leaveEvent(supabase, id);
    onChanged();
  }

  if (editing) {
    return (
      <EventForm
        date={dateISO}
        initial={editing === "new" ? undefined : editing}
        canInvite
        initialFriendIds={editing === "new" ? [] : editParticipantIds}
        onSubmit={handleSubmit}
        onCancel={() => setEditing(null)}
      />
    );
  }

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-ink">{dateISO}</h2>
        <button onClick={() => setEditing("new")}
          className="btn btn-soft px-4 py-1.5 text-sm">+ 일정</button>
      </div>
      {events.length === 0 && <p className="text-sm text-ink/45 py-4">일정이 없어요</p>}
      {events.map((e) => {
        const mine = meId === e.user_id;
        const others = (participants.get(e.id) ?? []).filter((p) => p.profile.id !== meId);
        const names = others
          .map((p) => (p.status === "pending" ? `${p.profile.nickname}(대기)` : p.profile.nickname))
          .join(", ");
        return (
          <div key={e.id} className="card flex items-center gap-3 p-3.5">
            <span className="w-1.5 h-9 rounded-full" style={{ backgroundColor: e.color }} />
            <div className="flex-1">
              <p className="flex items-center gap-1.5 font-medium text-ink">
                {e.title}
                {e.is_shared && (
                  <span className="inline-flex items-center gap-0.5 rounded-full bg-brand-soft px-1.5 py-0.5 text-[10px] font-medium text-brand-dark">
                    <FriendsIcon className="h-3 w-3" />함께
                  </span>
                )}
                {e.is_public && (
                  <span className="rounded-full bg-brand-soft px-1.5 py-0.5 text-[10px] font-medium text-brand-dark">
                    공개
                  </span>
                )}
              </p>
              {names && <p className="text-xs text-brand-dark/80">함께: {names}</p>}
              {!e.is_all_day && <p className="text-xs text-ink/45">{e.start_time}~{e.end_time}</p>}
            </div>
            {mine ? (
              <>
                <button onClick={() => openEdit(e)} className="text-sm text-brand-dark">수정</button>
                <button onClick={() => handleDelete(e.id)} className="text-sm text-rose-400">삭제</button>
              </>
            ) : (
              <button onClick={() => handleLeave(e.id)} className="text-sm text-rose-400">나가기</button>
            )}
          </div>
        );
      })}
      <div className="pt-4 space-y-2">
        <h3 className="font-semibold text-sm text-ink/70">이 날 할 일</h3>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!todoTitle.trim()) return;
            await createTodo(supabase, todoTitle.trim(), dateISO);
            setTodoTitle("");
            reloadTodos();
          }}
          className="flex gap-2"
        >
          <input
            className="field flex-1"
            placeholder="할 일 추가"
            value={todoTitle}
            onChange={(e) => setTodoTitle(e.target.value)}
          />
          <button className="btn btn-primary px-4 text-xl">+</button>
        </form>
        {todos.map((t) => (
          <TodoItem
            key={t.id}
            todo={t}
            onToggle={async (done) => { await toggleTodo(supabase, t.id, done); reloadTodos(); }}
            onDelete={async () => { await deleteTodo(supabase, t.id); reloadTodos(); }}
          />
        ))}
      </div>
    </div>
  );
}
