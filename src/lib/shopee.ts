import { prisma } from '@/lib/db';

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
  async generateAffiliateLink(inputUrl: string): Promise<AffiliateLinkResult> {
    const affiliateId = await getActiveAffiliateId();
    
    try {
      let cleanBaseUrl = inputUrl.split('?')[0];

      const itemMatch = cleanBaseUrl.match(/i\.(\d+)\.(\d+)/) || cleanBaseUrl.match(/product\/(\d+)\/(\d+)/);
      if (itemMatch) {
        const shopId = itemMatch[1];
        const itemId = itemMatch[2];
        // Sử dụng Universal Link chính thức của Shopee để ÉP MỞ THẲNG APP SHOPEE TRÊN ĐIỆN THOẠI
        cleanBaseUrl = `https://shopee.vn/universal-link/product/${shopId}/${itemId}`;
      }

      const affiliateUrl = `${cleanBaseUrl}?aff_id=${affiliateId}&utm_source=an_${affiliateId}&utm_medium=affiliates`;

      return {
        originalUrl: inputUrl,
        affiliateUrl,
        affiliateId,
      };
    } catch (err) {
      const sep = inputUrl.includes('?') ? '&' : '?';
      return {
        originalUrl: inputUrl,
        affiliateUrl: `${inputUrl}${sep}aff_id=${affiliateId}&utm_source=an_${affiliateId}&utm_medium=affiliates`,
        affiliateId,
      };
    }
  }
}

export const getAffiliateProvider = (): AffiliateProvider => {
  return new DirectShopeeAffiliateProvider();
};
