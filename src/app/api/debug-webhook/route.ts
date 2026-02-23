import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

const REDIS_KEY = 'vouched:webhook_responses';

// GET: returns KV connection status + current stored responses
export async function GET() {
  const kvUrl = process.env.KV_REST_API_URL;
  const kvToken = process.env.KV_REST_API_TOKEN;

  const result: Record<string, unknown> = {
    env: {
      KV_REST_API_URL: kvUrl ? `${kvUrl.slice(0, 30)}…` : 'MISSING',
      KV_REST_API_TOKEN: kvToken ? `${kvToken.slice(0, 10)}…` : 'MISSING',
    },
    kv: null,
    responses: null,
  };

  try {
    const responses = await kv.get(REDIS_KEY);
    result.kv = 'connected';
    result.responses = responses ?? [];
  } catch (error) {
    result.kv = `error: ${error instanceof Error ? error.message : String(error)}`;
  }

  return NextResponse.json(result, { status: 200 });
}

// POST: manually inject a test webhook payload into KV
export async function POST() {
  try {
    const testPayload = {
      id: 'debug-test-' + Date.now(),
      status: 'completed',
      result: { success: true },
      _debug: true,
    };

    const existing = await kv.get<unknown[]>(REDIS_KEY) ?? [];
    const updated = [
      { timestamp: new Date().toISOString(), data: testPayload },
      ...existing,
    ].slice(0, 10);

    await kv.set(REDIS_KEY, updated, { ex: 600 });

    return NextResponse.json({ success: true, injected: testPayload });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
