# HƯỚNG DẪN CHI PHÍ (COST ESTIMATE)

Dự án này được thiết kế để **tối ưu chi phí đến mức 0 đồng** cho 99% trường hợp sử dụng cơ bản. Nếu traffic lên hàng chục ngàn người mỗi ngày mới cần trả phí.

| Dịch vụ | Nền tảng Đề Xuất | Chi phí | Mục đích |
| --- | --- | --- | --- |
| **Hosting Frontend/Backend** | Vercel (Hobby Tier) | **FREE** | Máy chủ chạy website, tự động scale. |
| **Database (PostgreSQL)** | Supabase / Neon | **FREE** | Lưu trữ lịch sử link, short code, số lượt click (500MB miễn phí). |
| **Rate Limiting (Redis)** | Upstash Redis | **FREE** | Chống spam API (10.000 requests/ngày miễn phí). |
| **Shopee Open API** | Shopee Affiliate | **FREE** | Shopee cung cấp API miễn phí cho Developer. |
| **Mã Nguồn (Codebase)** | GitHub (Private Repo) | **FREE** | Quản lý source code, tự động chạy CI/CD test code. |
| **Tên miền (Domain)** | Cloudflare / iNet / Tenten | **PAID** (Khoảng 250k-350k/năm) | Mua tên miền (vd: domain.com) để tăng uy tín và chống Facebook block. *Bắt buộc phải mua để làm chuyên nghiệp.* |

**Tổng kết:** 
- **Chi phí cố định (Duy trì):** $0 / tháng.
- **Chi phí thiết lập ban đầu:** Khoảng 300,000 VNĐ cho năm đầu tiên (tiền mua Domain).
