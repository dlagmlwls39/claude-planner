import type { SupabaseClient } from "@supabase/supabase-js";
import type { EventRow } from "@/lib/types";

export async function listMyEventsInRange(
  supabase: SupabaseClient,
  startISO: string,
  endISO: string
): Promise<EventRow[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("no session");

  // 1) 내가 만든 일정
  const { data: own, error } = await supabase
    .from("events")
    .select("*")
    .eq("user_id", user.id)
    .gte("date", startISO)
    .lte("date", endISO);
  if (error) throw error;

  // 2) 내가 수락한 공유 일정
  const { data: parts } = await supabase
    .from("event_participants")
    .select("event_id")
    .eq("user_id", user.id)
    .eq("status", "accepted");
  const sharedIds = ((parts ?? []) as { event_id: string }[]).map((p) => p.event_id);

  let shared: EventRow[] = [];
  if (sharedIds.length > 0) {
    const { data: sharedRows } = await supabase
      .from("events")
      .select("*")
      .in("id", sharedIds)
      .gte("date", startISO)
      .lte("date", endISO);
    // 내가 참여자인 일정은 모두 공유 일정
    shared = ((sharedRows ?? []) as EventRow[]).map((e) => ({ ...e, is_shared: true }));
  }

  // 내가 만든 일정 중 참여자가 있는 것도 공유 일정으로 표시
  const ownEvents = (own ?? []) as EventRow[];
  const ownIds = ownEvents.map((e) => e.id);
  if (ownIds.length > 0) {
    const { data: ownParts } = await supabase
      .from("event_participants")
      .select("event_id")
      .in("event_id", ownIds)
      .in("status", ["pending", "accepted"]);
    const sharedOwn = new Set(
      ((ownParts ?? []) as { event_id: string }[]).map((p) => p.event_id)
    );
    for (const e of ownEvents) e.is_shared = sharedOwn.has(e.id);
  }

  // 3) id 기준 병합/중복 제거 후 날짜 정렬
  const byId = new Map<string, EventRow>();
  for (const e of [...ownEvents, ...shared]) byId.set(e.id, e);
  return Array.from(byId.values()).sort((a, b) => a.date.localeCompare(b.date));
}

export async function listFriendEventsInRange(
  supabase: SupabaseClient,
  friendId: string,
  startISO: string,
  endISO: string
): Promise<EventRow[]> {
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("user_id", friendId)
    .gte("date", startISO)
    .lte("date", endISO)
    .order("date");
  if (error) throw error;
  // RLS 정책상 is_public=true 이면서 친구인 행만 돌아온다.
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
