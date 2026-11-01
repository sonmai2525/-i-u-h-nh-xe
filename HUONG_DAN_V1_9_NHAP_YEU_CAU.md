# Điều Hành Xe 3 V1.9 — Nhập yêu cầu điều xe bằng Excel

## Chức năng
- Tại mục **Yêu cầu điều xe**, quản trị viên bấm **Tải mẫu Excel** để tải mẫu, điền dữ liệu và **Nhập Excel**.
- Các cột bắt buộc: Đơn vị đề nghị, Người đề nghị, Loại xe cần, Nội dung công việc, Địa điểm làm việc, Thời gian bắt đầu, Thời gian kết thúc.
- Mỗi yêu cầu nhập được tạo ở trạng thái **Chờ lãnh đạo duyệt**, không tự phân công xe, lái xe hay phát hành.
- Giới hạn 100 dòng/file, kiểm tra dữ liệu thiếu, ngày giờ sai và trùng trong file/dữ liệu đã tải.
- Hệ thống yêu cầu xác nhận trước khi ghi. Nhập hàng loạt có thể kích hoạt thông báo cho lãnh đạo.
- Khi nhập lỗi giữa các nhóm: những nhóm đã ghi thành công không được hoàn tác tự động; xem thông báo và kiểm tra dữ liệu trước khi nhập lại.

## Triển khai
- Sao lưu V1.8, đưa mã nguồn lên nhánh thử nghiệm trước.
- Giữ nguyên cấu hình Vercel, Supabase, Firebase và ứng dụng Android.
- Không đưa file `.env.local` hoặc khóa bí mật lên GitHub.
- Kiểm tra với 1 dòng thử, tài khoản quản trị viên và tài khoản lãnh đạo; chỉ sau đó mới nhập dữ liệu thật.
- Không cần SQL migration mới; sử dụng các cột hiện có của `dispatch_requests`.
- Việc cấp quyền nhập dựa vào RLS của Supabase và kiểm tra vai trò trên giao diện.
