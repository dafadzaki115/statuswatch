// Route Handler: PATCH (update), DELETE status page by ID
// Penghubung ke @statuswatch/backend — implementasi pada tahap Status Page

import { NextResponse } from 'next/server';

export async function PATCH() {
  return NextResponse.json({ message: 'PATCH /api/status-pages/[id] — belum diimplementasikan' }, { status: 501 });
}

export async function DELETE() {
  return NextResponse.json({ message: 'DELETE /api/status-pages/[id] — belum diimplementasikan' }, { status: 501 });
}
