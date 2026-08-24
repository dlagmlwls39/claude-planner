import type { SupabaseClient } from "@supabase/supabase-js";
import type { EventRow, Profile } from "@/lib/types";

// 일정에 친구들을 초대한다(주최자만). RLS 가 소유/친구 관계를 강제.
export async function inviteFriendsToEvent(
  supabase: SupabaseClient,
  eventId: string,
  friendIds: string[]
): Promise<void> {
  if (friendIds.length === 0) return;
  const rows = friendIds.map((uid) => ({
    event_id: eventId,
    user_id: uid,
    status: "pending" as const,
  }));
  const { error } = await supabase.from("event_participants").insert(rows);
  if (error) throw error;
}

export type EventParticipant = { profile: Profile; status: "pending" | "accepted" };

// 여러 일정의 참여자(대기/수락)를 한 번에 조회 → eventId 별 목록 맵.
export async function listParticipantsForEvents(
  supabase: SupabaseClient,
  eventIds: string[]
): Promise<Map<string, EventParticipant[]>> {
  const map = new Map<string, EventParticipant[]>();
  if (eventIds.length === 0) return map;

  const { data: rows } = await supabase
    .from("event_participants")
    .select("event_id, user_id, status")
    .in("event_id", eventIds)
    .in("status", ["pending", "accepted"]);
  const parts = (rows ?? []) as { event_id: string; user_id: string; status: "pending" | "accepted" }[];
  if (parts.length === 0) return map;

  const uids = Array.from(new Set(parts.map((p) => p.user_id)));
  const { data: profiles } = await supabase.from("profiles").select("*").in("id", uids);
  const pMap = new Map(((profiles ?? []) as Profile[]).map((p) => [p.id, p] as const));

  for (const p of parts) {
    const profile = pMap.get(p.user_id);
    if (!profile) continue;
    const arr = map.get(p.event_id) ?? [];
    arr.push({ profile, status: p.status });
    map.set(p.event_id, arr);
  }
  return map;
}

// 주최자가 특정 참여자들을 일정에서 제거.
export async function removeEventParticipants(
  supabase: SupabaseClient,
  eventId: string,
  userIds: string[]
): Promise<void> {
  if (userIds.length === 0) return;
  const { error } = await supabase
    .from("event_participants")
    .delete()
    .eq("event_id", eventId)
    .in("user_id", userIds);
  if (error) throw error;
}

// 참여자가 공유 일정에서 스스로 나가기.
export async function leaveEvent(supabase: SupabaseClient, eventId: string): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("no session");
  const { error } = await supabase
    .from("event_participants")
    .delete()
    .eq("event_id", eventId)
    .eq("user_id", user.id);
  if (error) throw error;
}

export type IncomingEventInvite = {
  inviteId: string;
  event: EventRow;
  inviter: Profile;
};

// 내가 받은 일정 초대(pending) 목록.
export async function listIncomingEventInvites(
  supabase: SupabaseClient
): Promise<IncomingEventInvite[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("no session");

  const { data: rows, error } = await supabase
    .from("event_participants")
    .select("id, event:events(*)")
    .eq("user_id", user.id)
    .eq("status", "pending");
  if (error) throw error;

  const invites = (rows ?? []) as unknown as { id: string; event: EventRow }[];
  const valid = invites.filter((r) => r.event);
  if (valid.length === 0) return [];

  const inviterIds = Array.from(new Set(valid.map((r) => r.event.user_id)));
  const { data: profiles } = await supabase
    .from("profiles")
    .select("*")
    .in("id", inviterIds);
  const pMap = new Map(
    ((profiles ?? []) as Profile[]).map((p) => [p.id, p] as const)
  );

  return valid
    .map((r) => {
      const inviter = pMap.get(r.event.user_id);
      return inviter ? { inviteId: r.id, event: r.event, inviter } : null;
    })
    .filter((x): x is IncomingEventInvite => x !== null);
}

export async function acceptEventInvite(
  supabase: SupabaseClient,
  inviteId: string
): Promise<void> {
  const { error } = await supabase
    .from("event_participants")
    .update({ status: "accepted" })
    .eq("id", inviteId);
  if (error) throw error;
}

export async function declineEventInvite(
  supabase: SupabaseClient,
  inviteId: string
): Promise<void> {
  const { error } = await supabase
    .from("event_participants")
    .update({ status: "declined" })
    .eq("id", inviteId);
  if (error) throw error;
}
