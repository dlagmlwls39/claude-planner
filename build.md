# 기획 / 설계 문서

## 프로젝트 개요

친구와 일정을 캘린더 형태로 공유하고, 개인적으로는 투두리스트까지 관리하는 **모바일 전용 웹앱**.
로그인하면 내 캘린더가 먼저 뜨고, 친구 목록에서 친구를 선택하면 친구의 (공개) 일정을 볼 수 있다.
앱처럼 보이는 UI에 파스텔톤 아기자기한 디자인을 지향한다.

## 기술 스택

- **Next.js (App Router) + TypeScript** — Vercel 배포에 최적화. 별도 서버 운영 불필요.
- **Tailwind CSS** — 파스텔톤 모바일 UI를 빠르게 구현.
- **Supabase** — 인증(이메일+비밀번호) + Postgres DB + RLS(행 수준 보안).
- **PWA 설정** — 홈 화면 추가 시 앱처럼 보이도록.
- **커스텀 월(月) 캘린더 그리드** — 무거운 라이브러리 없이 직접 구현(디자인 자유도·번들 크기 이점).

배포: Vercel(프론트 + 서버리스). 데이터: Supabase. **직접 운영하는 백엔드 서버 없음.**

## 핵심 결정 사항

| 항목 | 결정 |
|------|------|
| 로그인 | 이메일 + 비밀번호 (개인정보 최소, 비밀번호 찾기 자동 지원) |
| 친구 추가 | 친구 코드 / 닉네임 검색 → 요청 → 수락 |
| 일정 공개 범위 | 기본 비공개(나만 보기). `is_public=true`로 표시한 일정만 친구에게 노출 |
| 투두 | 날짜별 투두 + 상시(날짜 없는) 투두 둘 다 |
| 일정 상세 | 기본 수준: 제목, 날짜, 시간(또는 종일), 색상/카테고리, 메모, 공개여부. 반복 일정 없음 |

## 화면 구성 (모바일 전용)

- **로그인/회원가입** — 이메일·비밀번호 입력 폼. 파스텔 배경.
- **메인(내 캘린더)** — 로그인 후 첫 화면. 월 그리드 + 일정 점(색상). 날짜 탭 → 하단 바텀시트에 그날 일정 + 그날 투두.
- **친구 목록** — 닉네임/코드 검색, 친구 요청·수락. 친구 선택 → 친구 캘린더(공개 일정만, 읽기 전용).
- **투두** — 날짜별 투두는 캘린더 안에서, 상시 투두는 별도 탭.
- **내 정보** — 프로필, 내 친구 코드, 로그아웃.
- **하단 탭바** — 캘린더 / 친구 / 투두 / 내정보.

## 데이터 구조 (Supabase 테이블)

### profiles
- `id` (auth.users 연결, PK)
- `nickname` (고유, 친구 검색용)
- `friend_code` (고유 6자리, 친구 검색용)
- `avatar_color` (파스텔 아바타 색)
- `created_at`

### events (일정)
- `id`, `user_id`
- `title`
- `date`
- `start_time` / `end_time` (종일이면 null)
- `is_all_day`
- `color`
- `memo`
- `is_public` (친구 공개 여부, 기본 false)
- `created_at`

### todos
- `id`, `user_id`
- `title`
- `date` (null이면 상시 투두)
- `is_done`
- `created_at`

### friendships
- `id`
- `requester_id`, `addressee_id`
- `status` (pending / accepted)
- `created_at`

## 보안 (RLS)

- 내 `events` / `todos` / `profiles`: 본인만 읽기·쓰기.
- 친구의 `events`: `friendships.status='accepted'`인 관계이고 `is_public=true`인 것만 읽기 가능.
  DB 정책으로 강제하므로 프론트 실수가 있어도 비공개 일정이 노출되지 않는다.
- `friendships`: 당사자(requester/addressee) 둘만 조회·수정.
- `profiles`: 닉네임/친구 코드 검색을 위해 최소 필드만 다른 사용자에게 조회 허용(민감 정보 없음).

## 데이터 흐름

- 브라우저 → Supabase 클라이언트로 직접 통신(별도 API 서버 없음). RLS가 보안 담당.
- 세션은 Supabase Auth가 쿠키로 관리. 미로그인 시 로그인 화면으로 리다이렉트.
- 친구 캘린더 조회: accepted 관계 확인 후 친구의 공개 events만 read(RLS 자동 필터).

## 프로젝트 구조 (Next.js App Router)

```
app/
  login/            로그인·회원가입 화면
  (main)/           로그인 필요한 영역
    calendar/       내 캘린더 (메인)
    friends/        친구 목록·검색·요청
    friends/[id]/   친구 캘린더 (읽기 전용)
    todos/          상시 투두
    profile/        내 정보
  layout.tsx        하단 탭바 공통 레이아웃
components/
  calendar/         월 그리드, 날짜 셀, 일정 점
  ui/               버튼, 시트, 카드 등 파스텔 공통 컴포넌트
lib/
  supabase/         클라이언트 설정, 쿼리 함수
  types.ts          공통 타입
supabase/
  migrations/       테이블·RLS SQL
```

## 디자인 방향

- 파스텔 팔레트(연분홍/민트/라벤더/크림), 둥근 모서리, 부드러운 그림자, 아기자기한 아이콘.
- 모바일 고정 폭 레이아웃(가운데 정렬), 하단 탭바, 바텀시트 스타일 상세보기 → 앱 느낌.

## 범위 밖 (YAGNI)

- 반복 일정
- 카카오/구글 등 소셜 로그인 (추후 추가 가능)
- 알림/푸시
- 데스크톱 전용 레이아웃
