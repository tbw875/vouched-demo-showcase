import { NextRequest, NextResponse } from 'next/server';

interface SendInviteRequestBody {
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  birthDate?: string; // MM/DD/YYYY
}

interface VouchedInvitePayload {
  parameters: {
    firstName: string;
    lastName: string;
    phone: string;
    email?: string;
    birthDate?: string;
    callbackURL: string;
  };
}

interface VouchedInviteResponse {
  id?: string;
  status?: string;
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

    // Build the Vouched Send Invite payload
    const payload: VouchedInvitePayload = {
      parameters: {
        firstName: body.firstName,
        lastName: body.lastName,
        phone: body.phone,
        callbackURL: `${request.nextUrl.origin}/api/vouched-webhook`,
      },
    };

    if (body.email) {
      payload.parameters.email = body.email;
    }

    if (body.birthDate) {
      payload.parameters.birthDate = body.birthDate;
    }

    console.log('IAL2 Send Invite: Sending invite to Vouched API', {
      firstName: body.firstName,
      lastName: body.lastName,
      phone: `***${body.phone.slice(-4)}`,
    });

    const response = await fetch('https://verify.vouched.id/api/invites', {
      method: 'POST',
      headers: {
        'X-API-Key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const responseText = await response.text();

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
      console.error('IAL2 Send Invite: Vouched API error', response.status, responseData);
      return NextResponse.json(
        { error: 'Vouched API returned an error', status: response.status, details: responseData },
        { status: response.status }
      );
    }

    console.log('IAL2 Send Invite: Invite sent successfully', { id: responseData.id });

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
