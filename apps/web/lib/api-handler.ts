import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

/**
 * Formats a ZodError into a developer-friendly error response with field-level messages.
 */
function formatZodError(err: ZodError) {
  const details = err.issues.map((issue) => ({
    field: issue.path.join('.') || 'body',
    message: issue.message,
  }));
  return NextResponse.json(
    { message: 'Données invalides.', details },
    { status: 400 },
  );
}

type ApiHandler = (request: Request, context?: unknown) => Promise<NextResponse>;

/**
 * A higher-order function that wraps an API handler with:
 * - Global ZodError formatting (returns 400 with field details)
 * - Prisma known error handling (e.g. unique constraint → 409)
 * - Generic 500 fallback that never leaks stack traces to the client
 */
export function withApiHandler(handler: ApiHandler): ApiHandler {
  return async (request, context) => {
    try {
      return await handler(request, context);
    } catch (err) {
      if (err instanceof ZodError) {
        return formatZodError(err);
      }

      // Prisma P2002: Unique constraint violation
      if (
        typeof err === 'object' &&
        err !== null &&
        'code' in err &&
        (err as { code: string }).code === 'P2002'
      ) {
        return NextResponse.json({ message: 'Cette ressource existe déjà.' }, { status: 409 });
      }

      // Prisma P2025: Record not found
      if (
        typeof err === 'object' &&
        err !== null &&
        'code' in err &&
        (err as { code: string }).code === 'P2025'
      ) {
        return NextResponse.json({ message: 'Ressource introuvable.' }, { status: 404 });
      }

      // Custom HTTP errors thrown by requireAuthUser / requireRole
      if (
        typeof err === 'object' &&
        err !== null &&
        '__httpStatus' in err
      ) {
        const httpErr = err as { __httpStatus: number; __httpMessage?: string };
        return NextResponse.json(
          { message: httpErr.__httpMessage ?? 'Erreur.' },
          { status: httpErr.__httpStatus },
        );
      }

      // Never leak internal errors to the client
      console.error('[API Error]', err);
      return NextResponse.json(
        { message: 'Une erreur interne est survenue. Veuillez réessayer.' },
        { status: 500 },
      );
    }
  };
}
