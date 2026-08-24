-- 회원 탈퇴 (본인 계정 삭제)
-- 실행: Supabase 대시보드 SQL Editor 에 붙여넣고 Run
--
-- 클라이언트(anon)는 auth.users 를 직접 삭제할 수 없으므로,
-- security definer 함수로 "본인(auth.uid()) 계정만" 삭제한다.
-- profiles/events/todos/friendships/event_participants 는 auth.users FK 의
-- on delete cascade 로 함께 삭제된다.

-- 주의: storage.objects 는 SQL 직접 삭제가 막혀 있으므로 여기서 지우지 않는다.
--       아바타 파일은 클라이언트에서 Storage API 로 먼저 정리한다.
create or replace function delete_own_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- 본인 계정 삭제 (profiles/events/todos/friendships/event_participants 는 FK cascade)
  delete from auth.users where id = auth.uid();
end;
$$;

revoke all on function delete_own_account() from public;
grant execute on function delete_own_account() to authenticated;
