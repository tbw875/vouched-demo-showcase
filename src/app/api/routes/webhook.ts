import { NextRequest, NextResponse } from 'next/server';

// In-memory storage for webhook data (in production, use a database)
const webhookData = new Map<string, Record<string, unknown>>();

// Simple JWT decoder for payload extraction (no signature verification)
function decodeJWT(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }
    
    // Decode the payload (second part)
    const payload = parts[1];
    const decoded = Buffer.from(payload, 'base64url').toString('utf-8');
    return JSON.parse(decoded);
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Log the webhook data for debugging
    console.log('Webhook received:', JSON.stringify(body, null, 2));
    
    // Extract job token from various possible locations
    const jobToken = body.token || body.job?.token || body.jobToken;
    let jobId = jobToken;
    
    // If we have a token that looks like a JWT, decode it to get the job_id
    if (jobToken && typeof jobToken === 'string' && jobToken.includes('.')) {
      const decoded = decodeJWT(jobToken);
      if (decoded && decoded.job_id) {
        jobId = decoded.job_id as string;
        console.log('Extracted job_id from JWT:', jobId);
      }
    }
    
    if (jobId) {
      // Store webhook data using the extracted job_id as the key
      webhookData.set(jobId as string, {
        ...body,
        timestamp: new Date().toISOString(),
        originalToken: jobToken,
        extractedJobId: jobId
      });
      console.log('Stored webhook data for job_id:', jobId);
    } else {
      console.log('No job token found in webhook payload');
    }
    
    // Return success response
    return NextResponse.json({ 
      success: true, 
      message: 'Webhook received successfully',
      jobToken,
      extractedJobId: jobId
    });
    
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve webhook data by job token
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    
    if (!token) {
      return NextResponse.json(
        { error: 'Missing token parameter' },
        { status: 400 }
      );
    }
    
    let lookupKey = token;
    
    // If the token looks like a JWT, decode it to extract the job_id
    if (token.includes('.')) {
      const decoded = decodeJWT(token);
      if (decoded && decoded.job_id) {
        lookupKey = decoded.job_id as string;
        console.log('Looking up webhook data for job_id:', lookupKey);
      } else {
        console.log('Could not decode JWT or extract job_id, using original token');
      }
    }
    
    const data = webhookData.get(lookupKey);
    
    if (!data) {
      console.log('Webhook data not found for key:', lookupKey);
      console.log('Available keys:', Array.from(webhookData.keys()));
      return NextResponse.json(
        { error: 'Webhook data not found' },
        { status: 404 }
      );
    }
    
    console.log('Found webhook data for job_id:', lookupKey);
    return NextResponse.json({ data });
    
  } catch (error) {
    console.error('GET webhook error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve webhook data' },
      { status: 500 }
    );
  }
} 