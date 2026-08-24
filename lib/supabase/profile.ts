import type { SupabaseClient } from "@supabase/supabase-js";

const AVATAR_BUCKET = "avatars";
const MAX_AVATAR_BYTES = 5 * 1024 * 1024; // 5MB

// 아바타 이미지를 업로드하고 공개 URL을 반환한다.
export async function uploadAvatar(
  supabase: SupabaseClient,
  userId: string,
  file: File
): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("이미지 파일만 올릴 수 있어요.");
  }
  if (file.size > MAX_AVATAR_BYTES) {
    throw new Error("이미지 크기는 5MB 이하로 올려주세요.");
  }

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${userId}/${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from(AVATAR_BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type });
  if (error) throw error;

  const { data } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

// 닉네임/아바타를 수정한다. 전달된 필드만 갱신. avatar_url=null 이면 기본 아바타로.
export async function updateMyProfile(
  supabase: SupabaseClient,
  fields: { nickname?: string; avatar_url?: string | null }
): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("no session");

  const patch: { nickname?: string; avatar_url?: string | null } = {};
  if (fields.nickname !== undefined) patch.nickname = fields.nickname.trim();
  if (fields.avatar_url !== undefined) patch.avatar_url = fields.avatar_url;
  if (Object.keys(patch).length === 0) return;

  const { error } = await supabase.from("profiles").update(patch).eq("id", user.id);
  if (error) {
    if (error.code === "23505") throw new Error("이미 사용 중인 닉네임이에요.");
    throw error;
  }
}

// 비밀번호 변경(로그인 상태에서).
export async function updatePassword(
  supabase: SupabaseClient,
  newPassword: string
): Promise<void> {
  if (newPassword.length < 6) {
    throw new Error("비밀번호는 6자 이상으로 설정해 주세요.");
  }
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
}
