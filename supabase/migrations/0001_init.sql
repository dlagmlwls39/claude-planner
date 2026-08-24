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
  using (auth.uid() = requester_id or auth.uid() = addressee_id)
  with check (auth.uid() = requester_id or auth.uid() = addressee_id);
create policy friendships_delete_party on friendships for delete
  using (auth.uid() = requester_id or auth.uid() = addressee_id);
