import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function isValidShopeeUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    const validDomains = ['shopee.vn', 'www.shopee.vn', 'shope.ee', 'vn.shp.ee'];
    return validDomains.includes(parsedUrl.hostname);
  } catch {
    return false;
  }
}

export function generateShortCode(length: number = 6): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
