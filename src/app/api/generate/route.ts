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
    
    const { success } = await ratelimit.limit(ip);
    if (!success) {
      return NextResponse.json({ success: false, error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Bạn đã thử quá nhiều lần, vui lòng đợi 1 phút.' } }, { status: 429 });
    }

    const body = await request.json();
    const parseResult = generateSchema.safeParse(body);
    
    if (!parseResult.success) {
      return NextResponse.json({ success: false, error: { code: 'INVALID_URL', message: parseResult.error.issues[0].message } }, { status: 400 });
    }

    const inputUrl = parseResult.data.url;
    
    const provider = getAffiliateProvider();
    const result = await provider.generateAffiliateLink(inputUrl);

    const shortCode = generateShortCode();

    const link = await prisma.link.create({
      data: {
        shortCode,
        originalUrl: inputUrl,
        affiliateUrl: result.affiliateUrl,
      },
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const finalUrl = `${appUrl}/${link.shortCode}`;

    return NextResponse.json({
      success: true,
      data: {
        shortUrl: finalUrl,
        affiliateUrl: result.affiliateUrl,
        originalUrl: inputUrl
      }
    });

  } catch (error: any) {
    console.error('[API_GENERATE_ERROR]', error);
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Hệ thống đang bận, vui lòng thử lại sau' } }, { status: 500 });
  }
}
