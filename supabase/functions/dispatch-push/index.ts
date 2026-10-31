// DB webhook -> FCM HTTP v1. Requires secrets: DISPATCH_WEBHOOK_SECRET,
// FCM_SERVICE_ACCOUNT_JSON, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.
import { createClient } from 'npm:@supabase/supabase-js@2';
import { JWT } from 'npm:google-auth-library@9';
Deno.serve(async req => {
  if(req.method!=='POST')return new Response('Method Not Allowed',{status:405});
  const expected=Deno.env.get('DISPATCH_WEBHOOK_SECRET');
  if(!expected||req.headers.get('x-dispatch-webhook-secret')!==expected)return new Response('Forbidden',{status:403});
  try {
    const payload=await req.json();const n=payload.record;
    if(payload.type!=='INSERT'||payload.table!=='dispatch_notifications'||!n?.id||!n?.user_id)return Response.json({skipped:true});
    const service=JSON.parse(Deno.env.get('FCM_SERVICE_ACCOUNT_JSON')||'{}');
    if(!service.project_id||!service.private_key||!service.client_email)throw Error('FCM credentials incomplete');
    const supabase=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const {data:devices,error}=await supabase.from('dispatch_device_tokens').select('token').eq('user_id',n.user_id);
    if(error)throw error;
    const client=new JWT({email:service.client_email,key:service.private_key,scopes:['https://www.googleapis.com/auth/firebase.messaging']});
    const token=await client.getAccessToken();if(!token.token)throw Error('FCM OAuth token missing');
    let sent=0;
    for(const d of devices||[]){
      const res=await fetch(`https://fcm.googleapis.com/v1/projects/${encodeURIComponent(service.project_id)}/messages:send`,{
        method:'POST',headers:{Authorization:`Bearer ${token.token}`,'Content-Type':'application/json'},
        body:JSON.stringify({message:{token:d.token,notification:{title:n.title,body:n.body},data:{request_id:n.request_id||'',notification_id:n.id}}})
      });
      if(res.ok)sent++;
      else { const err=await res.text();console.error('FCM send failed:',res.status,err.slice(0,400)); }
    }
    return Response.json({sent,devices:(devices||[]).length});
  } catch(e){console.error('dispatch-push:',String(e));return Response.json({error:'PUSH_SEND_FAILED'},{status:500})}
});
