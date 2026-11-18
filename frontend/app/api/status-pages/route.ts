// Route Handler: GET (list), POST (create) status pages
// Penghubung ke @statuswatch/backend — implementasi pada tahap Status Page

import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ message: 'GET /api/status-pages — belum diimplementasikan' }, { status: 501 });
}

export async function POST() {
  return NextResponse.json({ message: 'POST /api/status-pages — belum diimplementasikan' }, { status: 501 });
}
