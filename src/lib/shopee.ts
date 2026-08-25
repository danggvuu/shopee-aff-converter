export interface AffiliateLinkResult {
  affiliateUrl: string;
  originalUrl: string;
}

export interface AffiliateProvider {
  generateAffiliateLink(inputUrl: string): Promise<AffiliateLinkResult>;
}

export class MockShopeeProvider implements AffiliateProvider {
  async generateAffiliateLink(inputUrl: string): Promise<AffiliateLinkResult> {
    await new Promise((resolve) => setTimeout(resolve, 800));
    return {
      originalUrl: inputUrl,
      affiliateUrl: `https://shope.ee/mock_${Math.random().toString(36).substring(7)}`,
    };
  }
}

export class ShopeeAffiliateProvider implements AffiliateProvider {
  private appId: string;
  private appSecret: string;
  private accessToken: string;

  constructor() {
    this.appId = process.env.SHOPEE_APP_ID || '';
    this.appSecret = process.env.SHOPEE_APP_SECRET || '';
    this.accessToken = process.env.SHOPEE_ACCESS_TOKEN || '';
  }

  async generateAffiliateLink(inputUrl: string): Promise<AffiliateLinkResult> {
    if (!this.appId || !this.appSecret) {
      throw new Error('Missing Shopee API credentials');
    }

    // Official Implementation via Shopee Open API GraphQL/REST
    // This requires active developer account verification
    throw new Error('Real Shopee API Provider needs actual implementation with valid tokens');
  }
}

export const getAffiliateProvider = (): AffiliateProvider => {
  if (process.env.NODE_ENV === 'production' && process.env.SHOPEE_APP_ID) {
    // return new ShopeeAffiliateProvider(); 
    return new MockShopeeProvider();
  }
  return new MockShopeeProvider();
};
