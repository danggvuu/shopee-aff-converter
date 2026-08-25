import { prisma } from '@/lib/db';
import { extractUrlFromText } from '@/lib/utils';

export interface AffiliateLinkResult {
  affiliateUrl: string;
  originalUrl: string;
  affiliateId: string;
}

export interface AffiliateProvider {
  generateAffiliateLink(inputUrl: string): Promise<AffiliateLinkResult>;
}

const globalSettings = globalThis as unknown as {
  activeAffiliateId?: string;
};

export async function getActiveAffiliateId(): Promise<string> {
  if (globalSettings.activeAffiliateId) {
    return globalSettings.activeAffiliateId;
  }
  try {
    const setting = await prisma.setting.findUnique({
      where: { key: 'SHOPEE_AFFILIATE_ID' },
    });
    if (setting && setting.value.trim()) {
      return setting.value.trim();
    }
  } catch (error) {
    console.warn('[DB_SETTING_READ_FAILED] Using fallback Affiliate ID:', error);
  }
  return process.env.SHOPEE_AFFILIATE_ID || '17365230043';
}

// Hàm giải mã link rút gọn từ App Shopee (s.shopee.vn, vn.shp.ee) sang link gốc
async function resolveShopeeShortLink(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
      },
      signal: AbortSignal.timeout(4000),
    });
    return res.url || url;
  } catch (e) {
    console.warn('[SHORTLINK_RESOLVE_ERR]', e);
    return url;
  }
}

export class DirectShopeeAffiliateProvider implements AffiliateProvider {
  async generateAffiliateLink(rawInput: string): Promise<AffiliateLinkResult> {
    const affiliateId = await getActiveAffiliateId();
    const cleanInputUrl = extractUrlFromText(rawInput);
    
    try {
      let targetUrl = cleanInputUrl;

      // Nếu là link rút gọn từ App điện thoại (s.shopee.vn hoặc vn.shp.ee), giải mã lấy link gốc
      if (targetUrl.includes('s.shopee.vn') || targetUrl.includes('shp.ee') || targetUrl.includes('shope.ee')) {
        targetUrl = await resolveShopeeShortLink(targetUrl);
      }

      let cleanBaseUrl = targetUrl.split('?')[0];

      // Bóc tách ShopID và ItemID để tạo Universal Link
      const itemMatch = targetUrl.match(/i\.(\d+)\.(\d+)/) || targetUrl.match(/product\/(\d+)\/(\d+)/);
      if (itemMatch) {
        const shopId = itemMatch[1];
        const itemId = itemMatch[2];
        cleanBaseUrl = `https://shopee.vn/universal-link/product/${shopId}/${itemId}`;
      } else {
        cleanBaseUrl = `https://shopee.vn/universal-link/${cleanBaseUrl.replace(/https?:\/\/[^\/]+\/?/, '')}`;
      }

      const affiliateUrl = `${cleanBaseUrl}?aff_id=${affiliateId}&utm_source=an_${affiliateId}&utm_medium=affiliates`;

      return {
        originalUrl: cleanInputUrl,
        affiliateUrl,
        affiliateId,
      };
    } catch (err) {
      const sep = cleanInputUrl.includes('?') ? '&' : '?';
      return {
        originalUrl: cleanInputUrl,
        affiliateUrl: `${cleanInputUrl}${sep}aff_id=${affiliateId}&utm_source=an_${affiliateId}&utm_medium=affiliates`,
        affiliateId,
      };
    }
  }
}

export const getAffiliateProvider = (): AffiliateProvider => {
  return new DirectShopeeAffiliateProvider();
};
