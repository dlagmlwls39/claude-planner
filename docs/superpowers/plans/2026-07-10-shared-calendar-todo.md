# 공유 캘린더 + 투두 앱 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 친구와 공개 일정을 공유하는 캘린더 + 개인 투두리스트를 갖춘 모바일 전용 웹앱을 Next.js + Supabase + Vercel로 만든다.

**Architecture:** Next.js(App Router) 클라이언트가 Supabase(Auth/Postgres/RLS)와 직접 통신한다. 별도 백엔드 서버는 없고, 보안은 RLS 정책으로 강제한다. UI는 모바일 고정 폭 + 하단 탭바 + 바텀시트로 앱처럼 구성한다.

**Tech Stack:** Next.js 14+(App Router), TypeScript, Tailwind CSS, Supabase JS v2, Vitest + React Testing Library, Vercel.

## Global Constraints

- 모바일 전용: 데스크톱 레이아웃 없음. 최대 폭 `max-w-[480px]` 가운데 정렬.
- 로그인: 이메일 + 비밀번호만. 추가 개인정보 수집 금지.
- 일정 기본값 `is_public=false`. 친구에겐 `is_public=true`인 일정만 노출 — RLS로 강제.
- 비밀 키 금지: `.env.local`의 `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`만 사용. service_role 키는 클라이언트에 넣지 않음.
- 커밋 규칙: `타입: 설명` (feat/fix/docs/style/refactor/chore).
- 파스텔 팔레트는 `tailwind.config.ts`에 정의해 재사용.
- 상세 설계 근거는 [build.md](../../../build.md) 참고.

---

## 파일 구조 (완성 시)

```
app/
  layout.tsx                  루트 레이아웃 (폰트, 전역 스타일)
  page.tsx                    "/" → 세션 있으면 /calendar, 없으면 /login 리다이렉트
  login/page.tsx              로그인·회원가입
  (main)/layout.tsx           인증 가드 + 하단 탭바
  (main)/calendar/page.tsx    내 캘린더 (메인)
  (main)/friends/page.tsx     친구 목록·검색·요청
  (main)/friends/[id]/page.tsx 친구 캘린더 (읽기 전용)
  (main)/todos/page.tsx       상시 투두
  (main)/profile/page.tsx     내 정보
components/
  calendar/MonthGrid.tsx      월 그리드
  calendar/DayCell.tsx        날짜 셀 + 일정 점
  calendar/DaySheet.tsx       날짜 상세 바텀시트 (일정 + 그날 투두)
  calendar/EventForm.tsx      일정 추가/수정 폼
  todos/TodoItem.tsx          투두 한 줄
  friends/FriendSearch.tsx    친구 검색·요청
  friends/FriendList.tsx      친구/요청 목록
  ui/BottomTabBar.tsx         하단 탭바
  ui/BottomSheet.tsx          공통 바텀시트
  ui/Button.tsx               파스텔 버튼
lib/
  supabase/client.ts          브라우저 Supabase 클라이언트
  supabase/server.ts          서버 컴포넌트용 클라이언트
  supabase/events.ts          events 쿼리 함수
  supabase/todos.ts           todos 쿼리 함수
  supabase/friends.ts         friendships/profiles 쿼리 함수
  date.ts                     날짜 유틸 (월 그리드 계산, 포맷)
  types.ts                    공용 타입
supabase/migrations/
  0001_init.sql               테이블 + RLS
```

---

## Task 1: 프로젝트 스캐폴딩 (Next.js + Tailwind + Vitest)

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.mjs`, `tailwind.config.ts`, `postcss.config.mjs`, `vitest.config.ts`, `vitest.setup.ts`
- Create: `app/layout.tsx`, `app/globals.css`, `app/page.tsx`
- Create: `lib/date.ts`, `tests/date.test.ts`

**Interfaces:**
- Produces: `lib/date.ts` → `getMonthMatrix(year: number, month: number): Date[][]` (6주×7일 그리드, month는 0-based), `toISODate(d: Date): string` ("YYYY-MM-DD"), `isSameDay(a: Date, b: Date): boolean`.

- [ ] **Step 1: Next.js 앱 초기화**

```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir=false --import-alias "@/*" --no-turbopack
```
프롬프트가 뜨면 기본값 수락. 완료 후 `app/`, `tailwind.config.ts`, `package.json` 생성 확인.

- [ ] **Step 2: 테스트 도구 설치**

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom @vitejs/plugin-react
```

- [ ] **Step 3: Vitest 설정 작성**

`vitest.config.ts`:
```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
  },
  resolve: { alias: { "@": path.resolve(__dirname, ".") } },
});
```

`vitest.setup.ts`:
```ts
import "@testing-library/jest-dom/vitest";
```

`package.json`의 `scripts`에 추가:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 4: 날짜 유틸 실패 테스트 작성**

`tests/date.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { getMonthMatrix, toISODate, isSameDay } from "@/lib/date";

describe("date utils", () => {
  it("toISODate: 로컬 날짜를 YYYY-MM-DD로 포맷", () => {
    expect(toISODate(new Date(2026, 6, 10))).toBe("2026-07-10");
  });

  it("isSameDay: 같은 날이면 true", () => {
    expect(isSameDay(new Date(2026, 6, 10, 9), new Date(2026, 6, 10, 22))).toBe(true);
    expect(isSameDay(new Date(2026, 6, 10), new Date(2026, 6, 11))).toBe(false);
  });

  it("getMonthMatrix: 6주 x 7일 그리드, 일요일 시작", () => {
    const m = getMonthMatrix(2026, 6); // 2026년 7월
    expect(m).toHaveLength(6);
    expect(m[0]).toHaveLength(7);
    // 2026-07-01은 수요일 → 첫 주 첫 칸(일요일)은 6/28
    expect(toISODate(m[0][0])).toBe("2026-06-28");
  });
});
```

- [ ] **Step 5: 테스트 실패 확인**

Run: `npm test -- date`
Expected: FAIL — `getMonthMatrix`/`toISODate`/`isSameDay` 미정의.

- [ ] **Step 6: 날짜 유틸 구현**

`lib/date.ts`:
```ts
export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function getMonthMatrix(year: number, month: number): Date[][] {
  const first = new Date(year, month, 1);
  const start = new Date(first);
  start.setDate(1 - first.getDay()); // 그 주의 일요일로 이동
  const weeks: Date[][] = [];
  for (let w = 0; w < 6; w++) {
    const week: Date[] = [];
    for (let d = 0; d < 7; d++) {
      week.push(new Date(start.getFullYear(), start.getMonth(), start.getDate() + w * 7 + d));
    }
    weeks.push(week);
  }
  return weeks;
}
```

- [ ] **Step 7: 테스트 통과 확인**

Run: `npm test -- date`
Expected: PASS (3 tests).

- [ ] **Step 8: 루트 리다이렉트 페이지 작성**

`app/page.tsx`:
```tsx
import { redirect } from "next/navigation";

export default function Home() {
  redirect("/calendar");
}
```
(세션 검사는 Task 4의 `(main)/layout.tsx`가 담당 — 미로그인 시 /login으로 보냄.)

- [ ] **Step 9: 개발 서버로 부팅 확인 후 커밋**

