# Điều Hành Xe 3 — V1.7 Mobile UI

## Thay đổi
- Mobile header theo hàng: menu, tiêu đề, chuông và đăng xuất; hàng dưới chọn vai trò và nút bật Web Push; hàng riêng gọn cho đổi mật khẩu.
- Sửa xung đột CSS cũ biến nút bật thông báo thành chữ “Đổi MK”.
- Các bảng yêu cầu, duyệt, điều phối và phiếu gần đây hiển thị dạng thẻ trên điện thoại, mã UUID rút gọn nhưng mã đầy đủ giữ nguyên trong dữ liệu.
- Cải thiện kích thước nút, khoảng cách, form, popup thông báo và vùng an toàn trên điện thoại.
- Desktop giữ bảng đầy đủ; các hành động / quyền / Supabase / Firebase và mã Android không đổi.

## Cập nhật
1. Sao lưu bản V1.6.
2. Với ZIP thay đổi: chép `src/main.jsx`, `src/style.css` vào đúng thư mục `src` của dự án Web, chép hướng dẫn vào thư mục gốc.
3. Với ZIP đầy đủ: dùng thư mục `WEB_DIEU_HANH_XE_V1_3_1` để triển khai Web; không đưa `.env.local` hay các khóa bí mật vào GitHub.
4. Giữ nguyên các biến Vercel: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_FIREBASE_VAPID_KEY`.
5. Kiểm tra giao diện 320px, 375px, 430px và desktop; kiểm tra nút Web Push, quả chuông, điều xe, phê duyệt, phát hành và đăng xuất.

## Phạm vi
Chỉ thay đổi giao diện và nhãn nút; không nâng cấp cấu trúc dữ liệu hoặc logic thông báo. Không cần phát hành lại APK Android vì Android mở web từ Vercel, nhưng nên kiểm thử giao diện Android sau khi deploy.
