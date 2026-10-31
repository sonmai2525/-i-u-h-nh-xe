// Chỉ chạy đăng ký FCM trong app Capacitor Android; web thường vẫn nhận thông báo trong app.
export async function initDispatchPush(sb,userId){
  let Capacitor,PushNotifications;
  try {({Capacitor}=await import('@capacitor/core'));if(!Capacitor.isNativePlatform())return;
    ({PushNotifications}=await import('@capacitor/push-notifications'));
  } catch(e){console.warn('Push plugin unavailable',e);return}
  const perm=await PushNotifications.checkPermissions();
  let granted=perm.receive==='granted';
  if(!granted){const res=await PushNotifications.requestPermissions();granted=res.receive==='granted'}
  if(!granted)return;
  const registration=await PushNotifications.addListener('registration',async token=>{
    const{error}=await sb.from('dispatch_device_tokens').upsert({user_id:userId,token:token.value,platform:'android',updated_at:new Date().toISOString()},{onConflict:'user_id,token'});
    if(error)console.warn('Push token save failed',error.message)
  });
  const errorHandler=await PushNotifications.addListener('registrationError',err=>console.warn('FCM registration error',err));
  const tap=await PushNotifications.addListener('pushNotificationActionPerformed',()=>{});
  await PushNotifications.register();
  return ()=>{registration.remove();errorHandler.remove();tap.remove()};
}