Run: `npm run dev` → http://localhost:3000 접속해 에러 없이 뜨는지 확인 후 종료.
```bash
git add -A
git commit -m "chore: Next.js + Tailwind + Vitest 스캐폴딩 및 날짜 유틸"
```

---

## Task 2: Supabase 스키마 + RLS 마이그레이션

**Files:**
- Create: `supabase/migrations/0001_init.sql`
- Create: `lib/types.ts`

**Interfaces:**
- Produces: 테이블 `profiles`, `events`, `todos`, `friendships` + RLS 정책. `lib/types.ts`에 각 행 타입(`Profile`, `EventRow`, `TodoRow`, `Friendship`).

- [ ] **Step 1: 마이그레이션 SQL 작성**

`supabase/migrations/0001_init.sql`:
```sql
-- profiles
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nickname text unique not null,
  friend_code text unique not null,
  avatar_color text not null default '#FBCFE8',
  created_at timestamptz not null default now()
);

-- events
create table events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  date date not null,
  start_time time,
  end_time time,
  is_all_day boolean not null default true,
  color text not null default '#A7F3D0',
  memo text,
  is_public boolean not null default false,
  created_at timestamptz not null default now()
);
create index events_user_date_idx on events(user_id, date);

-- todos
create table todos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  date date,
  is_done boolean not null default false,
  created_at timestamptz not null default now()
);
create index todos_user_date_idx on todos(user_id, date);

-- friendships
create table friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references auth.users(id) on delete cascade,
  addressee_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','accepted')),
  created_at timestamptz not null default now(),
  unique (requester_id, addressee_id)
);

-- RLS 활성화
alter table profiles enable row level security;
alter table events enable row level security;
alter table todos enable row level security;
alter table friendships enable row level security;

-- 두 사용자가 accepted 친구인지 확인하는 헬퍼
create or replace function are_friends(a uuid, b uuid)
returns boolean language sql stable security definer as $$
  select exists(
    select 1 from friendships f
    where f.status = 'accepted'
      and ((f.requester_id = a and f.addressee_id = b)
        or (f.requester_id = b and f.addressee_id = a))
  );
$$;

-- profiles: 누구나 조회 가능(닉네임/코드 검색용, 민감정보 없음). 본인만 수정.
create policy profiles_select_all on profiles for select using (true);
create policy profiles_insert_self on profiles for insert with check (auth.uid() = id);
create policy profiles_update_self on profiles for update using (auth.uid() = id);

-- events: 본인 전부 / 친구는 공개된 것만
create policy events_select_own on events for select using (auth.uid() = user_id);
create policy events_select_friends_public on events for select
  using (is_public = true and are_friends(auth.uid(), user_id));
create policy events_insert_own on events for insert with check (auth.uid() = user_id);
create policy events_update_own on events for update using (auth.uid() = user_id);
create policy events_delete_own on events for delete using (auth.uid() = user_id);

-- todos: 본인만
create policy todos_all_own on todos for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- friendships: 당사자만 조회/생성/수정/삭제
create policy friendships_select_party on friendships for select
  using (auth.uid() = requester_id or auth.uid() = addressee_id);
create policy friendships_insert_requester on friendships for insert
  with check (auth.uid() = requester_id);
create policy friendships_update_party on friendships for update
  using (auth.uid() = requester_id or auth.uid() = addressee_id);
create policy friendships_delete_party on friendships for delete
  using (auth.uid() = requester_id or auth.uid() = addressee_id);
```

- [ ] **Step 2: Supabase 프로젝트에 적용**

Supabase 대시보드 → SQL Editor에 위 SQL 붙여넣고 실행. (또는 Supabase CLI 사용 시 `supabase db push`.)
Expected: 4개 테이블 + 정책 생성, 에러 없음.

- [ ] **Step 3: 공용 타입 작성**

`lib/types.ts`:
```ts
export type Profile = {
  id: string;
  nickname: string;
  friend_code: string;
  avatar_color: string;
  created_at: string;
};

export type EventRow = {
  id: string;
  user_id: string;
  title: string;
  date: string;          // YYYY-MM-DD
  start_time: string | null;
  end_time: string | null;
  is_all_day: boolean;
  color: string;
  memo: string | null;
  is_public: boolean;
  created_at: string;
};

export type TodoRow = {
  id: string;
  user_id: string;
  title: string;
  date: string | null;   // null이면 상시 투두
  is_done: boolean;
  created_at: string;
};

export type Friendship = {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: "pending" | "accepted";
  created_at: string;
};
```

- [ ] **Step 4: 커밋**

```bash
git add supabase/migrations/0001_init.sql lib/types.ts
git commit -m "feat: Supabase 스키마 및 RLS 정책, 공용 타입 추가"
```

---

## Task 3: Supabase 클라이언트 + 환경변수

**Files:**
- Create: `lib/supabase/client.ts`, `lib/supabase/server.ts`
- Create: `.env.local.example`
- Modify: `.gitignore` (이미 `.env*.local` 포함 — 확인만)

**Interfaces:**
- Produces: `createBrowserSupabase()` (client.ts), `createServerSupabase()` (server.ts). 반환값은 `@supabase/supabase-js`의 `SupabaseClient`.

- [ ] **Step 1: 패키지 설치**

```bash
npm install @supabase/supabase-js @supabase/ssr
```

- [ ] **Step 2: 환경변수 예시 파일 작성**

`.env.local.example`:
```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR-ANON-KEY
```
실제 값은 `.env.local`에 넣는다(커밋 금지). Supabase 대시보드 → Project Settings → API에서 복사.

- [ ] **Step 3: 브라우저 클라이언트 작성**

`lib/supabase/client.ts`:
```ts
import { createBrowserClient } from "@supabase/ssr";

export function createBrowserSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

- [ ] **Step 4: 서버 클라이언트 작성**

`lib/supabase/server.ts`:
```ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createServerSupabase() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (list) => {
          list.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    }
  );
}
```

- [ ] **Step 5: 빌드 확인 후 커밋**

Run: `npm run build`
Expected: 타입 에러 없이 성공(환경변수 미설정이어도 빌드는 통과).
```bash
git add lib/supabase/ .env.local.example
git commit -m "feat: Supabase 브라우저/서버 클라이언트 및 env 예시"
```

---

## Task 4: 인증 (회원가입 / 로그인 / 로그아웃) + 프로필 생성

**Files:**
- Create: `app/login/page.tsx`
- Create: `lib/supabase/friends.ts` (프로필 생성/조회 일부 여기서 시작)
- Create: `lib/friend-code.ts`, `tests/friend-code.test.ts`

**Interfaces:**
- Consumes: `createBrowserSupabase()` (Task 3).
- Produces: `generateFriendCode(): string` (6자리 대문자+숫자), `ensureProfile(supabase, nickname): Promise<void>` (없으면 profiles insert).

- [ ] **Step 1: friend-code 실패 테스트 작성**

`tests/friend-code.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { generateFriendCode } from "@/lib/friend-code";

