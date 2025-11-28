// app/api/webhooks/doku/test/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  return NextResponse.json({
    success: true,
    message: 'DOKU webhook endpoint is reachable',
    timestamp: new Date().toISOString(),
    url: req.url
  });
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  
  console.log('🧪 [WEBHOOK TEST] Received test webhook:', {
    headers: Object.fromEntries(req.headers),
    body: body
  });

  return NextResponse.json({
    success: true,
    message: 'Test webhook received successfully',
    timestamp: new Date().toISOString(),
    body: body ? JSON.parse(body) : null
  });
}