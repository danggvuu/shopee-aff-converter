export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: Request, { params }: { params: { shortcode: string } }) {
  try {
    const { shortcode } = params;

    const link = await prisma.link.findUnique({
      where: { shortCode: shortcode },
    });

    if (!link || link.status !== 'ACTIVE') {
      return NextResponse.redirect(new URL('/', request.url));
    }

    prisma.link.update({
      where: { id: link.id },
      data: { clickCount: { increment: 1 } },
    }).catch(console.error);

    return NextResponse.redirect(link.affiliateUrl, { status: 302 });
  } catch (error) {
    console.error('[REDIRECT_ERROR]', error);
    return NextResponse.redirect(new URL('/', request.url));
  }
}
