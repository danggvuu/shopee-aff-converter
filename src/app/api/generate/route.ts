import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { ratelimit } from '@/lib/rate-limit';
import { getAffiliateProvider } from '@/lib/shopee';
import { isValidShopeeUrl, generateShortCode } from '@/lib/utils';
import { z } from 'zod';

const generateSchema = z.object({
  url: z.string().url().refine(isValidShopeeUrl, {
    message: "Chỉ hỗ trợ URL từ shopee.vn hoặc shope.ee",
  }),
});

export async function POST(request: Request) {
  try {
    const ip = request.headers.get('x-forwarded-for') ?? '127.0.0.1';
    
    // Rate Limiting
    try {
      const { success } = await ratelimit.limit(ip);
      if (!success) {
        return NextResponse.json({ success: false, error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Bạn thao tác quá nhanh, vui lòng đợi 1 phút.' } }, { status: 429 });
      }
    } catch (e) {
      console.warn('[RATELIMIT_BYPASS]', e);
    }

    const body = await request.json();
    const parseResult = generateSchema.safeParse(body);
    
    if (!parseResult.success) {
      return NextResponse.json({ success: false, error: { code: 'INVALID_URL', message: parseResult.error.issues[0].message } }, { status: 400 });
    }

    const inputUrl = parseResult.data.url;
    
    // 1. Tạo link Affiliate chuẩn Shopee
    const provider = getAffiliateProvider();
    const result = await provider.generateAffiliateLink(inputUrl);

    // 2. Tạo Shortcode thương hiệu siêu ngắn bằng thuật toán Base36 (Không bao giờ cần trung gian, không dính quảng cáo)
    const host = request.headers.get('host') || 'shopee-aff-converter.vercel.app';
    const proto = host.includes('localhost') ? 'http' : 'https';
    const appUrl = `${proto}://${host}`;

    let shortCode = '';
    const itemMatch = inputUrl.match(/i\.(\d+)\.(\d+)/) || inputUrl.match(/product\/(\d+)\/(\d+)/);
    if (itemMatch) {
      // Mã hóa ngắn gọn: ShopID + ItemID sang Base36 (chỉ dài tầm 8-10 ký tự)
      const shopBase36 = BigInt(itemMatch[1]).toString(36);
      const itemBase36 = BigInt(itemMatch[2]).toString(36);
      shortCode = `${shopBase36}-${itemBase36}`;
    } else {
      shortCode = generateShortCode(5);
    }

    // 3. Thử lưu vào Database nếu có
    try {
      await prisma.link.create({
        data: {
          shortCode,
          originalUrl: inputUrl,
          affiliateUrl: result.affiliateUrl,
        },
      });
    } catch (dbErr) {
      console.warn('[DB_SAVE_LOG]', dbErr);
    }

    // Link chính chủ của sếp 100%, 0 giây chuyển hướng, không qua TinyURL
    const finalShortUrl = `${appUrl}/${shortCode}`;

    return NextResponse.json({
      success: true,
      data: {
        shortUrl: finalShortUrl,
        affiliateUrl: result.affiliateUrl,
        originalUrl: inputUrl,
        affiliateId: result.affiliateId
      }
    });

  } catch (error: any) {
    console.error('[API_GENERATE_ERROR]', error);
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Không thể tạo link. Vui lòng thử lại!' } }, { status: 500 });
  }
}
