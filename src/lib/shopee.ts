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

export class DirectShopeeAffiliateProvider implements AffiliateProvider {
  async generateAffiliateLink(rawInput: string): Promise<AffiliateLinkResult> {
    const affiliateId = await getActiveAffiliateId();
    const cleanInputUrl = extractUrlFromText(rawInput);
    
    try {
      const parsedUrl = new URL(cleanInputUrl);
      const host = parsedUrl.hostname.toLowerCase();
      let targetAffiliateUrl = '';

      // 1. Nếu là link rút gọn Mobile của Shopee (s.shopee.vn, vn.shp.ee, shope.ee)
      if (host.includes('s.shopee.vn') || host.includes('shp.ee') || host.includes('shope.ee')) {
        const cleanPath = parsedUrl.pathname;
        const sep = cleanInputUrl.includes('?') ? '&' : '?';
        targetAffiliateUrl = `https://${parsedUrl.hostname}${cleanPath}?aff_id=${affiliateId}&utm_source=an_${affiliateId}&utm_medium=affiliates`;
      } 
      // 2. Nếu là link sản phẩm tiêu chuẩn (chứa i.ShopID.ItemID hoặc product/ShopID/ItemID)
      else {
        const itemMatch = cleanInputUrl.match(/i\.(\d+)\.(\d+)/) || cleanInputUrl.match(/product\/(\d+)\/(\d+)/);
        if (itemMatch) {
          const shopId = itemMatch[1];
          const itemId = itemMatch[2];
          targetAffiliateUrl = `https://shopee.vn/universal-link/product/${shopId}/${itemId}?aff_id=${affiliateId}&utm_source=an_${affiliateId}&utm_medium=affiliates`;
        } else {
          // Link danh mục hoặc campaign chung
          parsedUrl.searchParams.set('aff_id', affiliateId);
          parsedUrl.searchParams.set('utm_source', `an_${affiliateId}`);
          parsedUrl.searchParams.set('utm_medium', 'affiliates');
          targetAffiliateUrl = parsedUrl.toString();
        }
      }

      return {
        originalUrl: cleanInputUrl,
        affiliateUrl: targetAffiliateUrl,
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
