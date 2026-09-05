import { NextResponse } from 'next/server';
import { hapusSesi } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  await hapusSesi();
  return NextResponse.redirect(new URL('/masuk', req.url), { status: 303 });
}
