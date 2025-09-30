import { NextRequest, NextResponse } from 'next/server';
import { dobVerificationService } from '@/services/dob-verification';
import { DOBVerificationRequest, isDOBVerificationError } from '@/types/dob-api';

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body: DOBVerificationRequest = await request.json();
    
    // Validate required fields
    if (!body.firstName || !body.lastName || !body.dateOfBirth) {
      return NextResponse.json(
        {
          error: 'Validation Error',
          message: 'firstName, lastName, and dateOfBirth are required fields',
          code: 'MISSING_REQUIRED_FIELDS'
        },
        { status: 400 }
      );
    }

    // Validate date of birth format
    const dobDate = new Date(body.dateOfBirth);
    if (isNaN(dobDate.getTime())) {
      return NextResponse.json(
        {
          error: 'Validation Error',
          message: 'dateOfBirth must be a valid date',
          code: 'INVALID_DATE_FORMAT'
        },
        { status: 400 }
      );
    }

    // Validate phone number format if provided
    if (body.phone) {
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
          message: 'DOB verification API key is not configured on server',
          code: 'MISSING_API_KEY'
        },
        { status: 503 }
      );
    }

    console.log('Processing DOB verification request for:', {
      firstName: body.firstName,
      lastName: body.lastName,
      dateOfBirth: body.dateOfBirth,
      phone: body.phone ? `***${body.phone.slice(-4)}` : 'not provided',
      email: body.email || 'not provided'
    });

    // Call the DOB verification service with the API key
    const result = await dobVerificationService.verifyDOB(body, apiKey);

    // Check if the result is an error
    if (isDOBVerificationError(result)) {
      console.error('DOB verification failed:', result);
      
      // Return appropriate HTTP status based on error type
      let statusCode = 500;
      if (result.code === 'MISSING_API_KEY') statusCode = 503;
      if (result.code?.startsWith('HTTP_4')) statusCode = 400;
      if (result.code === 'NETWORK_ERROR') statusCode = 502;
      
      return NextResponse.json(result, { status: statusCode });
    }

    console.log('DOB verification completed successfully:', {
      id: result.id,
      status: result.status,
      success: result.result.success
    });

    // Return successful result
    return NextResponse.json(result);

  } catch (error) {
    console.error('Error processing DOB verification request:', error);
    
    return NextResponse.json(
      {
        error: 'Server Error',
        message: 'An unexpected error occurred while processing the DOB verification',
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
    service: 'DOB Verification API',
    status: 'active',
    configured: !!apiKey,
    timestamp: new Date().toISOString()
  });
}
