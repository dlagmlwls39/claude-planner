# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 소개

친구와 일정을 공유하는 캘린더 + 개인 투두리스트를 갖춘 **모바일 전용 웹앱**.
Next.js(App Router) + TypeScript + Tailwind CSS로 만들고, Supabase(인증·DB·RLS)를 백엔드로 쓰며, Vercel에 배포한다. 별도 백엔드 서버는 운영하지 않는다.

> 상세 기획/설계(화면·데이터 구조·RLS·범위)는 [build.md](./build.md) 참고.

## 명령어

> 아직 프로젝트 스캐폴딩 전이라, 초기화 이후 사용할 표준 명령어 기준.

- `npm run dev` — 로컬 개발 서버 실행 (http://localhost:3000)
- `npm run build` — 프로덕션 빌드
- `npm run start` — 빌드 결과 실행
- `npm run lint` — ESLint 검사
- 배포 — `main` 브랜치 푸시 시 Vercel 자동 배포

## 환경 변수

- `.env.local`에 Supabase 키 저장 (절대 커밋 금지 — `.gitignore`에 포함됨)
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `service_role` 키 등 비밀 키는 클라이언트 코드에 넣지 말 것.

## 코드 스타일

- **TypeScript 우선** — `any` 지양, 공용 타입은 `lib/types.ts`에 모은다.
- **컴포넌트** — 함수형 컴포넌트. 파일당 한 컴포넌트, 파일명은 컴포넌트명과 일치.
- **파일/폴더 명명** — 컴포넌트는 PascalCase, 그 외 파일·폴더는 kebab-case.
- **스타일링** — Tailwind 유틸리티 클래스 사용. 파스텔 팔레트/공통 값은 `tailwind.config`에 정의해 재사용.
- **Supabase 접근** — 쿼리는 `lib/supabase/`의 함수로 감싸고 컴포넌트에서 직접 호출하지 않는다.
- **보안** — 화면단 필터에 의존하지 말고 RLS로 접근을 강제한다(비공개 일정 노출 방지).
- 들여쓰기·포맷은 프로젝트 Prettier/ESLint 설정을 따른다.

## Git 브랜치 / 커밋 규칙

- 브랜치: `main`(배포) 에 직접 커밋하지 말고 작업 브랜치에서 진행.
  - 형식: `feat/캘린더-월그리드`, `fix/친구요청-중복`, `chore/...` 등 `타입/설명`.
- 커밋 메시지: `타입: 설명` (한국어 OK)
  - 타입: `feat` / `fix` / `docs` / `style` / `refactor` / `chore`
  - 예) `feat: 친구 코드 검색 화면 추가`
- 하나의 커밋은 하나의 논리적 변경만 담는다.
- 커밋/푸시는 사용자가 요청할 때만 수행한다.

## 주의사항

- **모바일 전용** — 데스크톱 레이아웃은 만들지 않는다. 고정 폭·하단 탭바·바텀시트 기준으로 작업.
- **프라이버시** — 일정 기본값은 비공개. `is_public=true`인 일정만 친구에게 보인다. RLS 정책을 우선 검증할 것.
- **개인정보 최소 수집** — 회원가입은 이메일+비밀번호만. 추가 개인정보를 임의로 받지 않는다.
- **비밀 키 노출 금지** — `.env*`, Supabase service_role 키 등은 커밋/클라이언트 번들에 포함하지 않는다.
- 새 기능/동작 추가 전에는 [build.md](./build.md)의 범위(YAGNI 항목 포함)를 먼저 확인한다.
