import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth-helpers';
import { UserRole } from '@sakany/shared';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole(req, UserRole.ADMIN);
    
    const { id } = await params;
    const body = await req.json();
    const verified = Boolean(body.verified);

    const listing = await prisma.listing.update({
      where: { id },
      data: { verified },
    });

    return NextResponse.json(listing);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: err.__httpStatus || 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole(req, UserRole.ADMIN);
    
    const { id } = await params;

    await prisma.listing.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: err.__httpStatus || 500 });
  }
}
