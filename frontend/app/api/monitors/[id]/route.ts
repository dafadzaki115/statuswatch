// Route Handler: GET (detail), PATCH (update), DELETE monitor by ID
// Penghubung ke @statuswatch/backend — implementasi pada tahap CRUD Monitor

import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ message: 'GET /api/monitors/[id] — belum diimplementasikan' }, { status: 501 });
}

export async function PATCH() {
  return NextResponse.json({ message: 'PATCH /api/monitors/[id] — belum diimplementasikan' }, { status: 501 });
}

export async function DELETE() {
  return NextResponse.json({ message: 'DELETE /api/monitors/[id] — belum diimplementasikan' }, { status: 501 });
}
