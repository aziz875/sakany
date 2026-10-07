import { NextRequest } from 'next/server';
import { randomBytes, createHash } from 'node:crypto';
import { prisma } from '@/lib/prisma';
import { success } from '@/lib/auth-helpers';
import { sendPasswordResetEmail } from '@/lib/email';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { withApiHandler } from '@/lib/api-handler';

async function handler(request: NextRequest) {
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
  const resetTokenHash = createHash('sha256').update(resetToken).digest('hex');
  const resetTokenExpiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await prisma.user.update({
    where: { id: user.id },
    data: { resetToken: resetTokenHash, resetTokenExpiresAt },
  });

  // Send the reset email (falls back to console.log in dev without RESEND_API_KEY).
  await sendPasswordResetEmail(user.email, resetToken);

  // In development (no email provider configured), return the reset link directly
  // so the flow works without setting up Resend. In production this is never returned.
  const isDev = process.env.NODE_ENV !== 'production';
  const hasEmailProvider = !!process.env.RESEND_API_KEY;

  if (isDev && !hasEmailProvider) {
    // Derive the base URL from the actual request so the link always matches
    // the port the user is really on (e.g. localhost:3001), not a hardcoded env.
    const host = request.headers.get('host') ?? 'localhost:3000';
    const protocol = request.headers.get('x-forwarded-proto') ?? 'http';
    const baseUrl = `${protocol}://${host}`;
    return success({
      message: 'Si un compte existe avec cet email, un lien de réinitialisation a été envoyé.',
      devResetLink: `${baseUrl}/auth/reset-password?token=${resetToken}`,
    });
  }

  return success({ message: 'Si un compte existe avec cet email, un lien de réinitialisation a été envoyé.' });
}

export const POST = withApiHandler(handler as Parameters<typeof withApiHandler>[0]);