describe("generateFriendCode", () => {
  it("6자리 대문자+숫자", () => {
    const code = generateFriendCode();
    expect(code).toMatch(/^[A-Z0-9]{6}$/);
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npm test -- friend-code`
Expected: FAIL — `generateFriendCode` 미정의.

- [ ] **Step 3: friend-code 구현**

`lib/friend-code.ts`:
```ts
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // 헷갈리는 0,O,1,I 제외

export function generateFriendCode(): string {
  let code = "";
  const bytes = crypto.getRandomValues(new Uint32Array(6));
  for (let i = 0; i < 6; i++) {
    code += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return code;
}
```

- [ ] **Step 4: 통과 확인**

Run: `npm test -- friend-code`
Expected: PASS.

- [ ] **Step 5: 프로필 보장 헬퍼 작성**

`lib/supabase/friends.ts` (초기 버전, 이후 Task 8에서 확장):
```ts
import type { SupabaseClient } from "@supabase/supabase-js";
import { generateFriendCode } from "@/lib/friend-code";

export async function ensureProfile(
  supabase: SupabaseClient,
  nickname: string
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("no session");

  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();
  if (existing) return;

  await supabase.from("profiles").insert({
    id: user.id,
    nickname,
    friend_code: generateFriendCode(),
  });
}
```

- [ ] **Step 6: 로그인/회원가입 화면 작성**

`app/login/page.tsx`:
```tsx
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
          type="email" placeholder="이메일"
          value={email} onChange={(e) => setEmail(e.target.value)} required
        />
        <input
          className="w-full rounded-2xl border px-4 py-3"
          type="password" placeholder="비밀번호"
          value={password} onChange={(e) => setPassword(e.target.value)} required
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
```
(`pastel-*` 색은 Task 10에서 tailwind.config에 정의. 그 전까지는 임시로 보여도 무방.)

- [ ] **Step 7: 수동 확인 후 커밋**

Run: `npm run dev` → `.env.local`에 Supabase 키를 넣은 상태에서 회원가입 → profiles 테이블에 행이 생기는지 대시보드에서 확인. 로그인/로그아웃 흐름 확인.
```bash
git add app/login lib/friend-code.ts lib/supabase/friends.ts tests/friend-code.test.ts
git commit -m "feat: 이메일 회원가입/로그인 및 프로필 자동 생성"
```

---

## Task 5: 앱 셸 — 인증 가드 + 하단 탭바

**Files:**
- Create: `app/(main)/layout.tsx`
- Create: `components/ui/BottomTabBar.tsx`

**Interfaces:**
- Consumes: `createServerSupabase()` (Task 3).
- Produces: `(main)` 그룹의 공통 레이아웃(미로그인 시 `/login` 리다이렉트) + 하단 탭바.

- [ ] **Step 1: 하단 탭바 컴포넌트 작성**

`components/ui/BottomTabBar.tsx`:
```tsx
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/calendar", label: "캘린더", icon: "📅" },
  { href: "/friends", label: "친구", icon: "👭" },
  { href: "/todos", label: "투두", icon: "✅" },
  { href: "/profile", label: "내정보", icon: "🐰" },
];

export function BottomTabBar() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 inset-x-0 mx-auto max-w-[480px] border-t bg-white/90 backdrop-blur flex">
      {TABS.map((t) => {
        const active = pathname.startsWith(t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`flex-1 flex flex-col items-center py-2 text-xs ${
              active ? "text-pastel-pinkdark font-semibold" : "text-pastel-ink/50"
            }`}
          >
            <span className="text-xl">{t.icon}</span>
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
```

- [ ] **Step 2: 인증 가드 레이아웃 작성**

`app/(main)/layout.tsx`:
```tsx
import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { BottomTabBar } from "@/components/ui/BottomTabBar";

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="mx-auto max-w-[480px] min-h-screen bg-pastel-cream pb-16">
      {children}
      <BottomTabBar />
    </div>
  );
}
```

- [ ] **Step 3: 임시 페이지로 라우팅 확인**

각 탭 페이지를 최소 stub으로 생성해 탭 이동 확인:
`app/(main)/calendar/page.tsx`, `app/(main)/friends/page.tsx`, `app/(main)/todos/page.tsx`, `app/(main)/profile/page.tsx` — 각각:
```tsx
export default function Page() {
  return <div className="p-4">준비 중</div>;
}
```

- [ ] **Step 4: 수동 확인 후 커밋**

Run: `npm run dev` → 로그아웃 상태로 `/calendar` 접근 시 `/login`으로 튕기는지, 로그인 후 탭 이동 되는지 확인.
```bash
git add "app/(main)" components/ui/BottomTabBar.tsx
git commit -m "feat: 인증 가드 레이아웃 및 하단 탭바"
```

---

## Task 6: 캘린더 월 그리드 + 일정 조회

**Files:**
- Create: `components/calendar/MonthGrid.tsx`, `components/calendar/DayCell.tsx`
- Create: `lib/supabase/events.ts`
- Create: `tests/month-grid.test.tsx`
- Modify: `app/(main)/calendar/page.tsx`

**Interfaces:**
- Consumes: `getMonthMatrix`, `toISODate`, `isSameDay` (Task 1), `EventRow` (Task 2), `createBrowserSupabase` (Task 3).
- Produces: `listMyEventsInRange(supabase, startISO, endISO): Promise<EventRow[]>`, `<MonthGrid year month events selectedDate onSelectDate />`, `<DayCell date events isSelected isToday onClick />`.

- [ ] **Step 1: events 조회 함수 작성**

`lib/supabase/events.ts`:
```ts
import type { SupabaseClient } from "@supabase/supabase-js";
import type { EventRow } from "@/lib/types";

export async function listMyEventsInRange(
  supabase: SupabaseClient,
  startISO: string,
  endISO: string
): Promise<EventRow[]> {
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .gte("date", startISO)
    .lte("date", endISO)
    .order("date");
  if (error) throw error;
  return (data ?? []) as EventRow[];
}
```

- [ ] **Step 2: MonthGrid 렌더 실패 테스트 작성**

`tests/month-grid.test.tsx`:
```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MonthGrid } from "@/components/calendar/MonthGrid";

describe("MonthGrid", () => {
  it("해당 월의 날짜 숫자를 렌더한다", () => {
    render(
      <MonthGrid
        year={2026}
        month={6}
        events={[]}
        selectedDate={new Date(2026, 6, 10)}
        onSelectDate={vi.fn()}
      />
    );
    // 7월 15일 셀 존재
    expect(screen.getByText("15")).toBeInTheDocument();
  });

  it("일정이 있는 날에는 점(dot)을 표시한다", () => {
    render(
      <MonthGrid
        year={2026}
        month={6}
        events={[
          { id: "1", user_id: "u", title: "회의", date: "2026-07-10",
            start_time: null, end_time: null, is_all_day: true,
            color: "#A7F3D0", memo: null, is_public: false, created_at: "" },
        ]}
        selectedDate={new Date(2026, 6, 10)}
        onSelectDate={vi.fn()}
      />
    );
    expect(screen.getByTestId("dot-2026-07-10")).toBeInTheDocument();
  });
});
```

- [ ] **Step 3: 실패 확인**

Run: `npm test -- month-grid`
Expected: FAIL — 컴포넌트 미정의.

- [ ] **Step 4: DayCell 구현**

`components/calendar/DayCell.tsx`:
```tsx
import type { EventRow } from "@/lib/types";
import { toISODate } from "@/lib/date";

export function DayCell({
  date, events, isSelected, isToday, inMonth, onClick,
}: {
  date: Date;
  events: EventRow[];
  isSelected: boolean;
  isToday: boolean;
  inMonth: boolean;
  onClick: () => void;
}) {
  const iso = toISODate(date);
  return (
    <button
      onClick={onClick}
      className={`aspect-square rounded-2xl flex flex-col items-center justify-start pt-1 text-sm
        ${isSelected ? "bg-pastel-pink/60" : "hover:bg-pastel-pink/20"}
        ${inMonth ? "text-pastel-ink" : "text-pastel-ink/30"}`}
    >
      <span className={isToday ? "rounded-full bg-pastel-pinkdark text-white w-6 h-6 flex items-center justify-center" : ""}>
        {date.getDate()}
      </span>
      <span className="flex gap-0.5 mt-0.5">
        {events.slice(0, 3).map((e) => (
          <span
            key={e.id}
            data-testid={`dot-${iso}`}
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: e.color }}
          />
        ))}
      </span>
    </button>
  );
}
```

- [ ] **Step 5: MonthGrid 구현**

`components/calendar/MonthGrid.tsx`:
```tsx
"use client";
import type { EventRow } from "@/lib/types";
import { getMonthMatrix, toISODate, isSameDay } from "@/lib/date";
import { DayCell } from "./DayCell";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

export function MonthGrid({
  year, month, events, selectedDate, onSelectDate,
}: {
  year: number;
  month: number;
  events: EventRow[];
  selectedDate: Date;
  onSelectDate: (d: Date) => void;
}) {
  const matrix = getMonthMatrix(year, month);
  const today = new Date();
  const byDate = new Map<string, EventRow[]>();
  for (const e of events) {
    const arr = byDate.get(e.date) ?? [];
    arr.push(e);
    byDate.set(e.date, arr);
  }

  return (
    <div className="px-3">
      <div className="grid grid-cols-7 text-center text-xs text-pastel-ink/50 mb-1">
        {WEEKDAYS.map((w) => <div key={w}>{w}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {matrix.flat().map((d) => (
          <DayCell
            key={toISODate(d)}
            date={d}
            events={byDate.get(toISODate(d)) ?? []}
            isSelected={isSameDay(d, selectedDate)}
            isToday={isSameDay(d, today)}
            inMonth={d.getMonth() === month}
            onClick={() => onSelectDate(d)}
          />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 6: 통과 확인**

Run: `npm test -- month-grid`
Expected: PASS (2 tests).

- [ ] **Step 7: 캘린더 페이지에 연결**

`app/(main)/calendar/page.tsx`:
```tsx
"use client";
import { useEffect, useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase/client";
import { listMyEventsInRange } from "@/lib/supabase/events";
import { getMonthMatrix, toISODate } from "@/lib/date";
import { MonthGrid } from "@/components/calendar/MonthGrid";
import type { EventRow } from "@/lib/types";

export default function CalendarPage() {
  const supabase = createBrowserSupabase();
  const [cursor, setCursor] = useState(new Date());
  const [selected, setSelected] = useState(new Date());
  const [events, setEvents] = useState<EventRow[]>([]);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();

  useEffect(() => {
    const matrix = getMonthMatrix(year, month);
    const startISO = toISODate(matrix[0][0]);
    const endISO = toISODate(matrix[5][6]);
    listMyEventsInRange(supabase, startISO, endISO).then(setEvents).catch(console.error);
  }, [year, month]);

  return (
    <div className="pt-4">
      <header className="flex items-center justify-between px-5 mb-3">
        <button onClick={() => setCursor(new Date(year, month - 1, 1))}>‹</button>
        <h1 className="font-bold">{year}년 {month + 1}월</h1>
        <button onClick={() => setCursor(new Date(year, month + 1, 1))}>›</button>
      </header>
      <MonthGrid
        year={year} month={month} events={events}
        selectedDate={selected} onSelectDate={setSelected}
      />
    </div>
  );
}
```

- [ ] **Step 8: 커밋**

```bash
git add components/calendar "app/(main)/calendar" lib/supabase/events.ts tests/month-grid.test.tsx
git commit -m "feat: 월 캘린더 그리드 및 내 일정 조회"
```

---

## Task 7: 일정 상세 바텀시트 + 추가/수정/삭제

**Files:**
- Create: `components/ui/BottomSheet.tsx`, `components/calendar/DaySheet.tsx`, `components/calendar/EventForm.tsx`
- Modify: `lib/supabase/events.ts` (create/update/delete 추가)
- Modify: `app/(main)/calendar/page.tsx` (선택 날짜 시트 열기)

**Interfaces:**
- Consumes: `EventRow` (Task 2), `listMyEventsInRange` (Task 6).
- Produces: `createEvent(supabase, input): Promise<EventRow>`, `updateEvent(supabase, id, patch): Promise<void>`, `deleteEvent(supabase, id): Promise<void>`. `<BottomSheet open onClose>`, `<DaySheet date events onChanged onClose>`.

- [ ] **Step 1: events CRUD 함수 추가**

`lib/supabase/events.ts`에 추가:
```ts
export type EventInput = {
  title: string;
  date: string;
  start_time: string | null;
  end_time: string | null;
  is_all_day: boolean;
  color: string;
  memo: string | null;
  is_public: boolean;
};

export async function createEvent(
  supabase: SupabaseClient,
  input: EventInput
): Promise<EventRow> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("no session");
  const { data, error } = await supabase
    .from("events")
    .insert({ ...input, user_id: user.id })
    .select()
    .single();
  if (error) throw error;
  return data as EventRow;
}

export async function updateEvent(
  supabase: SupabaseClient,
  id: string,
  patch: Partial<EventInput>
): Promise<void> {
  const { error } = await supabase.from("events").update(patch).eq("id", id);
  if (error) throw error;
}

export async function deleteEvent(supabase: SupabaseClient, id: string): Promise<void> {
  const { error } = await supabase.from("events").delete().eq("id", id);
  if (error) throw error;
}
```

- [ ] **Step 2: 공통 바텀시트 컴포넌트 작성**

`components/ui/BottomSheet.tsx`:
```tsx
"use client";
export function BottomSheet({
  open, onClose, children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 mx-auto max-w-[480px]">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      <div className="absolute bottom-0 inset-x-0 rounded-t-3xl bg-white p-5 max-h-[80vh] overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: EventForm 컴포넌트 작성**

`components/calendar/EventForm.tsx`:
```tsx
"use client";
import { useState } from "react";
import type { EventRow } from "@/lib/types";
import type { EventInput } from "@/lib/supabase/events";

const COLORS = ["#A7F3D0", "#FBCFE8", "#DDD6FE", "#FDE68A", "#BFDBFE"];

export function EventForm({
  date, initial, onSubmit, onCancel,
}: {
  date: string;
  initial?: EventRow;
  onSubmit: (input: EventInput) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [isAllDay, setIsAllDay] = useState(initial?.is_all_day ?? true);
  const [start, setStart] = useState(initial?.start_time ?? "");
  const [end, setEnd] = useState(initial?.end_time ?? "");
  const [color, setColor] = useState(initial?.color ?? COLORS[0]);
  const [memo, setMemo] = useState(initial?.memo ?? "");
  const [isPublic, setIsPublic] = useState(initial?.is_public ?? false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit({
      title: title.trim(),
      date,
      is_all_day: isAllDay,
      start_time: isAllDay ? null : (start || null),
      end_time: isAllDay ? null : (end || null),
      color, memo: memo.trim() || null, is_public: isPublic,
    });
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <input className="w-full rounded-xl border px-3 py-2" placeholder="일정 제목"
        value={title} onChange={(e) => setTitle(e.target.value)} required />
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={isAllDay} onChange={(e) => setIsAllDay(e.target.checked)} />
        종일
      </label>
      {!isAllDay && (
        <div className="flex gap-2">
          <input type="time" className="flex-1 rounded-xl border px-3 py-2"
            value={start} onChange={(e) => setStart(e.target.value)} />
          <input type="time" className="flex-1 rounded-xl border px-3 py-2"
            value={end} onChange={(e) => setEnd(e.target.value)} />
        </div>
      )}
      <div className="flex gap-2">
        {COLORS.map((c) => (
          <button type="button" key={c} onClick={() => setColor(c)}
            className={`w-7 h-7 rounded-full ${color === c ? "ring-2 ring-pastel-ink" : ""}`}
            style={{ backgroundColor: c }} />
        ))}
      </div>
      <textarea className="w-full rounded-xl border px-3 py-2" placeholder="메모"
        value={memo} onChange={(e) => setMemo(e.target.value)} />
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} />
        친구에게 공개
      </label>
      <div className="flex gap-2 pt-2">
        <button type="button" onClick={onCancel}
          className="flex-1 rounded-xl bg-gray-100 py-2">취소</button>
        <button className="flex-1 rounded-xl bg-pastel-pink py-2 font-semibold">저장</button>
      </div>
    </form>
  );
}
```

- [ ] **Step 4: DaySheet 컴포넌트 작성**

`components/calendar/DaySheet.tsx`:
```tsx
"use client";
import { useState } from "react";
import type { EventRow } from "@/lib/types";
import { createBrowserSupabase } from "@/lib/supabase/client";
import { createEvent, updateEvent, deleteEvent, type EventInput } from "@/lib/supabase/events";
import { EventForm } from "./EventForm";

export function DaySheet({
  dateISO, events, onChanged,
}: {
  dateISO: string;
  events: EventRow[];
  onChanged: () => void;
}) {
  const supabase = createBrowserSupabase();
  const [editing, setEditing] = useState<EventRow | "new" | null>(null);

  async function handleSubmit(input: EventInput) {
    if (editing === "new") await createEvent(supabase, input);
    else if (editing) await updateEvent(supabase, editing.id, input);
    setEditing(null);
    onChanged();
  }

  async function handleDelete(id: string) {
    await deleteEvent(supabase, id);
    onChanged();
  }

  if (editing) {
    return (
      <EventForm
        date={dateISO}
        initial={editing === "new" ? undefined : editing}
        onSubmit={handleSubmit}
        onCancel={() => setEditing(null)}
      />
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="font-bold">{dateISO}</h2>
        <button onClick={() => setEditing("new")}
          className="rounded-full bg-pastel-pink px-3 py-1 text-sm font-semibold">+ 일정</button>
      </div>
      {events.length === 0 && <p className="text-sm text-pastel-ink/50 py-4">일정이 없어요</p>}
      {events.map((e) => (
        <div key={e.id} className="flex items-center gap-2 rounded-xl border p-3">
          <span className="w-2 h-8 rounded-full" style={{ backgroundColor: e.color }} />
          <div className="flex-1">
            <p className="font-medium">{e.title} {e.is_public && "🌷"}</p>
            {!e.is_all_day && <p className="text-xs text-pastel-ink/50">{e.start_time}~{e.end_time}</p>}
          </div>
          <button onClick={() => setEditing(e)} className="text-sm">수정</button>
          <button onClick={() => handleDelete(e.id)} className="text-sm text-red-400">삭제</button>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 5: 캘린더 페이지에 시트 연결**

`app/(main)/calendar/page.tsx` 수정 — 선택 날짜에 대한 시트를 연다. `import` 추가 후 return 부분 하단에 삽입:
```tsx
// 상단 import에 추가
import { BottomSheet } from "@/components/ui/BottomSheet";
import { DaySheet } from "@/components/calendar/DaySheet";
import { isSameDay } from "@/lib/date";

// 컴포넌트 내부 상태
const [sheetOpen, setSheetOpen] = useState(false);

// reload 함수로 useEffect 로직 분리
function reload() {
  const matrix = getMonthMatrix(year, month);
  listMyEventsInRange(supabase, toISODate(matrix[0][0]), toISODate(matrix[5][6]))
    .then(setEvents).catch(console.error);
}
useEffect(reload, [year, month]);

// onSelectDate 핸들러 교체
function handleSelect(d: Date) {
  setSelected(d);
  setSheetOpen(true);
}

// MonthGrid의 onSelectDate={handleSelect} 로 변경, return 마지막에 추가:
<BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)}>
  <DaySheet
    dateISO={toISODate(selected)}
    events={events.filter((e) => isSameDay(new Date(e.date + "T00:00"), selected))}
    onChanged={reload}
  />
</BottomSheet>
```

- [ ] **Step 6: 수동 확인 후 커밋**

Run: `npm run dev` → 날짜 탭 → 일정 추가/수정/삭제, 공개 토글, 색상 선택 동작 확인. 그리드에 점이 반영되는지 확인.
```bash
git add components lib/supabase/events.ts "app/(main)/calendar"
git commit -m "feat: 일정 상세 바텀시트 및 추가/수정/삭제"
```

---

## Task 8: 투두 (날짜별 + 상시)

**Files:**
- Create: `lib/supabase/todos.ts`, `components/todos/TodoItem.tsx`
- Modify: `components/calendar/DaySheet.tsx` (그날 투두 표시)
- Modify: `app/(main)/todos/page.tsx` (상시 투두)

**Interfaces:**
- Consumes: `TodoRow` (Task 2), `createBrowserSupabase` (Task 3).
- Produces: `listTodos(supabase, {date})`, `listStandingTodos(supabase)`, `createTodo(supabase, {title,date})`, `toggleTodo(supabase, id, done)`, `deleteTodo(supabase, id)`. `<TodoItem todo onToggle onDelete>`.

- [ ] **Step 1: todos 쿼리 함수 작성**

`lib/supabase/todos.ts`:
```ts
import type { SupabaseClient } from "@supabase/supabase-js";
import type { TodoRow } from "@/lib/types";

export async function listTodosByDate(supabase: SupabaseClient, dateISO: string): Promise<TodoRow[]> {
  const { data, error } = await supabase
    .from("todos").select("*").eq("date", dateISO).order("created_at");
  if (error) throw error;
  return (data ?? []) as TodoRow[];
}

export async function listStandingTodos(supabase: SupabaseClient): Promise<TodoRow[]> {
  const { data, error } = await supabase
    .from("todos").select("*").is("date", null).order("created_at");
  if (error) throw error;
  return (data ?? []) as TodoRow[];
}

export async function createTodo(
  supabase: SupabaseClient, title: string, dateISO: string | null
): Promise<TodoRow> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("no session");
  const { data, error } = await supabase
    .from("todos").insert({ title, date: dateISO, user_id: user.id }).select().single();
  if (error) throw error;
  return data as TodoRow;
}

export async function toggleTodo(supabase: SupabaseClient, id: string, done: boolean): Promise<void> {
  const { error } = await supabase.from("todos").update({ is_done: done }).eq("id", id);
  if (error) throw error;
}

export async function deleteTodo(supabase: SupabaseClient, id: string): Promise<void> {
  const { error } = await supabase.from("todos").delete().eq("id", id);
  if (error) throw error;
}
```

- [ ] **Step 2: TodoItem 컴포넌트 작성**

`components/todos/TodoItem.tsx`:
```tsx
"use client";
import type { TodoRow } from "@/lib/types";

export function TodoItem({
  todo, onToggle, onDelete,
}: {
  todo: TodoRow;
  onToggle: (done: boolean) => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center gap-2 rounded-xl border p-3">
      <input type="checkbox" checked={todo.is_done}
        onChange={(e) => onToggle(e.target.checked)} />
      <span className={`flex-1 ${todo.is_done ? "line-through text-pastel-ink/40" : ""}`}>
        {todo.title}
      </span>
      <button onClick={onDelete} className="text-sm text-red-400">삭제</button>
    </div>
  );
}
```

- [ ] **Step 3: 상시 투두 페이지 작성**

`app/(main)/todos/page.tsx`:
```tsx
"use client";
import { useEffect, useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase/client";
import { listStandingTodos, createTodo, toggleTodo, deleteTodo } from "@/lib/supabase/todos";
import { TodoItem } from "@/components/todos/TodoItem";
import type { TodoRow } from "@/lib/types";

export default function TodosPage() {
  const supabase = createBrowserSupabase();
  const [todos, setTodos] = useState<TodoRow[]>([]);
  const [title, setTitle] = useState("");

  function reload() {
    listStandingTodos(supabase).then(setTodos).catch(console.error);
  }
  useEffect(reload, []);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    await createTodo(supabase, title.trim(), null);
    setTitle("");
    reload();
  }

  return (
    <div className="p-4 space-y-3">
      <h1 className="font-bold text-lg">할 일</h1>
      <form onSubmit={add} className="flex gap-2">
        <input className="flex-1 rounded-xl border px-3 py-2" placeholder="할 일 추가"
          value={title} onChange={(e) => setTitle(e.target.value)} />
        <button className="rounded-xl bg-pastel-pink px-4 font-semibold">+</button>
      </form>
      <div className="space-y-2">
        {todos.map((t) => (
          <TodoItem key={t.id} todo={t}
            onToggle={async (done) => { await toggleTodo(supabase, t.id, done); reload(); }}
            onDelete={async () => { await deleteTodo(supabase, t.id); reload(); }} />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: DaySheet에 그날 투두 섹션 추가**

`components/calendar/DaySheet.tsx`에 그날 투두 조회·표시 추가. 컴포넌트 상단에 상태와 로딩 추가하고, 일정 목록 아래에 렌더:
```tsx
// import 추가
import { useEffect } from "react";
import { listTodosByDate, createTodo, toggleTodo, deleteTodo } from "@/lib/supabase/todos";
import { TodoItem } from "@/components/todos/TodoItem";
import type { TodoRow } from "@/lib/types";

// 컴포넌트 내부 상태
const [todos, setTodos] = useState<TodoRow[]>([]);
const [todoTitle, setTodoTitle] = useState("");
function reloadTodos() { listTodosByDate(supabase, dateISO).then(setTodos).catch(console.error); }
useEffect(reloadTodos, [dateISO]);

// 일정 목록 렌더(editing이 아닐 때) 하단에 추가:
<div className="pt-4 space-y-2">
  <h3 className="font-semibold text-sm">이 날 할 일</h3>
  <form onSubmit={async (e) => { e.preventDefault();
      if (!todoTitle.trim()) return;
      await createTodo(supabase, todoTitle.trim(), dateISO); setTodoTitle(""); reloadTodos(); }}
    className="flex gap-2">
    <input className="flex-1 rounded-xl border px-3 py-2" placeholder="할 일 추가"
      value={todoTitle} onChange={(e) => setTodoTitle(e.target.value)} />
    <button className="rounded-xl bg-pastel-mint px-4">+</button>
  </form>
  {todos.map((t) => (
    <TodoItem key={t.id} todo={t}
      onToggle={async (done) => { await toggleTodo(supabase, t.id, done); reloadTodos(); }}
      onDelete={async () => { await deleteTodo(supabase, t.id); reloadTodos(); }} />
  ))}
</div>
```

- [ ] **Step 5: 수동 확인 후 커밋**

Run: `npm run dev` → 투두 탭에서 상시 투두 추가/체크/삭제, 캘린더 날짜 시트에서 그날 투두 추가 확인.
```bash
git add lib/supabase/todos.ts components/todos "app/(main)/todos" components/calendar/DaySheet.tsx
git commit -m "feat: 날짜별/상시 투두 추가 및 관리"
```

---

## Task 9: 친구 검색 / 요청 / 수락

**Files:**
- Modify: `lib/supabase/friends.ts` (검색/요청/수락/목록 추가)
- Create: `components/friends/FriendSearch.tsx`, `components/friends/FriendList.tsx`
- Modify: `app/(main)/friends/page.tsx`
- Modify: `app/(main)/profile/page.tsx` (내 친구 코드 + 로그아웃)

**Interfaces:**
- Consumes: `Profile`, `Friendship` (Task 2), `createBrowserSupabase` (Task 3), `ensureProfile` (Task 4).
- Produces: `findProfile(supabase, query): Promise<Profile|null>` (닉네임 또는 friend_code), `sendFriendRequest(supabase, addresseeId)`, `acceptFriend(supabase, friendshipId)`, `listFriends(supabase): Promise<Profile[]>` (accepted), `listIncomingRequests(supabase): Promise<{friendship: Friendship, profile: Profile}[]>`, `getMyProfile(supabase): Promise<Profile>`.

- [ ] **Step 1: friends 쿼리 함수 추가**

`lib/supabase/friends.ts`에 추가:
```ts
import type { Profile, Friendship } from "@/lib/types";

export async function getMyProfile(supabase: SupabaseClient): Promise<Profile> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("no session");
  const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (error) throw error;
  return data as Profile;
}

export async function findProfile(supabase: SupabaseClient, query: string): Promise<Profile | null> {
  const q = query.trim();
  if (!q) return null;
  const { data } = await supabase
    .from("profiles").select("*")
    .or(`nickname.eq.${q},friend_code.eq.${q.toUpperCase()}`)
    .maybeSingle();
  return (data as Profile) ?? null;
}

export async function sendFriendRequest(supabase: SupabaseClient, addresseeId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("no session");
  if (user.id === addresseeId) throw new Error("자기 자신은 추가할 수 없어요");
  const { error } = await supabase.from("friendships")
    .insert({ requester_id: user.id, addressee_id: addresseeId, status: "pending" });
  if (error) throw error;
}

export async function acceptFriend(supabase: SupabaseClient, friendshipId: string): Promise<void> {
  const { error } = await supabase.from("friendships")
    .update({ status: "accepted" }).eq("id", friendshipId);
  if (error) throw error;
}

export async function listFriends(supabase: SupabaseClient): Promise<Profile[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("no session");
  const { data: rels, error } = await supabase.from("friendships")
    .select("*").eq("status", "accepted");
  if (error) throw error;
  const ids = (rels ?? []).map((r: Friendship) =>
    r.requester_id === user.id ? r.addressee_id : r.requester_id);
  if (ids.length === 0) return [];
  const { data: profiles } = await supabase.from("profiles").select("*").in("id", ids);
  return (profiles ?? []) as Profile[];
}

export async function listIncomingRequests(
  supabase: SupabaseClient
): Promise<{ friendship: Friendship; profile: Profile }[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("no session");
  const { data: rels } = await supabase.from("friendships")
    .select("*").eq("addressee_id", user.id).eq("status", "pending");
  const list = (rels ?? []) as Friendship[];
  if (list.length === 0) return [];
  const { data: profiles } = await supabase.from("profiles")
    .select("*").in("id", list.map((r) => r.requester_id));
  const pMap = new Map((profiles ?? []).map((p: Profile) => [p.id, p]));
  return list.map((f) => ({ friendship: f, profile: pMap.get(f.requester_id)! }));
}
```

- [ ] **Step 2: FriendSearch 컴포넌트 작성**

`components/friends/FriendSearch.tsx`:
```tsx
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
      setResult(null); setQ("");
      onRequested();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "실패했어요");
    }
  }

  return (
    <div className="space-y-2">
      <form onSubmit={search} className="flex gap-2">
        <input className="flex-1 rounded-xl border px-3 py-2" placeholder="닉네임 또는 친구코드"
          value={q} onChange={(e) => setQ(e.target.value)} />
        <button className="rounded-xl bg-pastel-pink px-4 font-semibold">검색</button>
      </form>
      {result && (
        <div className="flex items-center gap-2 rounded-xl border p-3">
          <span className="w-8 h-8 rounded-full" style={{ backgroundColor: result.avatar_color }} />
          <span className="flex-1">{result.nickname}</span>
          <button onClick={request} className="rounded-full bg-pastel-mint px-3 py-1 text-sm">요청</button>
        </div>
      )}
      {msg && <p className="text-sm text-pastel-ink/60">{msg}</p>}
    </div>
  );
}
```

- [ ] **Step 3: FriendList 컴포넌트 작성**

`components/friends/FriendList.tsx`:
```tsx
"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { createBrowserSupabase } from "@/lib/supabase/client";
import { listFriends, listIncomingRequests, acceptFriend } from "@/lib/supabase/friends";
import type { Profile, Friendship } from "@/lib/types";

export function FriendList({ refreshKey }: { refreshKey: number }) {
  const supabase = createBrowserSupabase();
  const [friends, setFriends] = useState<Profile[]>([]);
  const [requests, setRequests] = useState<{ friendship: Friendship; profile: Profile }[]>([]);

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
            <div key={friendship.id} className="flex items-center gap-2 rounded-xl border p-3">
              <span className="w-8 h-8 rounded-full" style={{ backgroundColor: profile.avatar_color }} />
              <span className="flex-1">{profile.nickname}</span>
              <button onClick={async () => { await acceptFriend(supabase, friendship.id); reload(); }}
                className="rounded-full bg-pastel-mint px-3 py-1 text-sm">수락</button>
            </div>
          ))}
        </section>
      )}
      <section className="space-y-2">
        <h2 className="font-semibold text-sm">내 친구</h2>
        {friends.length === 0 && <p className="text-sm text-pastel-ink/50">아직 친구가 없어요</p>}
        {friends.map((f) => (
          <Link key={f.id} href={`/friends/${f.id}`}
            className="flex items-center gap-2 rounded-xl border p-3">
            <span className="w-8 h-8 rounded-full" style={{ backgroundColor: f.avatar_color }} />
            <span className="flex-1">{f.nickname}</span>
            <span className="text-pastel-ink/40">›</span>
          </Link>
        ))}
      </section>
    </div>
  );
}
```

- [ ] **Step 4: 친구 페이지 조립**

`app/(main)/friends/page.tsx`:
```tsx
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
```

- [ ] **Step 5: 프로필 페이지 (친구 코드 + 로그아웃)**

`app/(main)/profile/page.tsx`:
```tsx
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

  useEffect(() => { getMyProfile(supabase).then(setProfile).catch(console.error); }, []);

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
            <span className="w-12 h-12 rounded-full" style={{ backgroundColor: profile.avatar_color }} />
            <span className="font-semibold text-lg">{profile.nickname}</span>
          </div>
          <p className="text-sm">내 친구코드: <b className="tracking-widest">{profile.friend_code}</b></p>
        </div>
      )}
      <button onClick={logout} className="w-full rounded-xl bg-gray-100 py-3">로그아웃</button>
    </div>
  );
}
```

- [ ] **Step 6: 수동 확인(계정 2개) 후 커밋**

Run: `npm run dev` → 두 계정으로 서로 검색·요청·수락, 프로필의 친구코드 표시, 로그아웃 확인.
```bash
git add lib/supabase/friends.ts components/friends "app/(main)/friends" "app/(main)/profile"
git commit -m "feat: 친구 검색/요청/수락 및 프로필·로그아웃"
```

---

## Task 10: 친구 캘린더 (읽기 전용, 공개 일정만)

**Files:**
- Modify: `lib/supabase/events.ts` (친구 공개 일정 조회)
- Create: `app/(main)/friends/[id]/page.tsx`

**Interfaces:**
- Consumes: `MonthGrid` (Task 6), `getMonthMatrix`/`toISODate` (Task 1), `EventRow` (Task 2), `getMyProfile`/친구 프로필.
- Produces: `listFriendEventsInRange(supabase, friendId, startISO, endISO): Promise<EventRow[]>` — RLS가 공개+친구 조건을 강제하므로 friendId로 필터만 하면 됨.

- [ ] **Step 1: 친구 일정 조회 함수 추가**

`lib/supabase/events.ts`에 추가:
```ts
export async function listFriendEventsInRange(
  supabase: SupabaseClient,
  friendId: string,
  startISO: string,
  endISO: string
): Promise<EventRow[]> {
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("user_id", friendId)
    .gte("date", startISO)
    .lte("date", endISO)
    .order("date");
  if (error) throw error;
  // RLS 정책상 is_public=true 이면서 친구인 행만 돌아온다.
  return (data ?? []) as EventRow[];
}
```

- [ ] **Step 2: 친구 캘린더 페이지 작성**

`app/(main)/friends/[id]/page.tsx`:
```tsx
"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createBrowserSupabase } from "@/lib/supabase/client";
import { listFriendEventsInRange } from "@/lib/supabase/events";
import { getMonthMatrix, toISODate, isSameDay } from "@/lib/date";
import { MonthGrid } from "@/components/calendar/MonthGrid";
import { BottomSheet } from "@/components/ui/BottomSheet";
import type { EventRow } from "@/lib/types";

