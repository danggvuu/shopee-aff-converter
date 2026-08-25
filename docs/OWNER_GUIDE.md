# HƯỚNG DẪN DÀNH CHO CHỦ SỞ HỮU (OWNER GUIDE)

Đây là tài liệu hướng dẫn từ A-Z để bạn có thể đưa mã nguồn này lên mạng, cấu hình tài khoản Shopee và chạy thật.

## A. Tạo GitHub repository
1. Vào GitHub.com, tạo một repository mới tên là `shopee-affiliate-converter`.
2. Commit code này và push lên repo đó.

## B. Đăng ký Shopee Affiliate & Open Platform (Quan trọng)
1. Truy cập [Shopee Affiliate Program](https://affiliate.shopee.vn/) và đăng ký tài khoản.
2. Xác minh thông tin thanh toán (CCCD, Ngân hàng, Mã số thuế).
3. Truy cập [Shopee Open Platform](https://open.shopee.com/).
4. Đăng ký tài khoản Developer (dùng tài khoản Shopee chính).
5. Tạo một **Application**. Chọn loại App hỗ trợ API Affiliate.
6. Sau khi được duyệt, lấy **App ID** và **App Secret**.
7. Sử dụng API lấy Access Token (theo tài liệu Open API).

## C. Database
1. Truy cập [Supabase](https://supabase.com) hoặc [Neon](https://neon.tech).
2. Tạo 1 database PostgreSQL miễn phí.
3. Lấy chuỗi kết nối `DATABASE_URL`.

## D. Deploy lên Vercel
1. Đăng nhập [Vercel](https://vercel.com) bằng GitHub.
2. Chọn "Add New Project" -> Import repository của bạn.
3. Trong phần **Environment Variables**, thêm:
   - `DATABASE_URL` = <URL lấy từ Supabase>
   - `SHOPEE_APP_ID` = <App ID>
   - `SHOPEE_APP_SECRET` = <App Secret>
   - `UPSTASH_REDIS_REST_URL` = <Tạo từ upstash.com> (nếu cần chống spam).
   - `NEXT_PUBLIC_APP_URL` = <https://ten-mien-cua-ban.com>
4. Bấm **Deploy**.

## E. Mua tên miền (Domain)
1. Mua tên miền tại Tenten, iNet, hoặc Cloudflare.
2. Trỏ bản ghi DNS: 
   - Type: A, Name: @, Value: 76.76.21.21 (Vercel IP)
3. Trong dashboard Vercel, chọn dự án -> Settings -> Domains -> Thêm tên miền. Vercel sẽ tự động cài HTTPS.

## F. Vận hành & Cập nhật
Mỗi khi bạn sửa code và push lên `main`, hệ thống CI/CD (GitHub Actions) sẽ kiểm tra lỗi, sau đó Vercel tự động build và deploy phiên bản mới nhất ra Internet.
