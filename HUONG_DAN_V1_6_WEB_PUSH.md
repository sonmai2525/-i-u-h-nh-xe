# Điều Hành Xe V1.6 – Web Push Chrome / Edge

## Phần đã thay đổi
- `src/webPush.js`: xin quyền khi nhấn nút, đăng ký FCM token trình duyệt vào `dispatch_device_tokens` (`platform=web`).
- `src/main.jsx`: thêm nút **Bật thông báo PC**, giữ nguyên đăng ký Android trong `src/push.js`.
- `public/firebase-messaging-sw.js`: Service Worker Firebase đã có trong bản nhận, giữ nguyên.
- `.env.example`: bổ sung tên biến VAPID; không chứa khóa thực tế.

## Triển khai
1. Sao lưu phiên bản V1.5 hiện tại. Giải nén bản FULL (hoặc chép các file CHANGED vào đúng vị trí của bản V1.5).
2. Giữ nguyên file `.env.local` riêng trên máy. Thêm `VITE_FIREBASE_VAPID_KEY` với khóa công khai lấy từ Firebase → Cloud Messaging → Web Push certificates. Không đưa service account JSON hay `SUPABASE_SERVICE_ROLE_KEY` vào web.
3. Trên Vercel, thêm `VITE_FIREBASE_VAPID_KEY` vào **Project Settings → Environment Variables**, đồng thời giữ nguyên hai biến `VITE_SUPABASE_URL` và `VITE_SUPABASE_ANON_KEY`; redeploy production để có hiệu lực.
4. Trong thư mục Web, chạy `npm ci` và `npm run build`. Deploy như quy trình Vercel hiện tại. `public/firebase-messaging-sw.js` phải truy cập được ở `https://<domain>/firebase-messaging-sw.js`.
5. Trên Chrome/Edge (HTTPS), đăng nhập, bấm **Bật thông báo PC** và chọn **Cho phép**. Kiểm tra bảng `dispatch_device_tokens` có hàng `platform=web` đúng người dùng.
6. Kiểm thử bằng một thông báo **mới** gửi đến user_id đó; kiểm tra cả thanh thông báo Windows và chuông trên web. Không dùng lại ID thông báo cũ. Kiểm tra Edge Function Logs nếu không nhận.

## Lưu ý
- Cùng một `user_id` có thể có token Android và Web; `dispatch-push` hiện có sẽ gửi đến tất cả token thuộc tài khoản đó.
- Web push khi đóng hoàn toàn trình duyệt phụ thuộc cài đặt hệ điều hành, trình duyệt, tiết kiệm pin và quyền thông báo. Khi tab ở tiền cảnh, quả chuông vẫn hiển thị; không bảo đảm banner hệ điều hành cho mọi trình duyệt.
- Bản ZIP không kèm `.env.local`, `node_modules` hoặc `dist`. Không thay thế nguyên bộ dự án Android đang chạy.
- Chưa xác nhận được cấu hình môi trường Vercel, quyền thông báo trên PC và thử nghiệm FCM thực tế từ môi trường này.
