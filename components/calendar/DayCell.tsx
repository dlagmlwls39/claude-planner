import type { EventRow } from "@/lib/types";
import { toISODate } from "@/lib/date";

export function DayCell({
  date, events, isSelected, isToday, inMonth, onClick,
}: {
  date: Date;
  events: EventRow[];
  isSelected: boolean;
  isToday: boolean;
  inMonth: boolean;
  onClick: () => void;
}) {
  const iso = toISODate(date);
  return (
    <button
      onClick={onClick}
      className={`aspect-square rounded-2xl flex flex-col items-center justify-start pt-1 text-sm
        ${isSelected ? "bg-pastel-pink/60" : "hover:bg-pastel-pink/20"}
        ${inMonth ? "text-pastel-ink" : "text-pastel-ink/30"}`}
    >
      <span className={isToday ? "rounded-full bg-pastel-pinkdark text-white w-6 h-6 flex items-center justify-center" : ""}>
        {date.getDate()}
      </span>
      <span className="flex gap-0.5 mt-0.5">
        {events.slice(0, 3).map((e) => (
          <span
            key={e.id}
            data-testid={`dot-${iso}`}
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: e.color }}
          />
        ))}
      </span>
    </button>
  );
}
