// Vouched DOB Verification API Service

import { 
  DOBVerificationRequest, 
  DOBVerificationResponse, 
  DOBVerificationError,
  DOBApiResponse,
  isDOBVerificationResponse,
  isDOBVerificationError 
} from '../types/dob-api';

export class DOBVerificationService {
  private readonly baseUrl: string;

  constructor() {
    // Base URL for the API - using the official Vouched API base URL
    this.baseUrl = 'https://verify.vouched.id';
  }

  /**
   * Perform DOB verification using Vouched's DOB verification API
   * Note: This method expects to be called from server-side code where env vars are available
   */
  async verifyDOB(request: DOBVerificationRequest, apiKey: string): Promise<DOBApiResponse> {
    if (!apiKey) {
      return {
        error: 'Configuration Error',
        message: 'DOB verification API key is not provided',
        code: 'MISSING_API_KEY'
      };
    }

    try {
      // Format the request data according to Vouched API requirements
      // Match the exact format from the working cURL example
      const formattedRequest = {
        firstName: request.firstName,
        lastName: request.lastName,
        phone: this.formatPhoneNumber(request.phone),
        dob: this.formatDateOfBirth(request.dob)
      };

      console.log('=== DOB REQUEST DEBUG ===');
      console.log('Original request:', request);
      console.log('Formatted request:', formattedRequest);
      console.log('========================');

      const requestUrl = `${this.baseUrl}/api/dob/verify`;
      const requestHeaders = {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
      };
      const requestBody = JSON.stringify(formattedRequest);

      console.log('=== DOB VERIFICATION API REQUEST DETAILS ===');
      console.log('URL:', requestUrl);
      console.log('Method: POST');
      console.log('Headers:', {
        'Content-Type': requestHeaders['Content-Type'],
        'X-API-Key': apiKey ? `${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}` : 'MISSING'
      });
      console.log('Request body (raw JSON):', requestBody);
      console.log('Request data (parsed):', { 
        ...formattedRequest, 
        phone: formattedRequest.phone ? `***${formattedRequest.phone.slice(-4)}` : 'not provided'
      });
      console.log('Request body length:', requestBody.length);
      console.log('Expected cURL equivalent:');
      console.log(`curl --location '${requestUrl}' \\`);
      console.log(`--header 'Content-Type: application/json' \\`);
      console.log(`--header 'X-API-Key: ${apiKey ? `${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}` : 'MISSING'}' \\`);
      console.log(`--data '${requestBody}'`);
      console.log('=============================================');

      // Make the request to the DOB verification endpoint
      const response = await fetch(requestUrl, {
        method: 'POST',
        headers: requestHeaders,
        body: requestBody,
      });

      console.log('=== DOB VERIFICATION API RESPONSE DETAILS ===');
      console.log('Status:', response.status);
      console.log('Status Text:', response.statusText);
      console.log('Headers:', Object.fromEntries(response.headers.entries()));

      const responseText = await response.text();
      console.log('Response body (raw):', responseText);
      console.log('Response body length:', responseText.length);

      // Try to parse the response as JSON
      let responseData;
      try {
        responseData = JSON.parse(responseText);
        console.log('Response data (parsed):', responseData);
      } catch (parseError) {
        console.error('Failed to parse response as JSON:', parseError);
        return {
          error: 'Parse Error',
          message: 'Failed to parse API response as JSON',
          code: 'INVALID_RESPONSE_FORMAT',
          details: responseText.substring(0, 500) // First 500 chars for debugging
        };
      }

      console.log('===============================================');

      // Handle non-200 responses
      if (!response.ok) {
        console.error('DOB verification API request failed with status:', response.status);
        
        // Try to extract error information from the response
        const errorMessage = responseData?.message || responseData?.error || 'Unknown error';
        const errorCode = responseData?.code || `HTTP_${response.status}`;
        
        return {
          error: 'API Error',
          message: `DOB verification failed: ${errorMessage}`,
          code: errorCode,
          details: `HTTP ${response.status}: ${response.statusText}`
        };
      }

      // Validate that we have a proper DOB verification response
      if (!responseData || typeof responseData !== 'object') {
        return {
          error: 'Invalid Response',
          message: 'DOB verification API returned invalid response format',
          code: 'INVALID_RESPONSE_STRUCTURE'
        };
      }

      // Return the successful response
      return responseData as DOBVerificationResponse;

    } catch (error) {
      console.error('DOB verification request failed:', error);
      
      // Handle different types of errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        return {
          error: 'Network Error',
          message: 'Failed to connect to DOB verification API',
          code: 'NETWORK_ERROR',
          details: error.message
        };
      }
      
      return {
        error: 'Request Error',
        message: 'DOB verification request failed',
        code: 'REQUEST_FAILED',
        details: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Format phone number for API consistency
   */
  private formatPhoneNumber(phone: string): string {
    // If phone already has +, return as-is
    if (phone.startsWith('+')) {
      return phone;
    }
    
    // Remove all non-digit characters
    const digits = phone.replace(/\D/g, '');
    
    // If it's a 10-digit number, add +1 country code
    if (digits.length === 10) {
      return `+1${digits}`;
    }
    
    // If it's 11 digits starting with 1, format as +1XXXXXXXXXX
    if (digits.length === 11 && digits.startsWith('1')) {
      return `+${digits}`;
    }
    
    // Otherwise, add + prefix to whatever digits we have
    return `+${digits}`;
  }

  /**
   * Format date of birth for API consistency
   * Pass the date exactly as user entered it without timezone manipulation
   */
  private formatDateOfBirth(dateOfBirth: string): string {
    // If it's already in YYYY-MM-DD format, return as-is
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth)) {
      return dateOfBirth;
    }
    
    // If it's in other formats, try to convert without using Date constructor
    // to avoid timezone issues
    if (dateOfBirth.includes('/')) {
      // Handle MM/DD/YYYY or DD/MM/YYYY format
      const parts = dateOfBirth.split('/');
      if (parts.length === 3) {
        // Assume MM/DD/YYYY format (US standard)
        const month = parts[0].padStart(2, '0');
        const day = parts[1].padStart(2, '0');
        const year = parts[2];
        return `${year}-${month}-${day}`;
      }
    }
    
    // If all else fails, return as-is to avoid any date manipulation
    return dateOfBirth;
  }
}

// Export a singleton instance
export const dobVerificationService = new DOBVerificationService();
