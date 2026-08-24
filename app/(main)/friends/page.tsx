"use client";
import { useState } from "react";
import { FriendSearch } from "@/components/friends/FriendSearch";
import { FriendList } from "@/components/friends/FriendList";

export default function FriendsPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  return (
    <div className="p-4 space-y-4">
      <h1 className="font-bold text-lg">친구</h1>
      <FriendSearch onRequested={() => setRefreshKey((k) => k + 1)} />
      <FriendList refreshKey={refreshKey} />
    </div>
  );
}
