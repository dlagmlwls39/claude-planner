"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { createBrowserSupabase } from "@/lib/supabase/client";
import { listFriends, listIncomingRequests, acceptFriend } from "@/lib/supabase/friends";
import type { Profile, Friendship } from "@/lib/types";

export function FriendList({ refreshKey }: { refreshKey: number }) {
  const supabase = createBrowserSupabase();
  const [friends, setFriends] = useState<Profile[]>([]);
  const [requests, setRequests] = useState<
    { friendship: Friendship; profile: Profile }[]
  >([]);

  function reload() {
    listFriends(supabase).then(setFriends).catch(console.error);
    listIncomingRequests(supabase).then(setRequests).catch(console.error);
  }
  useEffect(reload, [refreshKey]);

  return (
    <div className="space-y-4">
      {requests.length > 0 && (
        <section className="space-y-2">
          <h2 className="font-semibold text-sm">받은 요청</h2>
          {requests.map(({ friendship, profile }) => (
            <div
              key={friendship.id}
              className="flex items-center gap-2 rounded-xl border p-3"
            >
              <span
                className="w-8 h-8 rounded-full"
                style={{ backgroundColor: profile.avatar_color }}
              />
              <span className="flex-1">{profile.nickname}</span>
              <button
                onClick={async () => {
                  await acceptFriend(supabase, friendship.id);
                  reload();
                }}
                className="rounded-full bg-pastel-mint px-3 py-1 text-sm"
              >
                수락
              </button>
            </div>
          ))}
        </section>
      )}
      <section className="space-y-2">
        <h2 className="font-semibold text-sm">내 친구</h2>
        {friends.length === 0 && (
          <p className="text-sm text-pastel-ink/50">아직 친구가 없어요</p>
        )}
        {friends.map((f) => (
          <Link
            key={f.id}
            href={`/friends/${f.id}`}
            className="flex items-center gap-2 rounded-xl border p-3"
          >
            <span
              className="w-8 h-8 rounded-full"
              style={{ backgroundColor: f.avatar_color }}
            />
            <span className="flex-1">{f.nickname}</span>
            <span className="text-pastel-ink/40">›</span>
          </Link>
        ))}
      </section>
    </div>
  );
}
