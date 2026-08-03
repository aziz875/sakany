import { NextRequest } from 'next/server';
import { getAuthUser, success, unauthorized } from '@/lib/auth-helpers';

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();
  return success(user);
}