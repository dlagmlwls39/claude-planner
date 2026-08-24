"use client";
import { useState } from "react";
import { FriendSearch } from "@/components/friends/FriendSearch";
import { FriendList } from "@/components/friends/FriendList";

export default function FriendsPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  return (
    <div className="px-4 pt-6 space-y-5">
      <h1 className="text-2xl font-bold text-ink">친구</h1>
      <FriendSearch onRequested={() => setRefreshKey((k) => k + 1)} />
      <FriendList refreshKey={refreshKey} />
    </div>
  );
}
