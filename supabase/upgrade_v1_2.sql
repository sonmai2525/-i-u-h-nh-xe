-- V1.2: Khoá bảo vệ tài khoản Super Admin cố định, không tắt RLS.
-- Chạy trên dự án Supabase Điều hành xe đang có.
create or replace function public.dispatch_protect_owner() returns trigger
language plpgsql security definer set search_path=public as $$
begin
  if exists (select 1 from auth.users where id=old.id and lower(email)='vansonvanhai27@gmail.com') then
     if new.role is distinct from old.role or new.id is distinct from old.id then
       raise exception 'Không thể thay đổi quyền của Super Admin';
     end if;
  end if;
  return new;
end $$;
drop trigger if exists trg_dispatch_protect_owner on public.dispatch_profiles;
create trigger trg_dispatch_protect_owner before update on public.dispatch_profiles
for each row execute function public.dispatch_protect_owner();

-- Chỉ chủ sở hữu được chỉnh profile qua API phía trình duyệt.
create or replace function public.dispatch_is_owner() returns boolean
language sql stable security definer set search_path=public as $$
 select exists (select 1 from auth.users u join public.dispatch_profiles p on p.id=u.id
 where u.id=auth.uid() and lower(u.email)='vansonvanhai27@gmail.com' and p.role='Quản trị viên')
$$;
drop policy if exists "profiles_admin_insert" on public.dispatch_profiles;
drop policy if exists "profiles_admin_update" on public.dispatch_profiles;
create policy "profiles_owner_insert" on public.dispatch_profiles for insert to authenticated with check(public.dispatch_is_owner());
create policy "profiles_owner_update" on public.dispatch_profiles for update to authenticated using(public.dispatch_is_owner()) with check(public.dispatch_is_owner());
create or replace function public.dispatch_guard_admin_role() returns trigger language plpgsql security definer set search_path=public as $$
begin
 if new.role='Quản trị viên' and not exists (select 1 from auth.users where id=new.id and lower(email)='vansonvanhai27@gmail.com') then
   raise exception 'Chỉ tài khoản chủ sở hữu được là Quản trị viên';
 end if;
 return new;
end $$;
drop trigger if exists trg_dispatch_guard_admin_role on public.dispatch_profiles;
create trigger trg_dispatch_guard_admin_role before insert or update on public.dispatch_profiles for each row execute function public.dispatch_guard_admin_role();
