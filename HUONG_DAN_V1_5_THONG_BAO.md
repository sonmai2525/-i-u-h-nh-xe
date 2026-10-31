# WEB ĐIỀU HÀNH XE V1.5 – THÔNG BÁO

Bản này gồm thông báo trong web và nền tảng thông báo đẩy Firebase Cloud Messaging (FCM) Android. Chưa thể gửi push trước khi cấu hình Firebase.

## 1. Supabase

Sao lưu dự án. Chạy `supabase/upgrade_v1_5_notifications.sql` **một lần** trong SQL Editor dự án Điều hành xe hiện tại. Không chạy lại `schema.sql`.

Tạo yêu cầu sẽ thông báo cho tất cả tài khoản vai trò **Lãnh đạo**. Lãnh đạo duyệt sẽ báo **Cán bộ điều xe** và người tạo. Phát hành sẽ báo **Lái xe** có `dispatch_profiles.driver_id` trùng xe được phân công, và người đề nghị. Từ chối báo người đề nghị. Người dùng xem thông báo trong biểu tượng chuông và đánh dấu đã đọc. Dữ liệu thông báo tạo từ trigger theo chuyển trạng thái thực tế; không gửi dựa vào nút frontend. Vui lòng kiểm tra RLS đặc biệt với 3 vai trò.

## 2. Web Vercel

Cập nhật mã nguồn React V1.5 lên nhánh thử nghiệm, chạy `npm install`, `npm run build`, deploy và kiểm tra icon chuông. Giữ lại hai biến `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` như cũ. Sau khi kiểm thử mới merge vào main.

## 3. Firebase cho Android

Vào https://console.firebase.google.com/ → Add project → Add Android app; package name **vn.dieuhanhxe.noibo** (đọc lại `capacitor.config.json` để xác nhận). Tải `google-services.json`, đặt ở `DIEU_HANH_XE_ANDROID_APK_PROJECT/android/app/google-services.json` trên máy của bạn. File cấu hình này không chứa khóa quản trị dịch vụ. Cấu hình Google Services Gradle plugin nếu bản Capacitor Android hiện tại chưa có. Cần đảm bảo app Android có plugin `@capacitor/push-notifications` tương thích phiên bản Capacitor cài đặt, và chạy `npx cap sync android` trong gốc dự án Android.

Quan trọng: APK hiện tại tải web từ `server.url` Vercel. Code web phải nhận diện Capacitor native bridge và đăng ký token. **Kiểm thử FCM registration trên máy thật trước khi gửi thông báo tự động.** Ứng dụng Android cần cấp quyền nhận thông báo.

## 4. Edge Function gửi FCM

Tạo `dispatch-push` từ `supabase/functions/dispatch-push/index.ts`. Trong Supabase Edge Function Secrets, đặt `FCM_SERVICE_ACCOUNT_JSON` (JSON service account của Firebase; chỉ phía server), và `DISPATCH_WEBHOOK_SECRET` (chuỗi ngẫu nhiên dài). Không bao giờ đẩy các bí mật này lên GitHub hoặc Vercel frontend. Mã dùng các biến `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` trên môi trường Supabase Functions.

Database → Webhooks → tạo hook mới cho `public.dispatch_notifications`, sự kiện `INSERT`, POST đến Edge Function `dispatch-push`; thêm HTTP header `x-dispatch-webhook-secret` với cùng giá trị secret. Tùy cấu hình gateway, dùng cơ chế service-to-service đã được Supabase hỗ trợ, nhưng Edge Function **phải xác minh webhook secret**. Chức năng push không được cung cấp công khai để người ngoài gửi tùy ý.

## 5. Kiểm thử

- Đăng nhập Android bằng một tài khoản Lãnh đạo, cấp quyền thông báo; xác nhận token được ghi trong `dispatch_device_tokens`.
- Dùng tài khoản người đề nghị khác để tạo yêu cầu; kiểm tra một dòng mới ở `dispatch_notifications`, sau đó notification Android.
- Lãnh đạo duyệt: cán bộ điều xe nhận; cán bộ phát hành: tài khoản lái xe được gán `driver_id` nhận.
- Đăng xuất/đổi tài khoản trên cùng máy, kiểm tra thiết bị không còn nhận thông báo của người trước. Triển khai dọn token khi đăng xuất trước khi cấp APK chính thức cho nhiều người.

## 6. Giới hạn và an toàn

FCM có thể chậm hoặc không đến khi thiết bị mất mạng, tắt quyền thông báo hoặc bị hạn chế chạy nền. Không dùng push làm bằng chứng pháp lý duy nhất đã giao lệnh. Giao diện web cũng cần lịch sử thông báo; nhật ký phê duyệt trong DB vẫn là nguồn chính. Chức năng thông báo push chưa được kiểm thử trên Firebase thật, **chưa được xem là triển khai sản xuất hoàn tất**.
