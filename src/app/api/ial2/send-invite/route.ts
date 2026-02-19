import { NextRequest, NextResponse } from 'next/server';

interface SendInviteRequestBody {
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  crosscheckReferenceId?: string;
}

// All fields are top-level per the Vouched OpenAPI spec (no 'parameters' wrapper)
interface VouchedInvitePayload {
  type: 'idv';
  contact: 'phone';
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  crosscheckReferenceId?: string; // Links IDV job to prior crosscheck job for IAL2 compliance
  callbackURL: string;
  send: true;
}

interface VouchedInviteResponse {
  invite?: Record<string, unknown>;
  [key: string]: unknown;
}

export async function POST(request: NextRequest) {
  try {
    const body: SendInviteRequestBody = await request.json();

    if (!body.firstName || !body.lastName || !body.phone) {
      return NextResponse.json(
        { error: 'firstName, lastName, and phone are required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.VOUCHED_PRIVATE_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'VOUCHED_PRIVATE_API_KEY is not configured' },
        { status: 503 }
      );
    }

    // Build the Vouched Send Invite payload — fields are top-level, NOT nested under 'parameters'
    const payload: VouchedInvitePayload = {
      type: 'idv',
      contact: 'phone',
      firstName: body.firstName,
      lastName: body.lastName,
      phone: body.phone,
      callbackURL: `${request.nextUrl.origin}/api/vouched-webhook`,
      send: true,
    };

    if (body.email) {
      payload.email = body.email;
    }

    if (body.crosscheckReferenceId) {
      payload.crosscheckReferenceId = body.crosscheckReferenceId;
    }

    // Log the full payload structure for debugging (mask phone, keep structure visible)
    const loggablePayload = {
      ...payload,
      phone: `***${payload.phone.slice(-4)}`,
    };
    console.log('IAL2 Send Invite: Full request payload structure:', JSON.stringify(loggablePayload, null, 2));
    console.log('IAL2 Send Invite: Payload keys:', Object.keys(payload));
    console.log('IAL2 Send Invite: API key present:', !!apiKey, '| Key length:', apiKey.length);
    console.log('IAL2 Send Invite: Raw JSON body being sent:', JSON.stringify(payload));

    const response = await fetch('https://verify.vouched.id/api/invites', {
      method: 'POST',
      headers: {
        'X-API-Key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    console.log('IAL2 Send Invite: Response status:', response.status, response.statusText);
    console.log('IAL2 Send Invite: Response headers:', Object.fromEntries(response.headers.entries()));

    const responseText = await response.text();
    console.log('IAL2 Send Invite: Raw response body:', responseText);

    let responseData: VouchedInviteResponse;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      console.error('IAL2 Send Invite: Non-JSON response from Vouched:', responseText);
      return NextResponse.json(
        { error: 'Unexpected response from Vouched API', raw: responseText },
        { status: 502 }
      );
    }

    if (!response.ok) {
      console.error('IAL2 Send Invite: Vouched API error', response.status, JSON.stringify(responseData, null, 2));
      return NextResponse.json(
        { error: 'Vouched API returned an error', status: response.status, details: responseData },
        { status: response.status }
      );
    }

    console.log('IAL2 Send Invite: Invite sent successfully', JSON.stringify(responseData, null, 2));

    return NextResponse.json({
      success: true,
      invite: responseData,
      // Echo back the payload for the demo "behind the scenes" panel
      sentPayload: payload,
    });
  } catch (error) {
    console.error('IAL2 Send Invite: Unexpected error', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
