import { NextRequest, type NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuthUser, success } from '@/lib/auth-helpers';
import { withApiHandler } from '@/lib/api-handler';
import { z } from 'zod';

const reportSchema = z.object({
  listingId: z.string().min(1, 'ID de logement requis.'),
  reason: z.string().min(1, 'Le motif est requis.'),
  description: z.string().optional(),
});

async function handler(req: NextRequest): Promise<NextResponse> {
  const user = await requireAuthUser(req);
  const body = await req.json();
  const data = reportSchema.parse(body);

  const report = await prisma.report.create({
    data: {
      reporterId: user.id,
      listingId: data.listingId,
      reason: data.reason,
      description: data.description,
    },
  });

  return success(report, 201);
}

export const POST = withApiHandler(handler as Parameters<typeof withApiHandler>[0]);
