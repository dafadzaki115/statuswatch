// Route Handler: GET (list monitors), POST (create monitor)
// Penghubung ke @statuswatch/backend — implementasi pada tahap CRUD Monitor

import { NextResponse } from 'next/server';

export async function GET() {
  // TODO: Panggil MonitorService dari @statuswatch/backend
  return NextResponse.json({ message: 'GET /api/monitors — belum diimplementasikan' }, { status: 501 });
}

export async function POST() {
  // TODO: Panggil MonitorService dari @statuswatch/backend
  return NextResponse.json({ message: 'POST /api/monitors — belum diimplementasikan' }, { status: 501 });
}
