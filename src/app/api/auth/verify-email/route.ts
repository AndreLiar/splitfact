import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/auth/verify-email?token=xxx&email=xxx
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const token = searchParams.get('token');
  const email = searchParams.get('email');

  if (!token || !email) {
    return NextResponse.redirect(new URL('/auth/signin?error=invalid_token', req.url));
  }

  const record = await prisma.verificationToken.findFirst({
    where: { identifier: email, token },
  });

  if (!record) {
    return NextResponse.redirect(new URL('/auth/signin?error=invalid_token', req.url));
  }

  if (record.expires < new Date()) {
    await prisma.verificationToken.deleteMany({ where: { identifier: email } });
    return NextResponse.redirect(new URL('/auth/signin?error=token_expired', req.url));
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { email },
      data: { emailVerified: new Date() },
    }),
    prisma.verificationToken.deleteMany({ where: { identifier: email } }),
  ]);

  return NextResponse.redirect(new URL('/auth/signin?verified=1', req.url));
}
