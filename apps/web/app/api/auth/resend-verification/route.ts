import { NextRequest } from 'next/server';
import { randomBytes } from 'node:crypto';
import { prisma } from '@/lib/prisma';
import { success } from '@/lib/auth-helpers';
import { sendVerificationEmail } from '@/lib/email';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  // Rate limit: 5 resend requests / minute per IP.
  const rl = rateLimit(request, 5);
  if (rl.limited) return rateLimitResponse(rl.retryAfterSeconds);

  const { email } = await request.json();
  if (!email) return success({ message: 'Si le compte existe, un email de vérification a été envoyé.' });

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
  if (!user || user.isEmailVerified) {
    return success({ message: 'Si le compte existe, un email de vérification a été envoyé.' });
  }

  const verificationToken = randomBytes(32).toString('hex');
  const verificationTokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await prisma.user.update({
    where: { id: user.id },
    data: { verificationToken, verificationTokenExpiresAt },
  });

  // Send the verification email (falls back to console.log in dev without RESEND_API_KEY).
  await sendVerificationEmail(user.email, verificationToken);

  return success({ message: 'Email de vérification envoyé.' });
}