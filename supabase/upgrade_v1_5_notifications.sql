-- Web Dieu Hanh Xe V1.5 - CHAY MOT LAN TREN SUPABASE HIEN TAI
create table if not exists public.dispatch_device_tokens (
 id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id) on delete cascade,
 token text not null,platform text not null default 'android',updated_at timestamptz not null default now(),
 unique(user_id,token));
create table if not exists public.dispatch_notifications (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 request_id uuid references public.dispatch_requests(id) on delete set null,
 title text not null,body text not null,kind text not null,created_at timestamptz not null default now(),read_at timestamptz,
 unique(user_id,request_id,kind));
create index if not exists dispatch_notifications_user_idx on public.dispatch_notifications(user_id,created_at desc);
alter table public.dispatch_device_tokens enable row level security;
alter table public.dispatch_notifications enable row level security;
grant usage on schema public to authenticated, service_role;
grant select,insert,update,delete on public.dispatch_device_tokens to authenticated;
grant select,update on public.dispatch_notifications to authenticated;
grant select on public.dispatch_device_tokens,public.dispatch_notifications to service_role;
-- Restricted to own devices. Service role receives privileged access through server-side credentials only.
create policy "device_self_select" on public.dispatch_device_tokens for select to authenticated using(user_id=auth.uid());
create policy "device_self_insert" on public.dispatch_device_tokens for insert to authenticated with check(user_id=auth.uid());
create policy "device_self_update" on public.dispatch_device_tokens for update to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
create policy "device_self_delete" on public.dispatch_device_tokens for delete to authenticated using(user_id=auth.uid());
create policy "notification_self_select" on public.dispatch_notifications for select to authenticated using(user_id=auth.uid());
create policy "notification_self_update" on public.dispatch_notifications for update to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
-- Only trigger writes notifications; clients cannot insert/delete.
create or replace function public.dispatch_notify_workflow() returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
declare v_title text;v_body text;v_kind text;
begin
 if tg_op='UPDATE' and new.status is not distinct from old.status then return new;end if;
 if new.status='Chờ lãnh đạo duyệt' then
   v_title:='Có yêu cầu điều xe cần duyệt';v_body:=new.unit||': '||left(new.purpose,160);v_kind:='leader_pending';
   insert into public.dispatch_notifications(user_id,request_id,title,body,kind)
   select id,new.id,v_title,v_body,v_kind from public.dispatch_profiles where role='Lãnh đạo';
 elsif new.status='Chờ cán bộ điều xe' then
   v_title:='Có yêu cầu cần điều phối';v_body:=new.unit||': '||left(new.purpose,160);v_kind:='dispatch_pending';
   insert into public.dispatch_notifications(user_id,request_id,title,body,kind)
   select id,new.id,v_title,v_body,v_kind from public.dispatch_profiles where role='Cán bộ điều xe';
 elsif new.status='Đã phát hành' then
   v_title:='Bạn có lệnh điều xe mới';v_body:=new.unit||': '||left(new.purpose,160);v_kind:='driver_assigned';
   insert into public.dispatch_notifications(user_id,request_id,title,body,kind)
   select id,new.id,v_title,v_body,v_kind from public.dispatch_profiles where driver_id=new.driver_id and role='Lái xe';
 elsif new.status='Từ chối' then
   v_title:='Yêu cầu điều xe bị từ chối';v_body:=new.unit||': '||left(new.purpose,160);v_kind:='request_rejected';
 end if;
 if tg_op='UPDATE' and new.status in ('Chờ cán bộ điều xe','Đã phát hành','Từ chối') and new.created_by is not null then
   insert into public.dispatch_notifications(user_id,request_id,title,body,kind)
   values(new.created_by,new.id,case when new.status='Từ chối' then 'Yêu cầu bị từ chối' when new.status='Đã phát hành' then 'Đã phát hành phiếu điều xe' else 'Lãnh đạo đã duyệt yêu cầu' end,left(new.purpose,160),'requester_'||new.status)
   on conflict (user_id,request_id,kind) do nothing;
 end if;
 return new;
end $$;
drop trigger if exists trg_dispatch_notify_workflow on public.dispatch_requests;
create trigger trg_dispatch_notify_workflow after insert or update of status on public.dispatch_requests for each row execute function public.dispatch_notify_workflow();
-- Role 'Quản trị viên' không mặc định nhận thông báo của mọi lãnh đạo; cấp đúng vai trò cho người nhận.
