import type { SupabaseClient } from "@supabase/supabase-js";
import { generateFriendCode } from "@/lib/friend-code";

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
