import { initializeApp, getApps, getApp } from 'firebase/app';
import { getMessaging, getToken, isSupported, onMessage } from 'firebase/messaging';

// Cấu hình ứng dụng Firebase Web (không chứa khóa quản trị).
const firebaseConfig = {
  apiKey: 'AIzaSyAbwaghICBP_ESRYjmYHKNUMqT610lrPHo',
  authDomain: 'dieu-hanh-xe-3.firebaseapp.com',
  projectId: 'dieu-hanh-xe-3',
  storageBucket: 'dieu-hanh-xe-3.firebasestorage.app',
  messagingSenderId: '749731528824',
  appId: '1:749731528824:web:d2b388b45ff72df1d16d8d'
};
let foregroundUnsubscribe;

export async function getWebPushState() {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
  return Notification.permission;
}

// Chỉ chạy khi người dùng chủ động bấm "Bật thông báo PC".
export async function registerWebPush(sb, userId) {
  if (!sb || !userId) throw new Error('Bạn cần đăng nhập trước');
  if (!window.isSecureContext || !('serviceWorker' in navigator) || !('Notification' in window))
    throw new Error('Cần Chrome/Edge trên HTTPS hoặc localhost');
  if (!(await isSupported())) throw new Error('Trình duyệt không hỗ trợ Firebase Messaging');
  const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY?.trim();
  if (!vapidKey) throw new Error('Thiếu VITE_FIREBASE_VAPID_KEY trên Vercel/.env.local');

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') throw new Error('Trình duyệt chưa được cấp quyền thông báo');

  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  const messaging = getMessaging(app);
  const sw = await navigator.serviceWorker.register('/firebase-messaging-sw.js', { scope: '/' });
  const token = await getToken(messaging, { vapidKey, serviceWorkerRegistration: sw });
  if (!token) throw new Error('Firebase chưa cấp FCM Token cho trình duyệt');
  const { error } = await sb.from('dispatch_device_tokens').upsert({
    user_id: userId, token, platform: 'web', updated_at: new Date().toISOString()
  }, { onConflict: 'user_id,token' });
  if (error) throw new Error('Không lưu được token vào Supabase: ' + error.message);

  // Khi đang mở tab, SDK không tự hiện banner hệ điều hành cho mọi trình duyệt.
  // Quả chuông trong app vẫn lấy thông báo từ Supabase.
  foregroundUnsubscribe?.();
  foregroundUnsubscribe = onMessage(messaging, (payload) => {
    if (Notification.permission === 'granted' && document.visibilityState === 'hidden') {
      const { title, body } = payload.notification || {};
      if (title) new Notification(title, { body: body || '', icon: '/favicon.ico' });
    }
  });
  return token;
}
