-- WEB DIEU HANH XE V1 - CHAY CHI TRONG SUPABASE PROJECT MOI
create extension if not exists pgcrypto;
create table if not exists public.dispatch_drivers(id uuid primary key default gen_random_uuid(),name text not null,phone text default '',license text default '',created_at timestamptz not null default now());
create table if not exists public.dispatch_vehicles(id uuid primary key default gen_random_uuid(),plate text not null unique,kind text not null,status text not null default 'Sẵn sàng' check(status in('Sẵn sàng','Bảo dưỡng','Ngừng hoạt động')),created_at timestamptz not null default now());
create table if not exists public.dispatch_profiles(id uuid primary key references auth.users(id) on delete cascade, full_name text default '', role text not null default 'Người đề nghị' check(role in('Quản trị viên','Người đề nghị','Lãnh đạo','Cán bộ điều xe','Lái xe')),driver_id uuid references public.dispatch_drivers(id),created_at timestamptz not null default now());
create table if not exists public.dispatch_requests(id uuid primary key default gen_random_uuid(),unit text not null,requester text not null,kind text not null,purpose text not null,place text not null,start timestamptz not null,"end" timestamptz not null,driver_hint text default '',note text default '',status text not null default 'Chờ lãnh đạo duyệt' check(status in('Chờ lãnh đạo duyệt','Chờ cán bộ điều xe','Đã phát hành','Từ chối')),vehicle_id uuid references public.dispatch_vehicles(id),driver_id uuid references public.dispatch_drivers(id),leader_note text default '',manager_note text default '',created_by uuid references auth.users(id),history jsonb not null default '[]'::jsonb,created_at timestamptz not null default now(),constraint dispatch_time_valid check("end">start));
create index if not exists dispatch_requests_status_idx on public.dispatch_requests(status);
create index if not exists dispatch_requests_time_idx on public.dispatch_requests(start,"end");
create or replace function public.dispatch_current_role() returns text language sql stable security definer set search_path=public as $$ select role from public.dispatch_profiles where id=auth.uid() limit 1 $$;
create or replace function public.dispatch_is_admin() returns boolean language sql stable security definer set search_path=public as $$ select coalesce(public.dispatch_current_role()='Quản trị viên',false) $$;
create or replace function public.dispatch_role_allowed(roles text[]) returns boolean language sql stable security definer set search_path=public as $$ select coalesce(public.dispatch_current_role()=any(roles),false) $$;
alter table public.dispatch_drivers enable row level security;
alter table public.dispatch_vehicles enable row level security;
alter table public.dispatch_profiles enable row level security;
alter table public.dispatch_requests enable row level security;
create policy "profiles_read" on public.dispatch_profiles for select to authenticated using (id=auth.uid() or public.dispatch_is_admin());
create policy "profiles_admin_insert" on public.dispatch_profiles for insert to authenticated with check(public.dispatch_is_admin());
create policy "profiles_admin_update" on public.dispatch_profiles for update to authenticated using(public.dispatch_is_admin()) with check(public.dispatch_is_admin());
create policy "vehicles_read" on public.dispatch_vehicles for select to authenticated using(true);
create policy "vehicles_admin_insert" on public.dispatch_vehicles for insert to authenticated with check(public.dispatch_is_admin());
create policy "vehicles_admin_update" on public.dispatch_vehicles for update to authenticated using(public.dispatch_is_admin()) with check(public.dispatch_is_admin());
create policy "drivers_read" on public.dispatch_drivers for select to authenticated using(true);
create policy "drivers_admin_insert" on public.dispatch_drivers for insert to authenticated with check(public.dispatch_is_admin());
create policy "drivers_admin_update" on public.dispatch_drivers for update to authenticated using(public.dispatch_is_admin()) with check(public.dispatch_is_admin());
create policy "requests_read" on public.dispatch_requests for select to authenticated using(public.dispatch_role_allowed(array['Quản trị viên','Lãnh đạo','Cán bộ điều xe']) or (public.dispatch_current_role()='Người đề nghị' and created_by=auth.uid()) or (public.dispatch_current_role()='Lái xe' and status='Đã phát hành' and driver_id=(select p.driver_id from public.dispatch_profiles p where p.id=auth.uid())));
create policy "requests_insert" on public.dispatch_requests for insert to authenticated with check (public.dispatch_role_allowed(array['Quản trị viên','Người đề nghị']) and created_by=auth.uid() and status='Chờ lãnh đạo duyệt' and vehicle_id is null and driver_id is null);
-- An update additionally needs a read policy. State changes are constrained below using trigger.
create policy "requests_update" on public.dispatch_requests for update to authenticated using(public.dispatch_role_allowed(array['Quản trị viên','Lãnh đạo','Cán bộ điều xe'])) with check(public.dispatch_role_allowed(array['Quản trị viên','Lãnh đạo','Cán bộ điều xe']));
create or replace function public.dispatch_enforce_workflow() returns trigger language plpgsql security definer set search_path=public as $$
declare role_name text; overlap_count integer;
begin
 role_name:=public.dispatch_current_role();
 if tg_op='UPDATE' then
   if role_name not in ('Quản trị viên','Lãnh đạo','Cán bộ điều xe') then raise exception 'Không có quyền thay đổi yêu cầu'; end if;
   if new.id is distinct from old.id or new.created_by is distinct from old.created_by or new.created_at is distinct from old.created_at or new.unit is distinct from old.unit or new.purpose is distinct from old.purpose or new.place is distinct from old.place or new.start is distinct from old.start or new."end" is distinct from old."end" then raise exception 'Không thể sửa nội dung yêu cầu trong bước duyệt'; end if;
   if role_name='Lãnh đạo' and (old.status<>'Chờ lãnh đạo duyệt' or new.status not in ('Chờ cán bộ điều xe','Từ chối') or new.vehicle_id is distinct from old.vehicle_id or new.driver_id is distinct from old.driver_id) then raise exception 'Chuyển trạng thái lãnh đạo không hợp lệ'; end if;
   if role_name='Cán bộ điều xe' and (old.status<>'Chờ cán bộ điều xe' or new.status not in ('Đã phát hành','Từ chối')) then raise exception 'Chuyển trạng thái điều xe không hợp lệ'; end if;
   if old.status in ('Đã phát hành','Từ chối') then raise exception 'Phiếu đã đóng, không cho sửa trực tiếp'; end if;
   if new.status='Đã phát hành' then
      if new.vehicle_id is null or new.driver_id is null then raise exception 'Cần xe và lái xe'; end if;
      if not exists(select 1 from public.dispatch_vehicles where id=new.vehicle_id and status='Sẵn sàng') then raise exception 'Xe không sẵn sàng'; end if;
      -- Locks serialize issuance for a chosen vehicle or driver, avoiding concurrent overlap.
      perform pg_advisory_xact_lock(hashtextextended(new.vehicle_id::text,0));
      perform pg_advisory_xact_lock(hashtextextended(new.driver_id::text,1));
      select count(*) into overlap_count from public.dispatch_requests r where r.id<>old.id and r.status='Đã phát hành' and (r.vehicle_id=new.vehicle_id or r.driver_id=new.driver_id) and r.start<new."end" and r."end">new.start;
      if overlap_count>0 then raise exception 'Xe hoặc lái xe bị trùng lịch'; end if;
   end if;
 end if;
 return new;
end $$;
drop trigger if exists trg_dispatch_enforce_workflow on public.dispatch_requests;
create trigger trg_dispatch_enforce_workflow before update on public.dispatch_requests for each row execute function public.dispatch_enforce_workflow();
-- Tạo profile đầu tiên bằng SQL Editor, dùng UUID thật từ Authentication > Users.
-- insert into public.dispatch_profiles(id,full_name,role) values ('UUID_TAI_KHOAN_ADMIN','Quản trị viên','Quản trị viên');
-- Tài khoản Lái xe cần điền driver_id tương ứng.
-- CẢNH BÁO: Chỉ chạy file này trên Supabase project hoàn toàn mới.
