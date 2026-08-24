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
    <div className="flex items-center gap-2 rounded-xl border p-3">
      <input
        type="checkbox"
        checked={todo.is_done}
        onChange={(e) => onToggle(e.target.checked)}
      />
      <span className={`flex-1 ${todo.is_done ? "line-through text-pastel-ink/40" : ""}`}>
        {todo.title}
      </span>
      <button onClick={onDelete} className="text-sm text-red-400">삭제</button>
    </div>
  );
}
