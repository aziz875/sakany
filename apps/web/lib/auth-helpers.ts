import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { createHash, randomUUID } from 'node:crypto';
import { prisma } from './prisma';

const ACCESS_TOKEN_EXPIRY = '15m';
export const REFRESH_TOKEN_DAYS_REMEMBER = 30;
export const REFRESH_TOKEN_DAYS_DEFAULT = 7;
export const REFRESH_TOKEN_COOKIE_NAME = 'sakany_refresh';

const COOKIE_PATH = '/';
const COOKIE_SAME_SITE = 'lax' as const;
const COOKIE_SECURE = process.env.NODE_ENV === 'production';

/**
 * Returns a validated JWT secret, or throws if the env var is missing/weak.
 * Using a function guarantees a non-null `string` type for jsonwebtoken.
 */
function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not set. Set a strong random secret in your environment.');
  }
  if (secret === 'change-me-in-production' || secret.length < 32) {
    throw new Error('JWT_SECRET is too weak. Use a random secret of at least 32 characters.');
  }
  return secret;
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

export function signAccessToken(payload: JwtPayload) {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: ACCESS_TOKEN_EXPIRY });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, getJwtSecret()) as JwtPayload;
}

function hashString(str: string): string {
  return createHash('sha256').update(str).digest('hex');
}

export function getRefreshTokenMaxAge(rememberMe = false) {
  return (rememberMe ? REFRESH_TOKEN_DAYS_REMEMBER : REFRESH_TOKEN_DAYS_DEFAULT) * 24 * 60 * 60;
}

export function createRefreshTokenCookie(refreshToken: string, rememberMe = false) {
  const maxAge = getRefreshTokenMaxAge(rememberMe);
  return `${REFRESH_TOKEN_COOKIE_NAME}=${encodeURIComponent(refreshToken)}; path=${COOKIE_PATH}; max-age=${maxAge}; samesite=${COOKIE_SAME_SITE};${COOKIE_SECURE ? ' Secure;' : ''} HttpOnly`;
}

export function clearRefreshTokenCookie() {
  return `${REFRESH_TOKEN_COOKIE_NAME}=; path=${COOKIE_PATH}; max-age=0; samesite=${COOKIE_SAME_SITE};${COOKIE_SECURE ? ' Secure;' : ''} HttpOnly`;
}

export function getRefreshTokenFromRequest(request: Request): string | null {
  const cookieHeader = request.headers.get('cookie');
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(';').reduce<Record<string, string>>((acc, cookie) => {
    const [name, ...valueParts] = cookie.trim().split('=');
    if (!name) return acc;
    acc[name] = decodeURIComponent(valueParts.join('='));
    return acc;
  }, {});

  return cookies[REFRESH_TOKEN_COOKIE_NAME] ?? null;
}

export function setRefreshTokenCookie(response: NextResponse, refreshToken: string, rememberMe = false) {
  response.cookies.set(REFRESH_TOKEN_COOKIE_NAME, refreshToken, {
    path: COOKIE_PATH,
    maxAge: getRefreshTokenMaxAge(rememberMe),
    sameSite: COOKIE_SAME_SITE,
    secure: COOKIE_SECURE,
    httpOnly: true,
  });
  return response;
}

export function clearRefreshTokenCookieResponse(response: NextResponse) {
  response.cookies.set(REFRESH_TOKEN_COOKIE_NAME, '', {
    path: COOKIE_PATH,
    maxAge: 0,
    sameSite: COOKIE_SAME_SITE,
    secure: COOKIE_SECURE,
    httpOnly: true,
  });
  return response;
}

export async function generateRefreshToken(userId: string, rememberMe = false) {
  const token = randomUUID() + randomUUID();
  const tokenHash = hashString(token);
  const refreshDays = rememberMe ? REFRESH_TOKEN_DAYS_REMEMBER : REFRESH_TOKEN_DAYS_DEFAULT;
  const expiresAt = new Date(Date.now() + refreshDays * 24 * 60 * 60 * 1000);

  await prisma.refreshToken.create({
    data: { userId, tokenHash, expiresAt },
  });

  return token;
}

type AuthUser = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: string;
  schoolVerified: boolean;
  isEmailVerified: boolean;
  createdAt: Date;
};

export async function getAuthUser(request: Request): Promise<AuthUser | null> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;

  try {
    const token = authHeader.slice(7);
    const payload = verifyToken(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
        schoolVerified: true,
        isEmailVerified: true,
        createdAt: true,
      },
    });
    return user;
  } catch {
    return null;
  }
}

/**
 * Asserts that the request is authenticated. Returns the user or throws a 401 response.
 * Use inside withApiHandler to reduce boilerplate.
 */
export async function requireAuthUser(request: Request): Promise<AuthUser> {
  const user = await getAuthUser(request);
  if (!user) {
    throw Object.assign(new Error('Non autorisé.'), { __httpStatus: 401, __httpMessage: 'Non autorisé.' });
  }
  return user;
}

/**
 * Asserts that the request is authenticated AND the user has the expected role.
 * Returns the user or throws a 401/403 response object.
 */
export async function requireRole(request: Request, role: string): Promise<AuthUser> {
  const user = await requireAuthUser(request);
  if (user.role !== role) {
    throw Object.assign(new Error('Accès refusé.'), { __httpStatus: 403, __httpMessage: 'Accès refusé.' });
  }
  return user;
}

export async function verifyRefreshToken(refreshToken: string) {
  const tokenHash = hashString(refreshToken);
  const stored = await prisma.refreshToken.findFirst({
    where: { tokenHash, expiresAt: { gt: new Date() } },
  });
  return stored;
}

export function unauthorized(message = 'Non autorisé.') {
  return NextResponse.json({ message }, { status: 401 });
}

export function forbidden(message = 'Accès refusé.') {
  return NextResponse.json({ message }, { status: 403 });
}

export function notFound(message = 'Introuvable.') {
  return NextResponse.json({ message }, { status: 404 });
}

export function badRequest(message: string) {
  return NextResponse.json({ message }, { status: 400 });
}

export function conflict(message: string) {
  return NextResponse.json({ message }, { status: 409 });
}

export function success(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}