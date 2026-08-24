"use client";
import { useEffect, useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase/client";
import { listStandingTodos, createTodo, toggleTodo, deleteTodo } from "@/lib/supabase/todos";
import { TodoItem } from "@/components/todos/TodoItem";
import type { TodoRow } from "@/lib/types";

export default function TodosPage() {
  const supabase = createBrowserSupabase();
  const [todos, setTodos] = useState<TodoRow[]>([]);
  const [title, setTitle] = useState("");

  function reload() {
    listStandingTodos(supabase).then(setTodos).catch(console.error);
  }
  useEffect(reload, []);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    await createTodo(supabase, title.trim(), null);
    setTitle("");
    reload();
  }

  return (
    <div className="p-4 space-y-3">
      <h1 className="font-bold text-lg">할 일</h1>
      <form onSubmit={add} className="flex gap-2">
        <input
          className="flex-1 rounded-xl border px-3 py-2"
          placeholder="할 일 추가"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <button className="rounded-xl bg-pastel-pink px-4 font-semibold">+</button>
      </form>
      <div className="space-y-2">
        {todos.map((t) => (
          <TodoItem
            key={t.id}
            todo={t}
            onToggle={async (done) => { await toggleTodo(supabase, t.id, done); reload(); }}
            onDelete={async () => { await deleteTodo(supabase, t.id); reload(); }}
          />
        ))}
      </div>
    </div>
  );
}
