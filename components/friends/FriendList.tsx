"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { createBrowserSupabase } from "@/lib/supabase/client";
import { listFriends, listIncomingRequests, acceptFriend } from "@/lib/supabase/friends";
import { Avatar } from "@/components/ui/Avatar";
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
          <h2 className="text-sm font-semibold text-ink/70">받은 요청</h2>
          {requests.map(({ friendship, profile }) => (
            <div
              key={friendship.id}
              className="card flex items-center gap-3 p-3.5"
            >
              <Avatar url={profile.avatar_url} color={profile.avatar_color} nickname={profile.nickname} />
              <span className="flex-1 text-ink font-medium">{profile.nickname}</span>
              <button
                onClick={async () => {
                  await acceptFriend(supabase, friendship.id);
                  reload();
                }}
                className="btn btn-mint px-4 py-1.5 text-sm"
              >
                수락
              </button>
            </div>
          ))}
        </section>
      )}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-ink/70">내 친구</h2>
        {friends.length === 0 && (
          <p className="text-sm text-ink/45">아직 친구가 없어요</p>
        )}
        {friends.map((f) => (
          <Link
            key={f.id}
            href={`/friends/${f.id}`}
            className="card flex items-center gap-3 p-3.5 transition-transform active:scale-[0.99]"
          >
            <Avatar url={f.avatar_url} color={f.avatar_color} nickname={f.nickname} />
            <span className="flex-1 text-ink font-medium">{f.nickname}</span>
            <span className="text-brand-dark/50">›</span>
          </Link>
        ))}
      </section>
    </div>
  );
}
