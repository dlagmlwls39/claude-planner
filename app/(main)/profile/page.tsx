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
    <div className="p-4 space-y-4">
      <h1 className="font-bold text-lg">내 정보</h1>
      {profile && (
        <div className="rounded-2xl border p-4 space-y-2">
          <div className="flex items-center gap-3">
            <span
              className="w-12 h-12 rounded-full"
              style={{ backgroundColor: profile.avatar_color }}
            />
            <span className="font-semibold text-lg">{profile.nickname}</span>
          </div>
          <p className="text-sm">
            내 친구코드: <b className="tracking-widest">{profile.friend_code}</b>
          </p>
        </div>
      )}
      <button onClick={logout} className="w-full rounded-xl bg-gray-100 py-3">
        로그아웃
      </button>
    </div>
  );
}
