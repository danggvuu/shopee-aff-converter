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

    // 2. Tạo link rút gọn siêu ngắn (chỉ 5 ký tự ngẫu nhiên)
    const host = request.headers.get('host') || 'shopee-aff-converter.vercel.app';
    const proto = host.includes('localhost') ? 'http' : 'https';
    const appUrl = `${proto}://${host}`;

    const shortCode = generateShortCode(5); // VD: x7K9a
    let finalShortUrl = `${appUrl}/${shortCode}`;

    // Lưu vào Database để điều hướng
    let dbSuccess = false;
    try {
      await prisma.link.create({
        data: {
          shortCode,
          originalUrl: inputUrl,
          affiliateUrl: result.affiliateUrl,
        },
      });
      dbSuccess = true;
    } catch (dbErr) {
      console.warn('[DB_SAVE_FAILED]', dbErr);
    }

    // Nếu DB chưa kết nối được, tự động gọi dịch vụ rút gọn TinyURL miễn phí làm fallback
    if (!dbSuccess) {
      try {
        const tinyRes = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(result.affiliateUrl)}`, {
          signal: AbortSignal.timeout(3000),
        });
        if (tinyRes.ok) {
          const tinyUrl = await tinyRes.text();
          if (tinyUrl && tinyUrl.startsWith('http')) {
            finalShortUrl = tinyUrl;
          }
        }
      } catch (tinyErr) {
        console.warn('[TINYURL_FALLBACK_FAILED]', tinyErr);
      }
    }

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
