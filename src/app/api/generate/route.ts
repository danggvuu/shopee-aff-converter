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
    
    // Rate Limiting (chống spam)
    try {
      const { success } = await ratelimit.limit(ip);
      if (!success) {
        return NextResponse.json({ success: false, error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Bạn đã thử quá nhiều lần, vui lòng đợi 1 phút.' } }, { status: 429 });
      }
    } catch (e) {
      console.warn('[RATELIMIT_BYPASS_DEV]', e);
    }

    const body = await request.json();
    const parseResult = generateSchema.safeParse(body);
    
    if (!parseResult.success) {
      return NextResponse.json({ success: false, error: { code: 'INVALID_URL', message: parseResult.error.issues[0].message } }, { status: 400 });
    }

    const inputUrl = parseResult.data.url;
    
    // 1. Tạo link Affiliate chuẩn
    const provider = getAffiliateProvider();
    const result = await provider.generateAffiliateLink(inputUrl);

    // 2. Tạo link rút gọn thương hiệu siêu ngắn
    const host = request.headers.get('host') || 'shopee-aff-converter.vercel.app';
    const proto = host.includes('localhost') ? 'http' : 'https';
    const appUrl = `${proto}://${host}`;

    let shortCode = '';
    const itemMatch = inputUrl.match(/i\.(\d+)\.(\d+)/) || inputUrl.match(/product\/(\d+)\/(\d+)/);
    if (itemMatch) {
      // Dạng rút gọn siêu tốc không phụ thuộc Database
      shortCode = `sp_${itemMatch[1]}_${itemMatch[2]}`;
    } else {
      shortCode = generateShortCode(6);
    }

    // 3. Thử lưu vào Database (để tracking số click nếu DB online)
    try {
      await prisma.link.create({
        data: {
          shortCode,
          originalUrl: inputUrl,
          affiliateUrl: result.affiliateUrl,
        },
      });
    } catch (dbErr) {
      console.warn('[DB_WRITE_LOG]', dbErr);
    }

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
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Không thể tạo link. Vui lòng kiểm tra lại đường dẫn Shopee!' } }, { status: 500 });
  }
}
