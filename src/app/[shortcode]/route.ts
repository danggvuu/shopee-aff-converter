export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getActiveAffiliateId } from '@/lib/shopee';

function createRedirectResponse(targetUrl: string) {
  // Trả về HTML thông minh kích hoạt ứng dụng Shopee trên mọi thiết bị
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Đang chuyển hướng tới Shopee...</title>
  <meta http-equiv="refresh" content="0;url=${targetUrl}">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #fff5f0; color: #333; text-align: center; padding: 20px; }
    .spinner { width: 44px; height: 44px; border: 4px solid #fed7aa; border-top: 4px solid #f97316; border-radius: 50%; animation: spin 0.8s linear infinite; margin-bottom: 20px; }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    .btn { display: inline-block; background: #f97316; color: white; text-decoration: none; padding: 14px 28px; border-radius: 12px; font-weight: bold; margin-top: 20px; box-shadow: 0 4px 12px rgba(249, 115, 22, 0.3); }
  </style>
</head>
<body>
  <div class="spinner"></div>
  <h2 style="margin: 0 0 8px; color: #c2410c;">Đang mở sản phẩm trên Shopee...</h2>
  <p style="margin: 0; color: #666; font-size: 14px;">Nếu ứng dụng không tự mở, vui lòng bấm nút bên dưới:</p>
  <a href="${targetUrl}" class="btn" id="openBtn">Mở trong App Shopee</a>
  <script>
    window.location.href = "${targetUrl}";
    setTimeout(function() {
      document.getElementById('openBtn').click();
    }, 200);
  </script>
</body>
</html>`;

  return new NextResponse(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Location': targetUrl,
    },
  });
}

export async function GET(request: Request, { params }: { params: { shortcode: string } }) {
  try {
    const { shortcode } = params;
    const affiliateId = await getActiveAffiliateId();

    // 1. Giải mã Base36 (VD: b3m7t-3xvd6cq)
    if (shortcode.includes('-') && !shortcode.startsWith('m_')) {
      const parts = shortcode.split('-');
      if (parts.length === 2) {
        try {
          const shopId = BigInt(parseInt(parts[0], 36)).toString();
          const itemId = BigInt(parseInt(parts[1], 36)).toString();
          const targetShopeeUrl = `https://shopee.vn/universal-link/product/${shopId}/${itemId}?aff_id=${affiliateId}&utm_source=an_${affiliateId}&utm_medium=affiliates`;
          return createRedirectResponse(targetShopeeUrl);
        } catch (e) {
          console.warn('[BASE36_DECODE_ERR]', e);
        }
      }
    }

    // 2. Giải mã link Mobile App (VD: m_ss_7f4aB9x2)
    if (shortcode.startsWith('m_')) {
      const parts = shortcode.split('_');
      if (parts.length >= 3) {
        const prefix = parts[1];
        const code = parts.slice(2).join('_');
        let domain = 's.shopee.vn';
        if (prefix === 'sv') domain = 'vn.shp.ee';
        if (prefix === 'se') domain = 'shope.ee';

        const targetShopeeUrl = `https://${domain}/${code}?aff_id=${affiliateId}&utm_source=an_${affiliateId}&utm_medium=affiliates`;
        return createRedirectResponse(targetShopeeUrl);
      }
    }

    // 3. Giải mã Base64URL (VD: go_...)
    if (shortcode.startsWith('go_')) {
      try {
        const b64 = shortcode.replace('go_', '');
        const targetUrl = Buffer.from(b64, 'base64url').toString('utf-8');
        if (targetUrl.startsWith('http')) {
          return createRedirectResponse(targetUrl);
        }
      } catch (e) {
        console.warn('[B64_DECODE_ERR]', e);
      }
    }

    // 4. Tra cứu trong Database nếu có
    try {
      const link = await prisma.link.findUnique({
        where: { shortCode: shortcode },
      });

      if (link && link.status === 'ACTIVE') {
        prisma.link.update({
          where: { id: link.id },
          data: { clickCount: { increment: 1 } },
        }).catch(console.error);

        return createRedirectResponse(link.affiliateUrl);
      }
    } catch (dbErr) {
      console.warn('[DB_LOOKUP_SKIP]', dbErr);
    }

    // 5. Tương thích link sp_ cũ
    if (shortcode.startsWith('sp_')) {
      const parts = shortcode.replace('sp_', '').split('_');
      if (parts.length === 2) {
        const [shopId, itemId] = parts;
        const targetShopeeUrl = `https://shopee.vn/universal-link/product/${shopId}/${itemId}?aff_id=${affiliateId}&utm_source=an_${affiliateId}&utm_medium=affiliates`;
        return createRedirectResponse(targetShopeeUrl);
      }
    }

    return NextResponse.redirect(new URL('/', request.url));
  } catch (error) {
    console.error('[REDIRECT_ERROR]', error);
    return NextResponse.redirect(new URL('/', request.url));
  }
}
