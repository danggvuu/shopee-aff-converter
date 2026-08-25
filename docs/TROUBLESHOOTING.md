# BẢNG XỬ LÝ SỰ CỐ (TROUBLESHOOTING)

| Vấn đề | Nguyên nhân | Giải pháp |
| --- | --- | --- |
| Lỗi "API unauthorized" | Thông tin đăng nhập Shopee sai hoặc hết hạn | Cập nhật lại `SHOPEE_ACCESS_TOKEN`, `APP_ID` và `APP_SECRET` trong `.env` |
| Báo lỗi "URL Shopee không hợp lệ" | Người dùng nhập link không phải từ shopee.vn | Hướng dẫn user lấy link chính xác từ App Shopee. Hệ thống sẽ chặn các link từ bên thứ 3. |
| Báo lỗi "Bạn đã thử quá nhiều lần" | Bị block bởi Rate Limit | Đợi 1 phút. Hoặc kiểm tra cấu hình Redis UPSTASH trong `.env`. |
| Lỗi Database Connection | Sai URL hoặc Server DB bị dừng | Kiểm tra lại `DATABASE_URL`, truy cập Supabase/Neon để lấy lại thông tin kết nối mới nhất. |
| Deploy thất bại (Vercel) | Quên set biến môi trường | Vào Vercel > Settings > Environment Variables và set đủ các biến như `.env.example` |
| Tên miền không hoạt động | Lỗi trỏ DNS | Đảm bảo đã trỏ bản ghi A (Value: 76.76.21.21) và xóa bản ghi A cũ của nhà cung cấp tên miền. Chờ 15 phút. |
