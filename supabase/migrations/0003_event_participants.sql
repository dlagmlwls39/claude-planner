-- 친구와 함께 일정 등록 (공유 일정 + 초대)
-- 실행: Supabase 대시보드 SQL Editor 에 붙여넣고 Run

-- 1) 참여자 테이블
create table if not exists event_participants (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','accepted','declined')),
  created_at timestamptz not null default now(),
  unique (event_id, user_id)
);
create index if not exists event_participants_user_idx on event_participants(user_id, status);
create index if not exists event_participants_event_idx on event_participants(event_id);

alter table event_participants enable row level security;

-- 2) 헬퍼 (security definer 로 RLS 우회하여 재귀 방지)
create or replace function is_event_participant(e uuid, u uuid)
returns boolean language sql stable security definer as $$
  select exists(
    select 1 from event_participants p
    where p.event_id = e and p.user_id = u and p.status in ('pending','accepted')
  );
$$;

create or replace function is_event_owner(e uuid, u uuid)
returns boolean language sql stable security definer as $$
  select exists(select 1 from events ev where ev.id = e and ev.user_id = u);
$$;

-- 3) events: 참여자(초대 대기/수락)도 원본 조회 가능
drop policy if exists events_select_participant on events;
create policy events_select_participant on events for select
  using (is_event_participant(id, auth.uid()));

-- 4) event_participants 정책
drop policy if exists ep_select_party on event_participants;
create policy ep_select_party on event_participants for select
  using (auth.uid() = user_id or is_event_owner(event_id, auth.uid()));

drop policy if exists ep_insert_owner on event_participants;
create policy ep_insert_owner on event_participants for insert
  with check (
    is_event_owner(event_id, auth.uid())
    and are_friends(auth.uid(), user_id)
  );

drop policy if exists ep_update_self on event_participants;
create policy ep_update_self on event_participants for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists ep_delete_party on event_participants;
create policy ep_delete_party on event_participants for delete
  using (auth.uid() = user_id or is_event_owner(event_id, auth.uid()));