export default function FriendCalendarPage() {
  const supabase = createBrowserSupabase();
  const params = useParams<{ id: string }>();
  const friendId = params.id;
  const [cursor, setCursor] = useState(new Date());
  const [selected, setSelected] = useState(new Date());
  const [events, setEvents] = useState<EventRow[]>([]);
  const [sheetOpen, setSheetOpen] = useState(false);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();

  useEffect(() => {
    const matrix = getMonthMatrix(year, month);
    listFriendEventsInRange(supabase, friendId, toISODate(matrix[0][0]), toISODate(matrix[5][6]))
      .then(setEvents).catch(console.error);
  }, [year, month, friendId]);

  const dayEvents = events.filter((e) => isSameDay(new Date(e.date + "T00:00"), selected));

  return (
    <div className="pt-4">
      <header className="flex items-center justify-between px-5 mb-3">
        <button onClick={() => setCursor(new Date(year, month - 1, 1))}>‹</button>
        <h1 className="font-bold">{year}년 {month + 1}월 · 친구 캘린더</h1>
        <button onClick={() => setCursor(new Date(year, month + 1, 1))}>›</button>
      </header>
      <p className="px-5 text-xs text-pastel-ink/50 mb-2">공개된 일정만 보여요</p>
      <MonthGrid year={year} month={month} events={events}
        selectedDate={selected}
        onSelectDate={(d) => { setSelected(d); setSheetOpen(true); }} />
      <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)}>
        <h2 className="font-bold mb-2">{toISODate(selected)}</h2>
        {dayEvents.length === 0 && <p className="text-sm text-pastel-ink/50 py-4">공개된 일정이 없어요</p>}
        {dayEvents.map((e) => (
          <div key={e.id} className="flex items-center gap-2 rounded-xl border p-3 mb-2">
            <span className="w-2 h-8 rounded-full" style={{ backgroundColor: e.color }} />
            <div>
              <p className="font-medium">{e.title}</p>
              {!e.is_all_day && <p className="text-xs text-pastel-ink/50">{e.start_time}~{e.end_time}</p>}
            </div>
          </div>
        ))}
      </BottomSheet>
    </div>
  );
}
```

- [ ] **Step 3: 프라이버시 수동 검증 후 커밋**

Run: `npm run dev` → 계정 A에서 비공개 일정 1개 + 공개 일정 1개 생성. 계정 B(친구)에서 A의 캘린더 진입 → **공개 일정만** 보이는지 확인(비공개 안 보임). 친구가 아닌 계정 C가 A의 URL로 직접 접근 시 아무 일정도 안 보이는지 확인.
```bash
git add lib/supabase/events.ts "app/(main)/friends"
git commit -m "feat: 친구 캘린더(공개 일정만 읽기 전용)"
```

---

## Task 11: 파스텔 테마 + PWA + 배포

**Files:**
- Modify: `tailwind.config.ts` (파스텔 팔레트)
- Modify: `app/globals.css`, `app/layout.tsx` (메타/뷰포트/manifest 링크)
- Create: `public/manifest.webmanifest`, `public/icon-192.png`, `public/icon-512.png`

**Interfaces:**
- Produces: `pastel-*` Tailwind 색 토큰(앞선 태스크에서 참조한 클래스들 실제 정의), PWA manifest.

- [ ] **Step 1: 파스텔 팔레트 정의**

`tailwind.config.ts`의 `theme.extend.colors`에 추가:
```ts
colors: {
  pastel: {
    cream: "#FFF9F3",
    pink: "#FBCFE8",
    pinkdark: "#F472B6",
    mint: "#A7F3D0",
    lavender: "#DDD6FE",
    ink: "#5B5563",
  },
},
```
`content` 배열에 `"./app/**/*.{ts,tsx}"`, `"./components/**/*.{ts,tsx}"` 포함 확인.

- [ ] **Step 2: 뷰포트/메타 설정**

`app/layout.tsx`에 추가:
```tsx
import type { Viewport, Metadata } from "next";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#FBCFE8",
};

