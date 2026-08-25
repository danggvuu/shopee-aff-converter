# ARCHITECTURE
**Stack:** Next.js 14, TailwindCSS, Prisma, Supabase PostgreSQL, Upstash Redis.
**Mô hình:**
1. Người dùng vào UI (Next.js Frontend).
2. Nhập URL -> gọi API Route `/api/generate`.
3. Rate Limiting kiểm tra bằng Redis.
4. Abstract Provider `ShopeeAffiliateProvider` gọi API Shopee. (Mặc định dùng Mock trong code, cần điền Auth thật để live).
5. Sinh `shortCode` ngẫu nhiên lưu vào PostgreSQL bằng Prisma.
6. Route `/[shortcode]` chuyển hướng người dùng tới affiliate URL.
