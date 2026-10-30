# WEB ĐIỀU HÀNH XE V1.4 – GIAO DIỆN DI ĐỘNG

- Giữ nguyên backend Supabase và Edge Function `dispatch-admin` đang chạy ổn định.
- V1.4 chỉ điều chỉnh giao diện; không cần chạy SQL mới.
- Menu điện thoại dùng nút ba gạch và nền phủ bấm để đóng.
- Cửa sổ biểu mẫu/phê duyệt chiếm toàn màn hình, ô nhập to hơn.
- Bảng được cuộn ngang độc lập, không làm toàn trang kéo ngang.
- Dashboard, đăng nhập, phiếu in được tối ưu cho chiều rộng nhỏ.

## Đưa lên mạng
1. Sao lưu nhánh main hiện tại.
2. Upload các file dự án V1.4 lên nhánh thử nghiệm `mobile-v1.4` trên GitHub. Không tải `.env.local`, `node_modules`.
3. Dùng Vercel Preview của nhánh để thử trên điện thoại thật; thử 360, 390, 430 px.
4. Kiểm tra tạo yêu cầu, duyệt, điều phối, quản trị tài khoản và xuất phiếu trước khi gộp nhánh vào `main`.
5. Khi đã ổn mới đóng gói Android APK.

## APK
Bản này là web tối ưu di động, **chưa phải file APK**. Để build APK cần cấu hình dự án Android (ví dụ Capacitor), Android SDK và ký ứng dụng. Không được coi file ZIP này là APK cài được.
