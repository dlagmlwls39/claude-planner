import type { SupabaseClient } from "@supabase/supabase-js";
import { generateFriendCode } from "@/lib/friend-code";
import type { Profile, Friendship } from "@/lib/types";

export async function ensureProfile(
  supabase: SupabaseClient,
  nickname: string
): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("no session");

  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();
  if (existing) return;

  await supabase.from("profiles").insert({
    id: user.id,
    nickname,
    friend_code: generateFriendCode(),
  });
}

export async function getMyProfile(supabase: SupabaseClient): Promise<Profile> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("no session");
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
  if (error) throw error;
  return data as Profile;
}

export async function findProfile(
  supabase: SupabaseClient,
  query: string
): Promise<Profile | null> {
  const q = query.trim();
  if (!q) return null;
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .or(`nickname.eq.${q},friend_code.eq.${q.toUpperCase()}`)
    .maybeSingle();
  return (data as Profile) ?? null;
}

export async function sendFriendRequest(
  supabase: SupabaseClient,
  addresseeId: string
): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("no session");
  if (user.id === addresseeId) throw new Error("자기 자신은 추가할 수 없어요");
  const { error } = await supabase
    .from("friendships")
    .insert({ requester_id: user.id, addressee_id: addresseeId, status: "pending" });
  if (error) throw error;
}

export async function acceptFriend(
  supabase: SupabaseClient,
  friendshipId: string
): Promise<void> {
  const { error } = await supabase
    .from("friendships")
    .update({ status: "accepted" })
    .eq("id", friendshipId);
  if (error) throw error;
}

export async function listFriends(supabase: SupabaseClient): Promise<Profile[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("no session");
  const { data: rels, error } = await supabase
    .from("friendships")
    .select("*")
    .eq("status", "accepted");
  if (error) throw error;
  const ids = ((rels ?? []) as Friendship[]).map((r) =>
    r.requester_id === user.id ? r.addressee_id : r.requester_id
  );
  if (ids.length === 0) return [];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("*")
    .in("id", ids);
  return (profiles ?? []) as Profile[];
}

export async function listIncomingRequests(
  supabase: SupabaseClient
): Promise<{ friendship: Friendship; profile: Profile }[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("no session");
  const { data: rels } = await supabase
    .from("friendships")
    .select("*")
    .eq("addressee_id", user.id)
    .eq("status", "pending");
  const list = (rels ?? []) as Friendship[];
  if (list.length === 0) return [];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("*")
    .in(
      "id",
      list.map((r) => r.requester_id)
    );
  const pMap = new Map(
    ((profiles ?? []) as Profile[]).map((p) => [p.id, p] as const)
  );
  return list
    .map((f) => {
      const profile = pMap.get(f.requester_id);
      return profile ? { friendship: f, profile } : null;
    })
    .filter((x): x is { friendship: Friendship; profile: Profile } => x !== null);
}
