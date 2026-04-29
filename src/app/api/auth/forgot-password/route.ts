import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendPasswordResetEmail } from '@/lib/email-service';
import { rateLimit, getIp } from '@/lib/rate-limit';
import crypto from 'crypto';

// POST /api/auth/forgot-password
// Rate-limited to 3 requests per hour per IP.
// Always returns 200 to avoid leaking whether an email is registered.
export async function POST(request: Request) {
  const ip = getIp(request);
  const { allowed } = await rateLimit(`forgot-pw:${ip}`, 3, 60 * 60 * 1000);
  if (!allowed) {
    return NextResponse.json({ error: 'Trop de tentatives. Réessayez dans une heure.' }, { status: 429 });
  }

  const body = await request.json().catch(() => ({}));
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';

  if (!email) {
    return NextResponse.json({ error: 'Email requis.' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });

  if (user) {
    // Invalidate any existing tokens for this user before creating a new one
    await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.passwordResetToken.create({
      data: { token, userId: user.id, expiresAt },
    });

    await sendPasswordResetEmail(email, token);
  }

  // Always respond the same way — don't reveal whether the email exists
  return NextResponse.json({ ok: true });
}
