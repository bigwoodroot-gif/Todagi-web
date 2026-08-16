-- 토다기 앱 데이터베이스 스키마
-- Supabase SQL Editor에서 실행하세요

-- 1. 프로필 테이블 (auth.users 확장)
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  name text not null,
  email text not null,
  phone text,
  created_at timestamp with time zone default now()
);

-- 2. 비상 연락처 (사용자 간 연결)
create table emergency_contacts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  contact_id uuid references profiles(id) on delete cascade not null,
  relation text not null default '기타',
  priority integer not null default 1,
  created_at timestamp with time zone default now(),
  unique(user_id, contact_id)
);

-- 3. 알림 테이블
create table notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  sender_id uuid references profiles(id) on delete set null,
  type text not null,
  title text not null,
  message text not null,
  is_read boolean default false,
  created_at timestamp with time zone default now()
);

-- 4. RLS (Row Level Security) 활성화
alter table profiles enable row level security;
alter table emergency_contacts enable row level security;
alter table notifications enable row level security;

-- 5. 프로필 정책
create policy "프로필 조회는 모든 로그인 사용자 가능"
  on profiles for select
  to authenticated
  using (true);

create policy "본인 프로필만 수정 가능"
  on profiles for update
  to authenticated
  using (auth.uid() = id);

-- 6. 비상 연락처 정책
create policy "본인 연락처만 조회"
  on emergency_contacts for select
  to authenticated
  using (auth.uid() = user_id);

create policy "본인 연락처만 추가"
  on emergency_contacts for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "본인 연락처만 삭제"
  on emergency_contacts for delete
  to authenticated
  using (auth.uid() = user_id);

-- 7. 알림 정책
create policy "본인 알림만 조회"
  on notifications for select
  to authenticated
  using (auth.uid() = user_id);

create policy "로그인 사용자는 알림 생성 가능"
  on notifications for insert
  to authenticated
  with check (true);

create policy "본인 알림만 수정 (읽음 처리)"
  on notifications for update
  to authenticated
  using (auth.uid() = user_id);

-- 8. 회원가입 시 자동 프로필 생성 트리거
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 9. 실시간 알림을 위한 Realtime 활성화
alter publication supabase_realtime add table notifications;
