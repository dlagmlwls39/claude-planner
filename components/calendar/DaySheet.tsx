"use client";
import { useEffect, useState } from "react";
import type { EventRow, TodoRow } from "@/lib/types";
import { createBrowserSupabase } from "@/lib/supabase/client";
import { createEvent, updateEvent, deleteEvent, type EventInput } from "@/lib/supabase/events";
import { inviteFriendsToEvent } from "@/lib/supabase/event-invites";
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
  const [todos, setTodos] = useState<TodoRow[]>([]);
  const [todoTitle, setTodoTitle] = useState("");

  function reloadTodos() {
    listTodosByDate(supabase, dateISO).then(setTodos).catch(console.error);
  }
  useEffect(reloadTodos, [dateISO]);

  async function handleSubmit(input: EventInput, friendIds: string[]) {
    if (editing === "new") {
      const created = await createEvent(supabase, input);
      if (friendIds.length > 0) {
        await inviteFriendsToEvent(supabase, created.id, friendIds);
      }
    } else if (editing) {
      await updateEvent(supabase, editing.id, input);
    }
    setEditing(null);
    onChanged();
  }

  async function handleDelete(id: string) {
    await deleteEvent(supabase, id);
    onChanged();
  }

  if (editing) {
    return (
      <EventForm
        date={dateISO}
        initial={editing === "new" ? undefined : editing}
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
      {events.map((e) => (
        <div key={e.id} className="card flex items-center gap-3 p-3.5">
          <span className="w-1.5 h-9 rounded-full" style={{ backgroundColor: e.color }} />
          <div className="flex-1">
            <p className="flex items-center gap-1 font-medium text-ink">
              {e.title}
              {e.is_public && (
                <FriendsIcon className="h-4 w-4 shrink-0 text-brand-dark" />
              )}
            </p>
            {!e.is_all_day && <p className="text-xs text-ink/45">{e.start_time}~{e.end_time}</p>}
          </div>
          <button onClick={() => setEditing(e)} className="text-sm text-brand-dark">수정</button>
          <button onClick={() => handleDelete(e.id)} className="text-sm text-rose-400">삭제</button>
        </div>
      ))}
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
