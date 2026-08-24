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

export type EventInput = {
  title: string;
  date: string;
  start_time: string | null;
  end_time: string | null;
  is_all_day: boolean;
  color: string;
  memo: string | null;
  is_public: boolean;
};

export async function createEvent(
  supabase: SupabaseClient,
  input: EventInput
): Promise<EventRow> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("no session");
  const { data, error } = await supabase
    .from("events")
    .insert({ ...input, user_id: user.id })
    .select()
    .single();
  if (error) throw error;
  return data as EventRow;
}

export async function updateEvent(
  supabase: SupabaseClient,
  id: string,
  patch: Partial<EventInput>
): Promise<void> {
  const { error } = await supabase.from("events").update(patch).eq("id", id);
  if (error) throw error;
}

export async function deleteEvent(supabase: SupabaseClient, id: string): Promise<void> {
  const { error } = await supabase.from("events").delete().eq("id", id);
  if (error) throw error;
}
