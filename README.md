# Web Điều Hành Xe V1

Dự án độc lập, React + Vite, Supabase tùy chọn. **Không sử dụng hay kết nối Supabase của web V34.**

## Chạy
- Cài Node.js LTS.
- Giải nén, chạy `CHAY_WEB.bat` trên Windows; hoặc `npm install && npm run dev`.
- Mở http://localhost:5173. **Không mở trực tiếp `index.html`**: Vite cần máy chủ phát triển.
- Không cấu hình `.env.local`: chế độ demo dùng `localStorage` và chọn vai trò để mô phỏng, không có bảo mật.

## Kết nối Supabase riêng
- Tạo project mới và chạy `supabase/schema.sql` trong SQL Editor.
- Sao chép `.env.example` thành `.env.local`; điền `VITE_SUPABASE_URL` và `VITE_SUPABASE_ANON_KEY`.
- Tạo users tại Supabase Auth; cấp roles qua `dispatch_profiles` bằng SQL Editor theo hướng dẫn trong schema.
- Không đưa service_role key vào frontend.

## Luồng
Người đề nghị tạo yêu cầu → Lãnh đạo duyệt hoặc từ chối → Cán bộ điều xe phân phương tiện, tài xế; kiểm tra trùng lịch → Phát hành phiếu A4 → Lái xe xem phân công.

## Giới hạn V1
- Không có thông báo đẩy hoặc Zalo/SMS; lái xe cần mở hệ thống để xem.
- Chưa có ký số, lưu PDF máy chủ hoặc đính kèm hồ sơ.
- Chống trùng lịch ở frontend, chưa phải ràng buộc nguyên tử cơ sở dữ liệu khi nhiều điều phối viên thao tác đồng thời.
- Bản demo chỉ phục vụ thử quy trình; dữ liệu không dùng chung giữa máy.
