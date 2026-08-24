import type { SupabaseClient } from "@supabase/supabase-js";
import type { EventRow } from "@/lib/types";

export async function listMyEventsInRange(
  supabase: SupabaseClient,
  startISO: string,
  endISO: string
): Promise<EventRow[]> {
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .gte("date", startISO)
    .lte("date", endISO)
    .order("date");
  if (error) throw error;
  return (data ?? []) as EventRow[];
}
