# WEB ĐIỀU HÀNH XE V1.3 — TÀI KHOẢN NỘI BỘ

Phiên bản nâng cấp độc lập từ V1.2, **không cần nhân viên cung cấp Gmail/email thật**. Super Admin hiện có vẫn đăng nhập bằng email.

## Cách hoạt động
Tên đăng nhập `laixehoa` được ánh xạ nội bộ thành `laixehoa@accounts.example.com` để dùng Supabase Auth email/password. Đây là định danh kỹ thuật thuộc miền `example.com` dành cho ví dụ, **không phải hòm thư thực sự**, không được dùng cho khôi phục bằng email. Vì vậy nhân viên phải liên hệ Admin để đặt lại mật khẩu.

## Triển khai
1. Giữ bản V1.2 Production. Sao lưu schema và dữ liệu Supabase trước khi nâng cấp.
2. Đẩy mã V1.3 lên branch riêng trên GitHub để kiểm tra Preview Deployment. Không upload `.env.local`, `.env` hay bất kỳ service_role/secret key nào.
3. Trên Supabase > Edge Functions, cập nhật/deploy function `dispatch-admin` từ `supabase/functions/dispatch-admin/index.ts`. Function cần môi trường `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` ở **Supabase server**, không bao giờ thêm `SUPABASE_SERVICE_ROLE_KEY` vào Vercel/Vite.
4. V1.3 giữ nguyên schema từ V1.2, không cần tạo bảng hoặc SQL mới. Chỉ hoạt động sau khi V1.2 SQL và Edge Function đã được triển khai đúng.
5. Đăng nhập Admin > Quản trị tài khoản > Tạo tài khoản nội bộ. Username 3–32 ký tự `[a-z][a-z0-9_]`, mật khẩu 6–128 ký tự.
6. Thử tài khoản nội bộ trên phiên Chrome ẩn danh, kiểm tra vai trò và quyền tại Supabase. Sau kiểm thử mới gộp nhánh vào `main`.

## Giới hạn và cảnh báo
- Supabase Auth vẫn lưu email kỹ thuật trong hệ thống. Email này không nhận được mail; không dùng chức năng mời qua mail hay quên mật khẩu theo email cho tài khoản nội bộ.
- Khóa `ban_duration` chặn đăng nhập/refresh mới, nhưng phiên access token đã cấp có thể còn hiệu lực đến khi hết hạn. Muốn thu hồi ngay mọi hoạt động cần bổ sung kiểm tra trạng thái ở tầng RLS/backend và cơ chế thu hồi session. **Chưa dùng chức năng Khóa để bảo đảm thu hồi tức thời.**
- Tính năng "buộc đổi mật khẩu lần đầu" chưa được thực thi tự động; người dùng phải dùng chức năng Đặt/đổi mật khẩu sau lần đầu đăng nhập. Hãy áp dụng quy định vận hành và thêm cưỡng chế phía backend ở phiên bản sau.
- Một username có thể trùng email kỹ thuật đã có; Supabase sẽ báo lỗi tạo trùng.
- `dispatch-admin` phải bật xác minh JWT và chỉ chấp nhận tài khoản Super Admin trong function; RLS cần được thử từng vai trò. Với khóa publishable mới, nếu gặp lỗi xác minh JWT trên Edge Functions, cần cấu hình verify JWT đúng theo hướng dẫn Supabase và thực hiện kiểm tra token trong function; không mở function quản trị công khai mà bỏ bước xác minh tài khoản.

## Sửa lỗi Failed to send a request to the Edge Function
- Đây là lỗi gọi dịch vụ, không nhất thiết là lỗi mật khẩu.
- Trong Supabase > Edge Functions, kiểm tra `dispatch-admin` đã được Deploy và trạng thái Active. Nếu chưa có, tạo mới đúng tên, chép nội dung `supabase/functions/dispatch-admin/index.ts` và Deploy.
- Kiểm tra tab Invocations/Logs: nếu không có request hoặc báo network, xem CORS, URL và tiện ích chặn trình duyệt. Nếu có HTTP 401/403, kiểm tra JWT và quyền Super Admin.
- Nếu dùng Supabase publishable key mới mà Edge Function bị từ chối JWT trước khi chạy, cần cấu hình verify JWT theo hướng dẫn hiện hành và giữ kiểm tra auth.getUser trong function; không để endpoint quản trị bỏ xác thực.
- Xác nhận quy tắc minimum password length trong Supabase > Authentication > Settings phù hợp 6 ký tự; nếu Supabase yêu cầu cao hơn, phải làm theo giới hạn cao hơn.
