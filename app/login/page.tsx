"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabase } from "@/lib/supabase/client";
import { ensureProfile } from "@/lib/supabase/friends";
import { translateAuthError } from "@/lib/auth-errors";
import { CalendarIcon } from "@/components/ui/icons";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createBrowserSupabase();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (!data.session) {
          // 이메일 인증이 켜져 있어 아직 세션이 없음.
          // 닉네임은 인증 후 첫 로그인 때 프로필로 만든다.
          localStorage.setItem("pending_nickname", nickname.trim());
          setConfirmEmail(email);
          return;
        }
        await ensureProfile(supabase, nickname.trim());
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        const pending = localStorage.getItem("pending_nickname")?.trim();
        await ensureProfile(supabase, pending || email.split("@")[0]);
        localStorage.removeItem("pending_nickname");
      }
      router.push("/calendar");
    } catch (err) {
      setError(translateAuthError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-cream flex items-center justify-center px-6">
      <div className="w-full max-w-[400px]">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-3xl bg-brand text-white shadow-sm">
            <CalendarIcon className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-extrabold text-ink">
            {mode === "login" ? "다시 만나서 반가워요" : "함께 시작해요"}
          </h1>
          <p className="mt-1 text-sm text-ink/50">친구와 나누는 일정 다이어리</p>
        </div>
        <form onSubmit={handleSubmit} className="card space-y-3 p-6">
          {mode === "signup" && (
            <input
              className="field"
              placeholder="닉네임"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              required
            />
          )}
          <input
            className="field"
            type="email"
            placeholder="이메일"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            className="field"
            type="password"
            placeholder="비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && <p className="text-sm text-rose-400">{error}</p>}
          <button
            className="btn btn-primary w-full py-3"
            disabled={loading}
          >
            {loading ? "잠시만요…" : mode === "login" ? "로그인" : "가입하기"}
          </button>
          <button
            type="button"
            className="w-full text-sm text-ink/55 hover:text-brand-dark"
            onClick={() => setMode(mode === "login" ? "signup" : "login")}
          >
            {mode === "login" ? "계정이 없나요? 회원가입" : "이미 계정이 있나요? 로그인"}
          </button>
        </form>
      </div>

      {confirmEmail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
          <div
            className="absolute inset-0 bg-ink/30 backdrop-blur-[1px]"
            onClick={() => {
              setConfirmEmail(null);
              setMode("login");
            }}
          />
          <div className="card relative w-full max-w-[340px] p-6 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-soft text-2xl">
              📮
            </div>
            <h2 className="text-lg font-bold text-ink">이메일 인증을 진행해 주세요</h2>
            <p className="mt-2 text-sm leading-relaxed text-ink/60">
              <b className="text-brand-dark">{confirmEmail}</b> 로
              <br />
              인증 메일을 보냈어요. 메일함에서 링크를 눌러
              <br />
              인증을 완료한 뒤 로그인해 주세요.
            </p>
            <button
              className="btn btn-primary mt-5 w-full py-3"
              onClick={() => {
                setConfirmEmail(null);
                setMode("login");
              }}
            >
              확인
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
