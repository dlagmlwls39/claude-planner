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
          className="flex-1 rounded-xl border px-3 py-2"
          placeholder="닉네임 또는 친구코드"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <button className="rounded-xl bg-pastel-pink px-4 font-semibold">검색</button>
      </form>
      {result && (
        <div className="flex items-center gap-2 rounded-xl border p-3">
          <span
            className="w-8 h-8 rounded-full"
            style={{ backgroundColor: result.avatar_color }}
          />
          <span className="flex-1">{result.nickname}</span>
          <button
            onClick={request}
            className="rounded-full bg-pastel-mint px-3 py-1 text-sm"
          >
            요청
          </button>
        </div>
      )}
      {msg && <p className="text-sm text-pastel-ink/60">{msg}</p>}
    </div>
  );
}
