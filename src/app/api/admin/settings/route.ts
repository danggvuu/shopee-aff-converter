import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getActiveAffiliateId } from '@/lib/shopee';

const globalSettings = globalThis as unknown as {
  activeAffiliateId?: string;
  adminPassword?: string;
};

async function getAdminPassword(): Promise<string> {
  if (globalSettings.adminPassword) {
    return globalSettings.adminPassword;
  }
  try {
    const setting = await prisma.setting.findUnique({ where: { key: 'ADMIN_PASSWORD' } });
    if (setting && setting.value.trim()) return setting.value.trim();
  } catch (e) {
    console.warn('[DB_ADMIN_PW_SKIP]', e);
  }
  return process.env.ADMIN_SECRET || 'admin123';
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret') || request.headers.get('x-admin-secret');
  const currentAdminPw = await getAdminPassword();

  if (secret !== currentAdminPw) {
    return NextResponse.json({ success: false, error: 'Mật khẩu quản trị không đúng' }, { status: 401 });
  }

  const affiliateId = globalSettings.activeAffiliateId || await getActiveAffiliateId();
  return NextResponse.json({ success: true, affiliateId: affiliateId || '17365230043' });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { secret, affiliateId, newPassword } = body;
    const currentAdminPw = await getAdminPassword();

    if (secret !== currentAdminPw) {
      return NextResponse.json({ success: false, error: 'Mật khẩu quản trị hiện tại không đúng' }, { status: 401 });
    }

    // 1. Cập nhật Memory Cache lập tức (Không bao giờ lỗi)
    if (affiliateId && typeof affiliateId === 'string' && affiliateId.trim()) {
      globalSettings.activeAffiliateId = affiliateId.trim();
    }
    if (newPassword && typeof newPassword === 'string' && newPassword.trim()) {
      globalSettings.adminPassword = newPassword.trim();
    }

    // 2. Thử lưu vào Database PostgreSQL
    try {
      if (affiliateId && typeof affiliateId === 'string' && affiliateId.trim()) {
        await prisma.setting.upsert({
          where: { key: 'SHOPEE_AFFILIATE_ID' },
          update: { value: affiliateId.trim() },
          create: { key: 'SHOPEE_AFFILIATE_ID', value: affiliateId.trim() },
        });
      }
      if (newPassword && typeof newPassword === 'string' && newPassword.trim()) {
        await prisma.setting.upsert({
          where: { key: 'ADMIN_PASSWORD' },
          update: { value: newPassword.trim() },
          create: { key: 'ADMIN_PASSWORD', value: newPassword.trim() },
        });
      }
    } catch (dbErr) {
      console.warn('[DB_SAVE_FALLBACK]', dbErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Đã lưu cài đặt thành công!',
    });
  } catch (error: any) {
    console.error('[ADMIN_SETTINGS_ERROR]', error);
    return NextResponse.json({ success: false, error: 'Lỗi máy chủ khi lưu cài đặt' }, { status: 500 });
  }
}
