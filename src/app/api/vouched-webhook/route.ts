import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

const REDIS_KEY = 'vouched:webhook_responses';
const MAX_RESPONSES = 10;
const TTL_SECONDS = 600; // 10 minutes

function getRedis() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    throw new Error('UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN must be set');
  }
  return new Redis({ url, token });
}

export async function POST(request: Request) {
  try {
    const webhookData = await request.json();
    console.log('Received Vouched webhook:', webhookData);

    const redis = getRedis();

    // Read existing responses, prepend new one, cap at MAX_RESPONSES
    const existing = await redis.get<Array<{ timestamp: string; data?: unknown; error?: string }>>(REDIS_KEY) ?? [];
    const updated = [
      { timestamp: new Date().toISOString(), data: webhookData },
      ...existing,
    ].slice(0, MAX_RESPONSES);

    await redis.set(REDIS_KEY, updated, { ex: TTL_SECONDS });

    return NextResponse.json({
      success: true,
      message: 'Webhook received successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error processing Vouched webhook:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Error processing webhook',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const redis = getRedis();
    const responses = await redis.get<Array<{ timestamp: string; data?: unknown; error?: string }>>(REDIS_KEY) ?? [];
    return NextResponse.json({ responses });
  } catch (error) {
    console.error('Error reading webhook responses from Redis:', error);
    return NextResponse.json(
      {
        responses: [],
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
