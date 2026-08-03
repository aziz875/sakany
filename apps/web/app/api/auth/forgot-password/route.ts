import { NextRequest } from 'next/server';
import { randomBytes } from 'node:crypto';
import { prisma } from '@/lib/prisma';
import { success } from '@/lib/auth-helpers';
import { sendPasswordResetEmail } from '@/lib/email';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  // Rate limit: 5 reset requests / minute per IP.
  const rl = rateLimit(request, 5);
  if (rl.limited) return rateLimitResponse(rl.retryAfterSeconds);

  const { email } = await request.json();
  if (!email) return success({ message: 'Si un compte existe avec cet email, un lien de réinitialisation a été envoyé.' });

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
  if (!user) {
    return success({ message: 'Si un compte existe avec cet email, un lien de réinitialisation a été envoyé.' });
  }

  const resetToken = randomBytes(32).toString('hex');
  const resetTokenExpiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await prisma.user.update({
    where: { id: user.id },
    data: { resetToken, resetTokenExpiresAt },
  });

  // Send the reset email (falls back to console.log in dev without RESEND_API_KEY).
  await sendPasswordResetEmail(user.email, resetToken);

  return success({ message: 'Si un compte existe avec cet email, un lien de réinitialisation a été envoyé.' });
}