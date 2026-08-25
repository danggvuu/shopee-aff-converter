# BÁO CÁO BẢO MẬT (SECURITY AUDIT)

Dự án này được thiết kế với các chuẩn bảo mật nghiêm ngặt cho môi trường Production:

1. **Anti-SSRF & URL Injection**: 
   Chỉ chấp nhận các host hợp lệ: `shopee.vn`, `www.shopee.vn`, `shope.ee`, `vn.shp.ee`. Các request với payload Javascript (`javascript:alert(1)`) hoặc từ host khác đều bị Zod Schema bắt và từ chối từ Level 1.
2. **Rate Limiting**:
   Sử dụng Token Bucket / Sliding Window qua Redis. Chặn hoàn toàn bot DDOS gửi hàng vạn request generate link mỗi phút. (Max 10 reqs/phút/IP).
3. **Secret Management**:
   Credentials (APP_SECRET, REDIS_TOKEN, DATABASE_URL) chỉ sống trên môi trường Node Server (Backend). Tuyệt đối không expose ra biến `NEXT_PUBLIC_`. Frontend không thể đọc được Secret này.
4. **SQL Injection**:
   Sử dụng Prisma ORM chuẩn, ngăn chặn hoàn toàn SQL Injection.
5. **Open Redirect**:
   Đầu cuối Short URL (`/[shortcode]`) chỉ trỏ tới URL đã được xử lý và lưu trong CSDL nội bộ. Người ngoài không thể chèn parameter để lừa server redirect tới các trang độc hại.
