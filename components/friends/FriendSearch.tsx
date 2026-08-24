"use client";
import { useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase/client";
import { findProfile, sendFriendRequest } from "@/lib/supabase/friends";
import type { Profile } from "@/lib/types";

export function FriendSearch({ onRequested }: { onRequested: () => void }) {
  const supabase = createBrowserSupabase();
  const [q, setQ] = useState("");
  const [result, setResult] = useState<Profile | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function search(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    const p = await findProfile(supabase, q);
    setResult(p);
    if (!p) setMsg("찾을 수 없어요");
  }

  async function request() {
    if (!result) return;
    try {
      await sendFriendRequest(supabase, result.id);
      setMsg("친구 요청을 보냈어요!");
      setResult(null);
      setQ("");
      onRequested();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "실패했어요");
    }
  }

  return (
    <div className="space-y-2">
      <form onSubmit={search} className="flex gap-2">
        <input
          className="field flex-1"
          placeholder="닉네임 또는 친구코드"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <button className="btn btn-primary px-4">검색</button>
      </form>
      {result && (
        <div className="card flex items-center gap-3 p-3.5">
          <span
            className="w-9 h-9 rounded-full ring-2 ring-white shadow-sm"
            style={{ backgroundColor: result.avatar_color }}
          />
          <span className="flex-1 text-ink font-medium">{result.nickname}</span>
          <button onClick={request} className="btn btn-mint px-4 py-1.5 text-sm">
            요청
          </button>
        </div>
      )}
      {msg && <p className="text-sm text-ink/55">{msg}</p>}
    </div>
  );
}
