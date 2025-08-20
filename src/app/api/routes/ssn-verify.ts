import { NextRequest, NextResponse } from 'next/server';
import { ssnVerificationService } from '../../../services/ssn-verification';
import { SSNVerificationRequest, isSSNVerificationError } from '../../../types/ssn-api';

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body: SSNVerificationRequest = await request.json();
    
    // Validate required fields
    if (!body.firstName || !body.lastName || !body.ssn || !body.phone) {
      return NextResponse.json(
        {
          error: 'Validation Error',
          message: 'firstName, lastName, ssn, and phone are required fields',
          code: 'MISSING_REQUIRED_FIELDS'
        },
        { status: 400 }
      );
    }

    // Validate SSN format (basic validation)
    const ssnPattern = /^(?:\d{3}-?\d{2}-?\d{4}|\d{4})$/;
    if (!ssnPattern.test(body.ssn)) {
      return NextResponse.json(
        {
          error: 'Validation Error',
          message: 'SSN must be in format XXX-XX-XXXX or XXXX (last 4 digits)',
          code: 'INVALID_SSN_FORMAT'
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

    // Get API key from environment variables (server-side only)
    const apiKey = process.env.VOUCHED_SSN_PRIVATE_API_KEY;
    if (!apiKey) {
      console.error('VOUCHED_SSN_PRIVATE_API_KEY is not set in environment variables');
      return NextResponse.json(
        {
          error: 'Configuration Error',
          message: 'SSN Private API key is not configured on server',
          code: 'MISSING_API_KEY'
        },
        { status: 503 }
      );
    }

    console.log('Processing SSN verification request for:', {
      firstName: body.firstName,
      lastName: body.lastName,
      phone: body.phone ? `***${body.phone.slice(-4)}` : 'not provided',
      ssn: '***masked***',
      dateOfBirth: body.dateOfBirth || 'not provided'
    });

    // Call the SSN verification service with the API key
    const result = await ssnVerificationService.verifySSN(body, apiKey);

    // Check if the result is an error
    if (isSSNVerificationError(result)) {
      console.error('SSN verification failed:', result);
      
      // Return appropriate HTTP status based on error type
      let statusCode = 500;
      if (result.code === 'MISSING_API_KEY') statusCode = 503;
      if (result.code?.startsWith('HTTP_4')) statusCode = 400;
      if (result.code === 'NETWORK_ERROR') statusCode = 502;
      
      return NextResponse.json(result, { status: statusCode });
    }

    console.log('SSN verification completed successfully:', {
      id: result.id,
      status: result.status,
      success: result.result.success
    });

    // Return successful result
    return NextResponse.json(result);

  } catch (error) {
    console.error('Error processing SSN verification request:', error);
    
    return NextResponse.json(
      {
        error: 'Server Error',
        message: 'An unexpected error occurred while processing the SSN verification',
        code: 'INTERNAL_SERVER_ERROR',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  // Return service configuration status for debugging
  const apiKey = process.env.VOUCHED_SSN_PRIVATE_API_KEY;
  const configStatus = ssnVerificationService.getConfigStatus(Boolean(apiKey));
  
  return NextResponse.json({
    service: 'SSN Verification API',
    status: 'active',
    configuration: configStatus,
    endpoints: {
      verify: 'POST /api/private-ssn/verify'
    }
  });
}
