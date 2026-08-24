"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabase } from "@/lib/supabase/client";
import { getMyProfile } from "@/lib/supabase/friends";
import { updateMyProfile, uploadAvatar, updatePassword, deleteAccount } from "@/lib/supabase/profile";
import { Avatar } from "@/components/ui/Avatar";
import type { Profile } from "@/lib/types";

export default function ProfilePage() {
  const supabase = createBrowserSupabase();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [editing, setEditing] = useState(false);
  const [nickname, setNickname] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [removePhoto, setRemovePhoto] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // 비밀번호 변경
  const [pwOpen, setPwOpen] = useState(false);
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  // 회원 탈퇴
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteErr, setDeleteErr] = useState<string | null>(null);

  useEffect(() => {
    getMyProfile(supabase).then(setProfile).catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function startEdit() {
    if (!profile) return;
    setNickname(profile.nickname);
    setPreview(profile.avatar_url);
    setFile(null);
    setRemovePhoto(false);
    setError(null);
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
    setFile(null);
    setPreview(null);
    setRemovePhoto(false);
    setError(null);
  }

  function pickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setRemovePhoto(false);
    setPreview(URL.createObjectURL(f));
  }

  function removeCurrentPhoto() {
    setFile(null);
    setPreview(null);
    setRemovePhoto(true);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function save() {
    if (!profile) return;
    if (!nickname.trim()) {
      setError("닉네임을 입력해 주세요.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      let avatar_url: string | null | undefined;
      if (file) {
        avatar_url = await uploadAvatar(supabase, profile.id, file);
      } else if (removePhoto) {
        avatar_url = null;
      }
      await updateMyProfile(supabase, {
        nickname: nickname.trim() !== profile.nickname ? nickname.trim() : undefined,
        avatar_url,
      });
      const fresh = await getMyProfile(supabase);
      setProfile(fresh);
      setEditing(false);
      setFile(null);
      setRemovePhoto(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "저장에 실패했어요.");
    } finally {
      setSaving(false);
    }
  }

  async function changePassword() {
    setPwMsg(null);
    if (pw !== pw2) {
      setPwMsg({ type: "err", text: "두 비밀번호가 일치하지 않아요." });
      return;
    }
    setPwSaving(true);
    try {
      await updatePassword(supabase, pw);
      setPwMsg({ type: "ok", text: "비밀번호를 변경했어요." });
      setPw("");
      setPw2("");
      setPwOpen(false);
    } catch (err) {
      setPwMsg({ type: "err", text: err instanceof Error ? err.message : "변경에 실패했어요." });
    } finally {
      setPwSaving(false);
    }
  }

  async function logout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  async function handleDeleteAccount() {
    setDeleting(true);
    setDeleteErr(null);
    try {
      await deleteAccount(supabase);
      router.push("/login");
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : err && typeof err === "object" && "message" in err
            ? String((err as { message: unknown }).message)
            : "탈퇴에 실패했어요.";
      setDeleteErr(msg);
      setDeleting(false);
      console.error("deleteAccount error:", err);
    }
  }

  const hasPhoto = !!preview && !removePhoto;

  return (
    <div className="px-4 pt-6 space-y-4">
      <h1 className="text-2xl font-bold text-ink">내 정보</h1>

      {profile && !editing && (
        <div className="card p-5 space-y-4">
          <div className="flex items-center gap-4">
            <Avatar
              url={profile.avatar_url}
              color={profile.avatar_color}
              nickname={profile.nickname}
              className="w-16 h-16 text-xl"
            />
            <span className="flex-1 text-xl font-bold text-ink">{profile.nickname}</span>
            <button onClick={startEdit} className="btn btn-soft px-4 py-1.5 text-sm">
              수정
            </button>
          </div>
          <div className="rounded-xl bg-brand-soft/60 px-4 py-3">
            <p className="text-xs text-ink/55 mb-0.5">내 친구코드</p>
            <b className="text-lg tracking-widest text-brand-dark">{profile.friend_code}</b>
          </div>
        </div>
      )}

      {profile && editing && (
        <div className="card p-5 space-y-4">
          <div className="flex flex-col items-center gap-3">
            <button type="button" onClick={() => fileRef.current?.click()} className="relative">
              <Avatar
                url={preview}
                color={profile.avatar_color}
                nickname={nickname}
                className="w-24 h-24 text-3xl"
              />
              <span className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-brand text-white shadow-sm">
                ✎
              </span>
            </button>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="text-sm text-brand-dark"
              >
                사진 변경
              </button>
              {hasPhoto && (
                <>
                  <span className="text-ink/20">|</span>
                  <button
                    type="button"
                    onClick={removeCurrentPhoto}
                    className="text-sm text-rose-400"
                  >
                    사진 삭제
                  </button>
                </>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={pickFile}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-ink/55">닉네임</label>
            <input
              className="field"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="닉네임"
              maxLength={20}
            />
          </div>

          {error && <p className="text-sm text-rose-400">{error}</p>}

          <div className="flex gap-2 pt-1">
            <button onClick={cancelEdit} disabled={saving} className="btn btn-ghost flex-1 py-2.5">
              취소
            </button>
            <button onClick={save} disabled={saving} className="btn btn-primary flex-1 py-2.5">
              {saving ? "저장 중…" : "저장"}
            </button>
          </div>
        </div>
      )}

      {profile && !editing && (
        <div className="card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-bold text-ink">비밀번호 변경</span>
            <button
              onClick={() => {
                setPwOpen((v) => !v);
                setPwMsg(null);
                setPw("");
                setPw2("");
              }}
              className="btn btn-soft px-4 py-1.5 text-sm"
            >
              {pwOpen ? "닫기" : "변경"}
            </button>
          </div>
          {pwOpen && (
            <div className="space-y-2">
              <input
                className="field"
                type="password"
                placeholder="새 비밀번호 (6자 이상)"
                value={pw}
                onChange={(e) => setPw(e.target.value)}
              />
              <input
                className="field"
                type="password"
                placeholder="새 비밀번호 확인"
                value={pw2}
                onChange={(e) => setPw2(e.target.value)}
              />
              <button
                onClick={changePassword}
                disabled={pwSaving || !pw || !pw2}
                className="btn btn-primary w-full py-2.5"
              >
                {pwSaving ? "변경 중…" : "비밀번호 변경"}
              </button>
            </div>
          )}
          {pwMsg && (
            <p className={`text-sm ${pwMsg.type === "ok" ? "text-brand-dark" : "text-rose-400"}`}>
              {pwMsg.text}
            </p>
          )}
        </div>
      )}

      {!editing && (
        <>
          <button onClick={logout} className="btn btn-ghost w-full py-3">
            로그아웃
          </button>
          <button
            onClick={() => { setDeleteErr(null); setConfirmDelete(true); }}
            className="w-full py-2 text-center text-sm text-ink/40 hover:text-rose-400"
          >
            회원 탈퇴
          </button>
        </>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
          <div className="absolute inset-0 bg-ink/30 backdrop-blur-[1px]"
            onClick={() => !deleting && setConfirmDelete(false)} />
          <div className="card relative w-full max-w-[340px] p-6 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 text-2xl">
              ⚠️
            </div>
            <h2 className="text-lg font-bold text-ink">정말 탈퇴하시겠어요?</h2>
            <p className="mt-2 text-sm leading-relaxed text-ink/60">
              내 일정·할 일·친구·프로필이 모두 삭제되며
              <br />
              되돌릴 수 없어요.
            </p>
            {deleteErr && <p className="mt-3 text-sm text-rose-400">{deleteErr}</p>}
            <div className="mt-5 flex gap-2">
              <button onClick={() => setConfirmDelete(false)} disabled={deleting}
                className="btn btn-ghost flex-1 py-2.5">취소</button>
              <button onClick={handleDeleteAccount} disabled={deleting}
                className="btn flex-1 py-2.5 bg-rose-400 text-white">
                {deleting ? "탈퇴 중…" : "탈퇴하기"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
