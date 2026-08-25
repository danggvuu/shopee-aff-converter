import { prisma } from '@/lib/db';

export interface AffiliateLinkResult {
  affiliateUrl: string;
  originalUrl: string;
  affiliateId: string;
}

export interface AffiliateProvider {
  generateAffiliateLink(inputUrl: string): Promise<AffiliateLinkResult>;
}

// Get active Affiliate ID from DB Setting or Environment Variable or Default
export async function getActiveAffiliateId(): Promise<string> {
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
      const parsedUrl = new URL(inputUrl);
      
      // Clean previous affiliate & tracking parameters from previous owners
      const paramsToRemove = [
        'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
        'aff_id', 'af_sub_siteid', 'af_siteid', 'af_sub_id', 'af_click_lookback',
        'smtt', 'deep_and_deferred'
      ];
      paramsToRemove.forEach(p => parsedUrl.searchParams.delete(p));

      // Append Admin's Shopee Affiliate Tracking parameters
      parsedUrl.searchParams.set('utm_source', `an_${affiliateId}`);
      parsedUrl.searchParams.set('utm_medium', 'affiliates');
      parsedUrl.searchParams.set('utm_campaign', `an_${affiliateId}`);
      parsedUrl.searchParams.set('aff_id', affiliateId);
      parsedUrl.searchParams.set('af_sub_siteid', affiliateId);
      parsedUrl.searchParams.set('af_siteid', `an_${affiliateId}`);

      return {
        originalUrl: inputUrl,
        affiliateUrl: parsedUrl.toString(),
        affiliateId,
      };
    } catch (err) {
      // Fallback string append if URL parsing fails
      const sep = inputUrl.includes('?') ? '&' : '?';
      return {
        originalUrl: inputUrl,
        affiliateUrl: `${inputUrl}${sep}utm_source=an_${affiliateId}&utm_medium=affiliates&aff_id=${affiliateId}`,
        affiliateId,
      };
    }
  }
}

export const getAffiliateProvider = (): AffiliateProvider => {
  return new DirectShopeeAffiliateProvider();
};
