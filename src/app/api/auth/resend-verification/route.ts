import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import crypto from 'crypto';
import { rateLimit, getIp } from '@/lib/rate-limit';
import { sendVerificationEmail } from '@/lib/email-service';

// POST /api/auth/resend-verification  { email }
export async function POST(req: NextRequest) {
  const ip = getIp(req);
  const rl = await rateLimit(`resend-verify:${ip}`, 3, 60 * 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Trop de demandes. Réessayez dans une heure.' }, { status: 429 });
  }

  const { email } = await req.json().catch(() => ({}));
  if (!email) return NextResponse.json({ error: 'Email requis.' }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { email } });
  // Always respond 200 to prevent email enumeration
  if (!user || user.emailVerified) {
    return NextResponse.json({ message: 'Si ce compte existe et n\'est pas vérifié, un email a été envoyé.' });
  }

  // Delete any existing token and create a fresh one
  await prisma.verificationToken.deleteMany({ where: { identifier: email } });
  const token = crypto.randomBytes(32).toString('hex');
  await prisma.verificationToken.create({
    data: { identifier: email, token, expires: new Date(Date.now() + 24 * 60 * 60 * 1000) },
  });

  await sendVerificationEmail(email, token);
  return NextResponse.json({ message: 'Email de vérification renvoyé.' });
}
