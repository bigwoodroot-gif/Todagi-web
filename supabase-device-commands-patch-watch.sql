-- 시제품 단계 임시 패치: 워치(anon key)가 user_id 없이 device_commands에 명령을 넣을 수 있도록 허용
-- Supabase 대시보드 → SQL Editor에서 실행하세요
-- 나중에 사용자-워치 매핑을 붙이면 이 패치는 되돌리는 게 좋습니다 (맨 아래 롤백 SQL 참고)

-- 1) user_id를 NULL 허용으로 변경 (워치는 로그인 세션이 없어 user_id를 채울 수 없음)
alter table device_commands alter column user_id drop not null;

-- 2) anon 역할(워치가 쓰는 anon key)도 명령을 insert할 수 있도록 허용
create policy "디바이스(워치)에서 명령 생성 허용 - 시제품 임시"
  on device_commands for insert
  to anon
  with check (true);

-- ── 나중에 사용자-워치 매핑 구현 후 되돌리려면 ──
-- drop policy "디바이스(워치)에서 명령 생성 허용 - 시제품 임시" on device_commands;
-- alter table device_commands alter column user_id set not null;