export const metadata: Metadata = {
  title: "우리 캘린더",
  description: "친구와 함께 보는 파스텔 캘린더 + 투두",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "우리 캘린더" },
};
```
`<body>`에 `className="bg-pastel-cream text-pastel-ink"` 적용.

- [ ] **Step 3: PWA manifest 작성**

`public/manifest.webmanifest`:
```json
{
  "name": "우리 캘린더",
  "short_name": "캘린더",
  "start_url": "/calendar",
  "display": "standalone",
  "background_color": "#FFF9F3",
  "theme_color": "#FBCFE8",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```
`public/icon-192.png`, `public/icon-512.png`는 파스텔 아이콘 이미지로 추가(임시로 단색 파스텔 정사각형 PNG 가능).

- [ ] **Step 4: 전체 테스트 + 빌드 확인**

Run: `npm test`
Expected: 모든 테스트 PASS.
Run: `npm run build`
Expected: 빌드 성공, 타입 에러 없음.

- [ ] **Step 5: 커밋**

```bash
git add tailwind.config.ts app/globals.css app/layout.tsx public/manifest.webmanifest public/icon-192.png public/icon-512.png
git commit -m "feat: 파스텔 테마 및 PWA manifest"
```

- [ ] **Step 6: Vercel 배포**

1. GitHub에 푸시: `git push origin main` (또는 작업 브랜치 → PR → main).
2. Vercel 대시보드 → New Project → 이 GitHub 레포 import.
3. Environment Variables에 `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` 추가.
4. Supabase 대시보드 → Authentication → URL Configuration에 Vercel 배포 도메인 추가(리다이렉트 허용).
5. Deploy 후 모바일에서 접속 → "홈 화면에 추가"로 앱처럼 실행되는지 확인.

---

## Self-Review 결과

- **스펙 커버리지:** 로그인(이메일+비번, Task 4) / 친구 코드·닉네임 검색(Task 9) / 공개 일정만 노출(RLS Task 2 + Task 10) / 날짜별·상시 투두(Task 8) / 기본 일정 필드(Task 7) / 모바일 셸(Task 5) / 파스텔·PWA(Task 11) — 모두 태스크 존재. ✅
- **플레이스홀더:** 없음. 각 스텝에 실제 코드/명령/기대 결과 포함.
- **타입 일관성:** `EventRow`/`TodoRow`/`Profile`/`Friendship`(Task 2)와 이후 함수 시그니처 일치. `EventInput`(Task 7)은 events.ts에서 정의 후 DaySheet에서 소비. `pastel-*` 클래스는 초반 태스크에서 사용하고 Task 11에서 정의(빌드 전 전체 통과되도록 마지막에 확정).

## 참고: 카카오 로그인으로 바꾸고 싶다면 (범위 밖)

지금은 이메일+비밀번호. 추후 카카오로 전환 시: 카카오 개발자 콘솔 앱 등록 → Supabase Auth Providers에 카카오 설정 → `signInWithOAuth({ provider: "kakao" })`로 교체. 프로필 생성 로직(`ensureProfile`)은 재사용 가능하되 닉네임 입력 단계만 별도 온보딩으로 옮기면 된다.
