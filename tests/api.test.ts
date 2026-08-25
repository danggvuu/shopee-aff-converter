import { isValidShopeeUrl } from '../src/lib/utils';
describe('URL Validation', () => {
  it('should accept valid shopee urls', () => {
    expect(isValidShopeeUrl('https://shopee.vn/product-name')).toBe(true);
    expect(isValidShopeeUrl('https://shope.ee/12345')).toBe(true);
  });
  it('should reject invalid urls', () => {
    expect(isValidShopeeUrl('https://google.com')).toBe(false);
    expect(isValidShopeeUrl('javascript:alert(1)')).toBe(false);
  });
});
