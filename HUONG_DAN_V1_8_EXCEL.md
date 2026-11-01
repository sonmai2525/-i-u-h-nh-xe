# Điều Hành Xe 3 — V1.8 Excel

## Chức năng mới
- Quản trị viên: tại Danh sách xe và Danh sách lái xe chọn **Tải mẫu Excel**, nhập dữ liệu theo mẫu rồi **Nhập Excel**.
- File đầu vào .xlsx, tối đa 5 MB và 500 dòng/lần. Yêu cầu đúng tiêu đề, kiểm tra trùng trong file và với dữ liệu đã tải, rồi xác nhận trước khi ghi.
- Bảng dữ liệu hiện có không bị ghi đè. Trong trường hợp lỗi giữa các nhóm 50 dòng, nhóm đã nhập vẫn được giữ; cần rà soát trước khi thử lại.
- Tại **Báo cáo / phiếu** chọn tuần/tháng và một ngày trong kỳ; xem tổng trạng thái và **Xuất Excel** với 2 sheet Tổng hợp / Chi tiết. Báo cáo dựa vào *thời gian bắt đầu* chuyến, không phải ngày duyệt; sử dụng các bản ghi tài khoản có quyền xem.

## Triển khai
1. Sao lưu v1.7 và cơ sở dữ liệu trước khi thử nhập thực tế.
2. Thay các file được cung cấp trong bản thay đổi hoặc dùng ZIP dự án đầy đủ.
3. Dùng `npm install` để cài thư viện mới `exceljs` (đã thêm trong package.json), sau đó `npm run build`.
4. Không đưa `.env.local`, Secret hay Service Account JSON lên GitHub.
5. Triển khai Vercel Preview trước; kiểm thử 1 dòng xe, 1 dòng lái xe; đối chiếu dữ liệu Supabase, sau đó thử báo cáo tuần/tháng.
6. Không yêu cầu thay đổi schema Supabase. Nếu Supabase báo RLS hoặc thiếu quyền ghi, cần kiểm tra policy đang có trước khi thay đổi.

## Lưu ý
- Tính năng nhập hàng loạt chỉ dành cho xe và lái xe. Chưa nhập hàng loạt yêu cầu điều xe vì yêu cầu có quy trình duyệt / phát hành, tự động thông báo và cần xử lý quyền riêng.
- Tránh dùng người dùng khác đồng thời nhập danh sách; ràng buộc trùng ở tầng CSDL (nếu có) vẫn là chốt bảo vệ cuối.
- Chưa xác nhận được `npm run build` trên môi trường đóng gói; bắt buộc thử Preview trước Production.
