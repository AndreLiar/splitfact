import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// POST /api/auth/reset-password
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const token = typeof body.token === 'string' ? body.token.trim() : '';
  const password = typeof body.password === 'string' ? body.password : '';

  if (!token || !password) {
    return NextResponse.json({ error: 'Token et mot de passe requis.' }, { status: 400 });
  }

  if (password.length < 8) {
    return NextResponse.json({ error: 'Le mot de passe doit contenir au moins 8 caractères.' }, { status: 400 });
  }

  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { token },
    include: { user: { select: { id: true, password: true } } },
  });

  if (!resetToken) {
    return NextResponse.json({ error: 'Lien invalide ou déjà utilisé.' }, { status: 400 });
  }

  if (resetToken.expiresAt < new Date()) {
    await prisma.passwordResetToken.delete({ where: { token } });
    return NextResponse.json({ error: 'Ce lien a expiré. Faites une nouvelle demande.' }, { status: 400 });
  }

  // Only email/password accounts have a password to reset
  if (!resetToken.user.password) {
    return NextResponse.json({ error: 'Ce compte utilise une connexion Google — pas de mot de passe à réinitialiser.' }, { status: 400 });
  }

  const hashed = await bcrypt.hash(password, 10);

  await prisma.$transaction([
    prisma.user.update({ where: { id: resetToken.userId }, data: { password: hashed } }),
    prisma.passwordResetToken.delete({ where: { token } }),
  ]);

  return NextResponse.json({ ok: true });
}
