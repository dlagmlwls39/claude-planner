# 친구와 함께 일정 등록 (공유 일정 + 초대) 설계

작성일: 2026-08-24

## 목표
일정을 만들 때 친구를 초대해 **하나의 공유 일정**을 함께 보게 한다.
초대를 수락하면 그 일정이 친구 캘린더에도 나타나고, **주최자가 수정/삭제하면
참여자 전원에게 즉시 반영**된다(사본 아님).

## 핵심 결정
- 반영 방식: **초대 → 수락** (동의 기반, 프라이버시/스팸 안전)
- 데이터: **하나의 원본 일정 + 참여자 연결**(각자 사본 아님)
- 권한: **수정/삭제는 주최자만**. 참여자는 "나가기"로 자기 캘린더에서만 제외.
- 초대 확인: **친구 탭의 "받은 일정 초대" 섹션**

## 데이터 모델
새 테이블 `event_participants`
- `id uuid pk`
- `event_id uuid` → `events(id) on delete cascade`
- `user_id uuid` → `auth.users(id) on delete cascade` (참여 친구)
- `status text` in ('pending','accepted','declined') default 'pending'
- `created_at timestamptz`
- `unique(event_id, user_id)`
- 인덱스: `(user_id, status)`, `(event_id)`

기존 `events`는 그대로(주최자 = `user_id`).

## RLS
헬퍼(security definer):
- `is_event_participant(e,u)`: u가 e의 참여자(pending 또는 accepted)인지 → **초대 미리보기와 조회 모두 허용**
- `is_event_owner(e,u)`: u가 e의 주최자인지

정책:
- `events`: 기존 정책 유지 + **참여자 조회 허용**
  `events_select_participant: using (is_event_participant(id, auth.uid()))`
- `event_participants`:
  - select: `auth.uid() = user_id OR is_event_owner(event_id, auth.uid())`
  - insert: `is_event_owner(event_id, auth.uid()) AND are_friends(auth.uid(), user_id)` (주최자만, 친구에게만)
  - update: `auth.uid() = user_id` (수락/거절은 본인만)
  - delete: `auth.uid() = user_id OR is_event_owner(...)` (나가기/내보내기)

수정/삭제는 기존 `events_update_own`/`events_delete_own`(주최자만)로 자연히 보장.

## 흐름
1. 일정 생성 시 "친구와 함께하기" 열기 → 수락된 친구 다중 선택
2. 저장: `createEvent`로 원본 생성 → 선택 친구별 `event_participants(pending)` insert
3. 친구: 친구 탭 "받은 일정 초대"에서 주최자/제목/날짜 확인 → 수락/거절
4. 수락: 참여 status='accepted' → 공유 일정이 친구 캘린더에 표시
5. 주최자 수정/삭제 → 단일 원본이므로 참여자 전원 반영

## 조회 로직
`listMyEventsInRange`를 "내 일정 + 내가 accepted한 공유 일정"으로 확장:
1. 내 일정: `events where user_id = me and date in range` (명시적 필터 — 친구 공개일정이 내 캘린더에 섞이지 않도록)
2. 참여 일정: `event_participants where user_id=me and status='accepted'` → event_id 목록 → `events where id in (...) and date in range`
3. id 기준 dedupe 후 date 정렬

## UI
- `EventForm`(신규 일정에서만): "친구와 함께하기" 접이식 → 친구 체크박스 다중 선택.
  `onSubmit(input, friendIds)`로 전달.
- `DaySheet.handleSubmit`: new면 createEvent 후 `inviteFriendsToEvent(eventId, friendIds)`.
- `친구 페이지`: `FriendSearch` 아래 `EventInviteList`(받은 일정 초대) 추가.
- 신규 파일: `lib/supabase/event-invites.ts`, `components/friends/EventInviteList.tsx`,
  마이그레이션 `supabase/migrations/0003_event_participants.sql`.

## lib/supabase/event-invites.ts
- `inviteFriendsToEvent(supabase, eventId, friendIds[])`
- `listIncomingEventInvites(supabase)` → `{ inviteId, event: EventRow, inviter: Profile }[]`
- `acceptEventInvite(supabase, inviteId)` (status='accepted')
- `declineEventInvite(supabase, inviteId)` (status='declined')

## 범위 밖 (이번 안 함)
- 참여자에 의한 수정
- 초대 푸시 알림(앱 내 표시만)
- 초대 후 참여자 추가 편집(수정 모드에서 재초대) — 신규 생성 시에만 초대

## 검증
- `npm run build` 통과
- 수동: 두 계정으로 초대→수락→양쪽 캘린더 표시→주최자 삭제 시 동시 사라짐 확인
  (사진/스토리지처럼 `0003_...sql`을 Supabase에서 먼저 실행해야 함)
