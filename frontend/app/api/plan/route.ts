// Route Handler: PATCH plan (simulasi ganti paket)
// Penghubung ke @statuswatch/backend — implementasi pada tahap Plans

import { NextResponse } from 'next/server';

export async function PATCH() {
  return NextResponse.json({ message: 'PATCH /api/plan — belum diimplementasikan' }, { status: 501 });
}
