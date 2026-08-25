import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getActiveAffiliateId } from '@/lib/shopee';

const ADMIN_SECRET = process.env.ADMIN_SECRET || 'admin123';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret') || request.headers.get('x-admin-secret');

  if (secret !== ADMIN_SECRET) {
    return NextResponse.json({ success: false, error: 'Mật khẩu quản trị không đúng' }, { status: 401 });
  }

  const affiliateId = await getActiveAffiliateId();
  return NextResponse.json({ success: true, affiliateId });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { secret, affiliateId } = body;

    if (secret !== ADMIN_SECRET) {
      return NextResponse.json({ success: false, error: 'Mật khẩu quản trị không đúng' }, { status: 401 });
    }

    if (!affiliateId || typeof affiliateId !== 'string' || !affiliateId.trim()) {
      return NextResponse.json({ success: false, error: 'Affiliate ID không hợp lệ' }, { status: 400 });
    }

    const cleanId = affiliateId.trim();

    // Upsert into DB Setting table
    await prisma.setting.upsert({
      where: { key: 'SHOPEE_AFFILIATE_ID' },
      update: { value: cleanId },
      create: { key: 'SHOPEE_AFFILIATE_ID', value: cleanId },
    });

    return NextResponse.json({
      success: true,
      message: 'Cập nhật Affiliate ID thành công!',
      affiliateId: cleanId,
    });
  } catch (error: any) {
    console.error('[ADMIN_SETTINGS_ERROR]', error);
    return NextResponse.json({ success: false, error: 'Lỗi máy chủ khi lưu cài đặt' }, { status: 500 });
  }
}
