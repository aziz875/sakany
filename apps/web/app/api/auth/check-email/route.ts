import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { success } from '@/lib/auth-helpers';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';

export async function GET(request: NextRequest) {
  // Rate limit: 30 checks / minute per IP (used by the registration form while typing).
  const rl = rateLimit(request, 30);
  if (rl.limited) return rateLimitResponse(rl.retryAfterSeconds);

  try {
    const email = request.nextUrl.searchParams.get('email')?.toLowerCase().trim();
    if (!email) return success({ available: false });

    const user = await prisma.user.findUnique({ where: { email } });
    return success({ available: !user });
  } catch (err) {
    console.error('Check email error:', err);
    return NextResponse.json(
      { message: 'Impossible de vérifier cet email pour le moment.' },
      { status: 503 },
    );
  }
}
