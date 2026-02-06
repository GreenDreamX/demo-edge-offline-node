// app/api/records/route.ts
import { NextResponse } from 'next/server';
import { saveRecord, getRecords, getStatus, toggleOfflineMode, trySync } from '@/lib/storage';

export async function GET() {
  return NextResponse.json({ 
    records: getRecords(), 
    status: getStatus() 
  });
}

export async function POST(request: Request) {
  const body = await request.json();
  
  if (body.action === 'toggle-offline') {
    const status = toggleOfflineMode();
    return NextResponse.json({ offline: status });
  }

  if (body.action === 'sync-now') {
    const result = await trySync();
    return NextResponse.json(result);
  }

  if (body.name) {
    const newRecord = await saveRecord(body);
    return NextResponse.json(newRecord);
  }

  return NextResponse.json({ error: 'Invalid Request' }, { status: 400 });
}