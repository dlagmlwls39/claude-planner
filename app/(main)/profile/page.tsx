"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabase } from "@/lib/supabase/client";
import { getMyProfile } from "@/lib/supabase/friends";
import type { Profile } from "@/lib/types";

export default function ProfilePage() {
  const supabase = createBrowserSupabase();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    getMyProfile(supabase).then(setProfile).catch(console.error);
  }, []);

  async function logout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <div className="px-4 pt-6 space-y-4">
      <h1 className="text-2xl font-bold text-ink">내 정보 🐰</h1>
      {profile && (
        <div className="card p-5 space-y-4">
          <div className="flex items-center gap-4">
            <span
              className="w-14 h-14 rounded-full ring-2 ring-white shadow-sm"
              style={{ backgroundColor: profile.avatar_color }}
            />
            <span className="text-xl font-bold text-ink">{profile.nickname}</span>
          </div>
          <div className="rounded-xl bg-brand-soft/60 px-4 py-3">
            <p className="text-xs text-ink/55 mb-0.5">내 친구코드</p>
            <b className="text-lg tracking-widest text-brand-dark">{profile.friend_code}</b>
          </div>
        </div>
      )}
      <button onClick={logout} className="btn btn-ghost w-full py-3">
        로그아웃
      </button>
    </div>
  );
}
