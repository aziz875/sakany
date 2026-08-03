import { NextRequest, NextResponse } from 'next/server';

// Very small in-memory rate limiter (per Node.js instance).
// For production with multiple instances, swap for Upstash Redis or similar.
// Keyed by IP + route so different endpoints have independent buckets.

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

// Simple window: N requests per WINDOW_MS per key.
const WINDOW_MS = 60_000; // 1 minute
const MAX_REQUESTS = 10;

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return request.headers.get('x-real-ip') ?? 'unknown';
}

export function rateLimit(
  request: NextRequest,
  max = MAX_REQUESTS,
  windowMs = WINDOW_MS,
): { limited: boolean; retryAfterSeconds?: number } {
  const key = `${getClientIp(request)}:${request.nextUrl.pathname}`;
  const now = Date.now();

  // Opportunistic cleanup so the map never grows unbounded.
  if (buckets.size > 10_000) {
    for (const [k, b] of buckets) {
      if (b.resetAt < now) buckets.delete(k);
    }
  }

  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { limited: false };
  }

  bucket.count += 1;
  if (bucket.count > max) {
    const retryAfterSeconds = Math.ceil((bucket.resetAt - now) / 1000);
    return { limited: true, retryAfterSeconds };
  }

  return { limited: false };
}

export function rateLimitResponse(retryAfterSeconds?: number): NextResponse {
  return NextResponse.json(
    { message: 'Trop de requêtes. Réessaie dans quelques instants.' },
    {
      status: 429,
      headers: retryAfterSeconds
        ? { 'Retry-After': String(retryAfterSeconds) }
        : undefined,
    },
  );
}