# claude-planner 개요

친구와 일정을 공유하는 캘린더 + 개인 투두 **모바일 전용 웹앱**.
Next.js(App Router) + TypeScript + Tailwind v4 + Supabase(Auth/DB/RLS), Vercel 배포.

## 처리 흐름
- 로그인/회원가입(`/login`) → 세션 생성 → `ensureProfile`로 프로필 자동 생성 → `/calendar`.
- 메인 영역(`app/(main)`)은 서버 레이아웃에서 세션 확인 후 미로그인 시 `/login` 리다이렉트.
- 데이터 접근은 `lib/supabase/*` 함수로 감싸고, 보안은 RLS로 강제(비공개 일정 노출 방지).

## 주요 파일
- `app/(main)/layout.tsx` — 세션 가드 + 480px 컨테이너 + 하단 탭바
- `app/(main)/calendar`,`todos`,`friends`,`profile` — 4개 탭 화면
- `app/(main)/friends/[id]` — 친구 캘린더(공개 일정만 읽기)
- `components/calendar/*` — MonthGrid/DayCell/DaySheet/EventForm
- `components/ui/*` — BottomTabBar, BottomSheet
- `components/friends/*`, `components/todos/*`
- `lib/supabase/*` — client/server/events/todos/friends 쿼리 래퍼
- `app/globals.css` — 하늘색 디자인 시스템(팔레트 + .card/.field/.btn)

## 디자인 시스템 (2026-08-24 개편)
- 하늘색 기반 파스텔. 토큰: `brand`/`brand-dark`/`brand-soft`/`cream`/`mint`/`ink`/`line`.
- 공통 클래스 `.card` `.field` `.btn(-primary/-soft/-mint/-ghost)`로 통일.
- 모든 메인 페이지 루트 여백은 `px-4 pt-6`으로 고정(탭 간 가로폭 일관성).
- 폰트: 나눔스퀘어 네오(NanumSquareNeo) 가변폰트 self-host(`public/fonts/NanumSquareNeo-Variable.woff2`, 300~900).
  타이틀은 `font-extrabold`(800). 탭/파비콘은 통일된 SVG 아이콘(`components/ui/icons.tsx`).

## 배포/환경
- `.env.local`: `NEXT_PUBLIC_SUPABASE_URL`(프로젝트 URL, 경로 없이), `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- `main` 푸시 시 Vercel 자동 배포. Supabase Auth 허용 URL에 Vercel 도메인 추가 필요.

## 제약/주의
- 모바일 전용(최대폭 480px). 데스크톱 레이아웃 없음.
- 일정 기본 비공개, `is_public=true`만 친구에게 노출(RLS).
- 개발 중 Supabase Confirm email 끄면 가입 즉시 로그인. 실배포 시 재점검.
