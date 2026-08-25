import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Trích xuất link sạch từ đoạn văn bản người dùng copy trên App điện thoại
export function extractUrlFromText(text: string): string {
  if (!text) return '';
  const urlMatch = text.match(/https?:\/\/[^\s]+/i);
  return urlMatch ? urlMatch[0].trim() : text.trim();
}

export function isValidShopeeUrl(rawInput: string): boolean {
  try {
    const cleanUrl = extractUrlFromText(rawInput);
    const parsedUrl = new URL(cleanUrl);
    const validDomains = [
      'shopee.vn', 
      'www.shopee.vn', 
      'shope.ee', 
      'vn.shp.ee', 
      's.shopee.vn',
      'my.shp.ee',
      'sg.shp.ee'
    ];
    return validDomains.some(d => parsedUrl.hostname.toLowerCase().includes(d));
  } catch {
    return false;
  }
}

export function generateShortCode(length: number = 5): string {
  const chars = '23456789abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
