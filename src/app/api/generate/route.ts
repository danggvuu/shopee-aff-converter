import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { ratelimit } from '@/lib/rate-limit';
import { getAffiliateProvider } from '@/lib/shopee';
import { isValidShopeeUrl, extractUrlFromText } from '@/lib/utils';
import { z } from 'zod';

const generateSchema = z.object({
  url: z.string().min(5).refine(isValidShopeeUrl, {
    message: "Chỉ hỗ trợ link sản phẩm Shopee hợp lệ (shopee.vn, s.shopee.vn, vn.shp.ee)",
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

    const rawInput = parseResult.data.url;
    const cleanUrl = extractUrlFromText(rawInput);
    
    // 1. Tạo link Affiliate chuẩn Shopee
    const provider = getAffiliateProvider();
    const result = await provider.generateAffiliateLink(cleanUrl);

    // 2. Tạo Shortcode thương hiệu siêu ngắn
    const host = request.headers.get('host') || 'shopee-aff-converter.vercel.app';
    const proto = host.includes('localhost') ? 'http' : 'https';
    const appUrl = `${proto}://${host}`;

    let shortCode = '';
    const parsedClean = new URL(cleanUrl);
    const hostname = parsedClean.hostname.toLowerCase();

    // TH 1: Link sản phẩm chuẩn -> Base36
    const itemMatch = cleanUrl.match(/i\.(\d+)\.(\d+)/) || cleanUrl.match(/product\/(\d+)\/(\d+)/);
    if (itemMatch) {
      const shopBase36 = BigInt(itemMatch[1]).toString(36);
      const itemBase36 = BigInt(itemMatch[2]).toString(36);
      shortCode = `${shopBase36}-${itemBase36}`;
    } 
    // TH 2: Link rút gọn App Mobile (s.shopee.vn / vn.shp.ee / shope.ee)
    else if (hostname.includes('s.shopee.vn') || hostname.includes('shp.ee') || hostname.includes('shope.ee')) {
      const cleanPath = parsedClean.pathname.replace(/^\/+/, '');
      const prefix = hostname.includes('s.shopee.vn') ? 'ss' : (hostname.includes('vn.shp.ee') ? 'sv' : 'se');
      shortCode = `m_${prefix}_${cleanPath}`;
    }
    // TH 3: Link chung -> Base64URL
    else {
      shortCode = `go_${Buffer.from(result.affiliateUrl).toString('base64url')}`;
    }

    // 3. Thử lưu vào Database nếu có
    try {
      await prisma.link.create({
        data: {
          shortCode,
          originalUrl: cleanUrl,
          affiliateUrl: result.affiliateUrl,
        },
      });
    } catch (dbErr) {
      console.warn('[DB_SAVE_LOG]', dbErr);
    }

    const finalShortUrl = `${appUrl}/${shortCode}`;

    return NextResponse.json({
      success: true,
      data: {
        shortUrl: finalShortUrl,
        affiliateUrl: result.affiliateUrl,
        originalUrl: cleanUrl,
        affiliateId: result.affiliateId
      }
    });

  } catch (error: any) {
    console.error('[API_GENERATE_ERROR]', error);
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Không thể tạo link. Vui lòng kiểm tra lại link Shopee!' } }, { status: 500 });
  }
}
