import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const headers = {'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type','Access-Control-Allow-Methods':'POST, OPTIONS','Content-Type':'application/json'};
const respond=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers});
const roles=['Quản trị viên','Người đề nghị','Lãnh đạo','Cán bộ điều xe','Lái xe'];
const OWNER='vansonvanhai27@gmail.com';
serve(async(req)=>{
 if(req.method==='OPTIONS')return new Response('ok',{headers});
 if(req.method!=='POST')return respond({error:'Method not allowed'},405);
 try{
  const url=Deno.env.get('SUPABASE_URL')!,publishable=Deno.env.get('SUPABASE_ANON_KEY')!,secret=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const authorization=req.headers.get('Authorization')||'';
  if(!authorization.startsWith('Bearer '))return respond({error:'Cần đăng nhập'},401);
  const anon=createClient(url,publishable,{auth:{persistSession:false}});
  const {data:{user},error:userError}=await anon.auth.getUser(authorization.slice(7));
  if(userError||!user)return respond({error:'Phiên đăng nhập không hợp lệ'},401);
  const admin=createClient(url,secret,{auth:{persistSession:false}});
  const {data:profile,error:profileError}=await admin.from('dispatch_profiles').select('role').eq('id',user.id).single();
  if(profileError||user.email?.toLowerCase()!==OWNER||profile?.role!=='Quản trị viên')return respond({error:'Chỉ Super Admin được phép quản lý tài khoản'},403);
  const body=await req.json();
  if(body.action==='list'){
   const {data:users,error}=await admin.auth.admin.listUsers({page:1,perPage:1000});
   if(error)throw error;
   const {data:profiles,error:pe}=await admin.from('dispatch_profiles').select('id,full_name,role,driver_id');
   if(pe)throw pe;
   const byId=new Map((profiles||[]).map(p=>[p.id,p]));
   return respond({users:users.users.map(u=>({id:u.id,email:u.email,created_at:u.created_at,confirmed_at:u.email_confirmed_at,role:byId.get(u.id)?.role||'Chưa phân quyền',full_name:byId.get(u.id)?.full_name||'',driver_id:byId.get(u.id)?.driver_id||null}))});
  }
  if(body.action==='invite'){
   const email=String(body.email||'').trim().toLowerCase();const name=String(body.full_name||'').trim();const role=body.role;
   if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||!roles.includes(role)||role==='Quản trị viên'||!name||name.length>150)return respond({error:'Tên, email hoặc vai trò không hợp lệ'},400);
   const {data,error}=await admin.auth.admin.inviteUserByEmail(email);
   if(error)return respond({error:error.message},400);
   const {error:pe}=await admin.from('dispatch_profiles').upsert({id:data.user.id,full_name:name,role,driver_id:role==='Lái xe'?(body.driver_id||null):null},{onConflict:'id'});
   if(pe)return respond({error:'Đã mời tài khoản nhưng chưa tạo được hồ sơ: '+pe.message},500);
   return respond({ok:true,message:'Đã gửi email mời đặt mật khẩu và đăng nhập'});
  }
  if(body.action==='setRole'){
   const id=String(body.id||'');const role=body.role;
   if(!/^[a-f\d-]{36}$/i.test(id)||!roles.includes(role)||role==='Quản trị viên'||id===user.id)return respond({error:'Không được cấp quyền quản trị cao nhất hoặc tự sửa quyền'},400);
   const {data:target,error:te}=await admin.auth.admin.getUserById(id);
   if(te||!target.user)return respond({error:'Không tìm thấy tài khoản'},404);
   if(target.user.email?.toLowerCase()===OWNER)return respond({error:'Không được thay đổi Super Admin'},403);
   const {error}=await admin.from('dispatch_profiles').upsert({id,role,driver_id:role==='Lái xe'?(body.driver_id||null):null},{onConflict:'id'});
   if(error)throw error;
   return respond({ok:true});
  }
  return respond({error:'Thao tác không được hỗ trợ'},400);
 }catch(e){return respond({error:e instanceof Error?e.message:'Lỗi máy chủ'},500)}
});
