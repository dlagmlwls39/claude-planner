"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabase } from "@/lib/supabase/client";
import { ensureProfile } from "@/lib/supabase/friends";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createBrowserSupabase();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        await ensureProfile(supabase, nickname.trim());
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      router.push("/calendar");
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했어요");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-pastel-cream flex items-center justify-center px-6">
      <form onSubmit={handleSubmit} className="w-full max-w-[480px] space-y-4">
        <h1 className="text-2xl font-bold text-center text-pastel-ink">
          {mode === "login" ? "로그인" : "회원가입"}
        </h1>
        {mode === "signup" && (
          <input
            className="w-full rounded-2xl border px-4 py-3"
            placeholder="닉네임"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            required
          />
        )}
        <input
          className="w-full rounded-2xl border px-4 py-3"
          type="email"
          placeholder="이메일"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          className="w-full rounded-2xl border px-4 py-3"
          type="password"
          placeholder="비밀번호"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button
          className="w-full rounded-2xl bg-pastel-pink py-3 font-semibold disabled:opacity-50"
          disabled={loading}
        >
          {mode === "login" ? "로그인" : "가입하기"}
        </button>
        <button
          type="button"
          className="w-full text-sm text-pastel-ink/60"
          onClick={() => setMode(mode === "login" ? "signup" : "login")}
        >
          {mode === "login" ? "계정이 없나요? 회원가입" : "이미 계정이 있나요? 로그인"}
        </button>
      </form>
    </main>
  );
}
