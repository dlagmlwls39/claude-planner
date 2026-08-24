"use client";
import type { TodoRow } from "@/lib/types";

export function TodoItem({
  todo,
  onToggle,
  onDelete,
}: {
  todo: TodoRow;
  onToggle: (done: boolean) => void;
  onDelete: () => void;
}) {
  return (
    <div className="card flex items-center gap-3 p-3.5">
      <input
        type="checkbox"
        checked={todo.is_done}
        onChange={(e) => onToggle(e.target.checked)}
        className="h-5 w-5 shrink-0 accent-brand"
      />
      <span className={`flex-1 text-ink ${todo.is_done ? "line-through text-ink/35" : ""}`}>
        {todo.title}
      </span>
      <button onClick={onDelete} className="text-sm text-rose-400 hover:text-rose-500">삭제</button>
    </div>
  );
}
