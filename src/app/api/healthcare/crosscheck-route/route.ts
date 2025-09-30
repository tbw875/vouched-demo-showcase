import { NextRequest, NextResponse } from 'next/server';
import { crossCheckVerificationService } from '@/services/crosscheck-verification';
import { CrossCheckVerificationRequest, isCrossCheckVerificationError } from '@/types/crosscheck-api';

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body: CrossCheckVerificationRequest = await request.json();
    
    // Validate required fields
    if (!body.firstName || !body.lastName || !body.phone) {
      return NextResponse.json(
        {
          error: 'Validation Error',
          message: 'firstName, lastName, and phone are required fields',
          code: 'MISSING_REQUIRED_FIELDS'
        },
        { status: 400 }
      );
    }

    // Validate phone number format (basic validation - will be formatted by service)
    const phoneDigits = body.phone.replace(/\D/g, '');
    if (phoneDigits.length < 10) {
      return NextResponse.json(
        {
          error: 'Validation Error',
          message: 'Phone number must contain at least 10 digits',
          code: 'INVALID_PHONE_FORMAT'
        },
        { status: 400 }
      );
    }

    // Validate email format if provided
    if (body.email) {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(body.email)) {
        return NextResponse.json(
          {
            error: 'Validation Error',
            message: 'Invalid email format',
            code: 'INVALID_EMAIL_FORMAT'
          },
          { status: 400 }
        );
      }
    }

    // Get API key from environment variables (server-side only)
    const apiKey = process.env.VOUCHED_PRIVATE_API_KEY;
    if (!apiKey) {
      console.error('VOUCHED_PRIVATE_API_KEY is not set in environment variables');
      return NextResponse.json(
        {
          error: 'Configuration Error',
          message: 'CrossCheck API key is not configured on server',
          code: 'MISSING_API_KEY'
        },
        { status: 503 }
      );
    }

    console.log('Processing CrossCheck verification request for:', {
      firstName: body.firstName,
      lastName: body.lastName,
      phone: body.phone ? `***${body.phone.slice(-4)}` : 'not provided',
      email: body.email || 'not provided',
      ipAddress: body.ipAddress || 'not provided',
      address: body.address ? 'provided' : 'not provided'
    });

    // Call the CrossCheck verification service with the API key
    const result = await crossCheckVerificationService.verifyCrossCheck(body, apiKey);

    // Check if the result is an error
    if (isCrossCheckVerificationError(result)) {
      console.error('CrossCheck verification failed:', result);
      
      // Return appropriate HTTP status based on error type
      let statusCode = 500;
      if (result.code === 'MISSING_API_KEY') statusCode = 503;
      if (result.code?.startsWith('HTTP_4')) statusCode = 400;
      if (result.code === 'NETWORK_ERROR') statusCode = 502;
      
      return NextResponse.json(result, { status: statusCode });
    }

    console.log('CrossCheck verification completed successfully:', {
      id: result.id,
      status: result.status,
      success: result.result.success
    });

    // Return successful result
    return NextResponse.json(result);

  } catch (error) {
    console.error('Error processing CrossCheck verification request:', error);
    
    return NextResponse.json(
      {
        error: 'Server Error',
        message: 'An unexpected error occurred while processing the CrossCheck verification',
        code: 'INTERNAL_SERVER_ERROR',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  // Return service configuration status for debugging
  const apiKey = process.env.VOUCHED_PRIVATE_API_KEY;
  
  return NextResponse.json({
    service: 'CrossCheck Verification API',
    status: 'active',
    configured: !!apiKey,
    timestamp: new Date().toISOString()
  });
}
