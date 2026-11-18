// Route Handler: POST "Check now"
// Penghubung ke @statuswatch/backend — implementasi pada tahap Checker

import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json({ message: 'POST /api/monitors/[id]/check — belum diimplementasikan' }, { status: 501 });
}
