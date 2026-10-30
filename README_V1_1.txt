WEB ĐIỀU HÀNH XE V1.1

Thay đổi:
- Danh mục Loại xe cần có sẵn, không phụ thuộc xe đã nhập.
- Sửa phê duyệt: UPDATE yêu cầu hiện có thay vì UPSERT (vốn cần INSERT policy).

Cách nâng cấp: giải nén V1.1 thành thư mục mới, sao chép .env.local từ V1 vào thư mục V1.1, chạy CHAY_WEB.bat. Không cần chạy lại schema.sql và không xóa dữ liệu Supabase.

Lưu ý: Nếu vẫn lỗi RLS, kiểm tra vai trò dispatch_profiles của tài khoản và xem SQL policies hiện có. Không tắt RLS.
