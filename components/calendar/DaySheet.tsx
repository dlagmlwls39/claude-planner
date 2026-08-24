"use client";
import { useEffect, useState } from "react";
import type { EventRow, TodoRow } from "@/lib/types";
import { createBrowserSupabase } from "@/lib/supabase/client";
import { createEvent, updateEvent, deleteEvent, type EventInput } from "@/lib/supabase/events";
import { listTodosByDate, createTodo, toggleTodo, deleteTodo } from "@/lib/supabase/todos";
import { TodoItem } from "@/components/todos/TodoItem";
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

  async function handleSubmit(input: EventInput) {
    if (editing === "new") await createEvent(supabase, input);
    else if (editing) await updateEvent(supabase, editing.id, input);
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
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="font-bold">{dateISO}</h2>
        <button onClick={() => setEditing("new")}
          className="rounded-full bg-pastel-pink px-3 py-1 text-sm font-semibold">+ 일정</button>
      </div>
      {events.length === 0 && <p className="text-sm text-pastel-ink/50 py-4">일정이 없어요</p>}
      {events.map((e) => (
        <div key={e.id} className="flex items-center gap-2 rounded-xl border p-3">
          <span className="w-2 h-8 rounded-full" style={{ backgroundColor: e.color }} />
          <div className="flex-1">
            <p className="font-medium">{e.title} {e.is_public && "🌷"}</p>
            {!e.is_all_day && <p className="text-xs text-pastel-ink/50">{e.start_time}~{e.end_time}</p>}
          </div>
          <button onClick={() => setEditing(e)} className="text-sm">수정</button>
          <button onClick={() => handleDelete(e.id)} className="text-sm text-red-400">삭제</button>
        </div>
      ))}
      <div className="pt-4 space-y-2">
        <h3 className="font-semibold text-sm">이 날 할 일</h3>
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
            className="flex-1 rounded-xl border px-3 py-2"
            placeholder="할 일 추가"
            value={todoTitle}
            onChange={(e) => setTodoTitle(e.target.value)}
          />
          <button className="rounded-xl bg-pastel-mint px-4">+</button>
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
