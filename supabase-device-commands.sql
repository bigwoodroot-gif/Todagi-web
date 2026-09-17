-- 디바이스 명령 테이블 (앱 → 라즈베리파이 통신용)
-- Supabase SQL Editor에서 실행하세요

create table device_commands (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  command text not null check (command in ('pump_on', 'pump_off')),
  pressure integer default 0 check (pressure >= 0 and pressure <= 100),
  status text default 'pending' check (status in ('pending', 'executed', 'failed')),
  created_at timestamp with time zone default now(),
  executed_at timestamp with time zone
);

alter table device_commands enable row level security;

create policy "본인 명령만 조회"
  on device_commands for select
  to authenticated
  using (auth.uid() = user_id);

create policy "로그인 사용자는 명령 생성 가능"
  on device_commands for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "명령 상태 업데이트 허용"
  on device_commands for update
  to authenticated
  using (auth.uid() = user_id);

-- anon key로 라즈베리파이에서 접근할 수 있도록 추가 정책
create policy "디바이스에서 최신 명령 조회"
  on device_commands for select
  to anon
  using (true);

create policy "디바이스에서 명령 상태 업데이트"
  on device_commands for update
  to anon
  using (true);

-- Realtime 활성화
alter publication supabase_realtime add table device_commands;
