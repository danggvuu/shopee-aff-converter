export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getActiveAffiliateId } from '@/lib/shopee';

export async function GET(request: Request, { params }: { params: { shortcode: string } }) {
  try {
    const { shortcode } = params;
    const affiliateId = await getActiveAffiliateId();

    // 1. Kiểm tra nếu là dạng Base36 siêu ngắn (VD: b329-3z9r0q) -> Giải mã tức thì 0.001s
    if (shortcode.includes('-')) {
      const parts = shortcode.split('-');
      if (parts.length === 2) {
        try {
          const shopId = BigInt(parseInt(parts[0], 36)).toString();
          const itemId = BigInt(parseInt(parts[1], 36)).toString();
          const targetShopeeUrl = `https://shopee.vn/product/${shopId}/${itemId}?aff_id=${affiliateId}&utm_source=an_${affiliateId}&utm_medium=affiliates`;
          return NextResponse.redirect(targetShopeeUrl, { status: 302 });
        } catch (e) {
          console.warn('[BASE36_DECODE_ERR]', e);
        }
      }
    }

    // 2. Tra cứu trong Database nếu là mã ngẫu nhiên
    try {
      const link = await prisma.link.findUnique({
        where: { shortCode: shortcode },
      });

      if (link && link.status === 'ACTIVE') {
        prisma.link.update({
          where: { id: link.id },
          data: { clickCount: { increment: 1 } },
        }).catch(console.error);

        return NextResponse.redirect(link.affiliateUrl, { status: 302 });
      }
    } catch (dbErr) {
      console.warn('[DB_LOOKUP_SKIP]', dbErr);
    }

    // 3. Tương thích ngược với các link sp_ cũ
    if (shortcode.startsWith('sp_')) {
      const parts = shortcode.replace('sp_', '').split('_');
      if (parts.length === 2) {
        const [shopId, itemId] = parts;
        const targetShopeeUrl = `https://shopee.vn/product/${shopId}/${itemId}?aff_id=${affiliateId}&utm_source=an_${affiliateId}&utm_medium=affiliates`;
        return NextResponse.redirect(targetShopeeUrl, { status: 302 });
      }
    }

    return NextResponse.redirect(new URL('/', request.url));
  } catch (error) {
    console.error('[REDIRECT_ERROR]', error);
    return NextResponse.redirect(new URL('/', request.url));
  }
}
