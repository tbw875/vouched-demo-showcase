// Vouched CrossCheck API Service

import { 
  CrossCheckVerificationRequest, 
  CrossCheckVerificationResponse,
  CrossCheckApiResponse
} from '../types/crosscheck-api';

export class CrossCheckVerificationService {
  private readonly baseUrl: string;

  constructor() {
    // Base URL for the API - using the official Vouched API base URL
    this.baseUrl = 'https://verify.vouched.id';
  }

  /**
   * Perform CrossCheck verification using Vouched's CrossCheck API
   * Note: This method expects to be called from server-side code where env vars are available
   */
  async verifyCrossCheck(request: CrossCheckVerificationRequest, apiKey: string): Promise<CrossCheckApiResponse> {
    if (!apiKey) {
      return {
        error: 'Configuration Error',
        message: 'CrossCheck API key is not provided',
        code: 'MISSING_API_KEY'
      };
    }

    try {
      // Format the request data according to Vouched API requirements
      // Note: DOB is excluded from CrossCheck - it's handled separately in DOB verification
      const formattedRequest = {
        firstName: request.firstName,
        lastName: request.lastName,
        phone: this.formatPhoneNumber(request.phone),
        ...(request.email && { email: request.email }),
        ...(request.ipAddress && { ipAddress: request.ipAddress }),
        // Format address as object according to Vouched CrossCheck API specification
        ...(request.address && { 
          address: {
            streetAddress: request.address.streetAddress,
            city: request.address.city,
            state: request.address.state,
            postalCode: request.address.postalCode,
            country: request.address.country
          }
        })
      };

      const requestUrl = `${this.baseUrl}/api/identity/crosscheck`;
      const requestHeaders = {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
      };
      const requestBody = JSON.stringify(formattedRequest);

      console.log('=== CROSSCHECK API REQUEST DETAILS ===');
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
      console.log('========================================');

      // Make the request to the CrossCheck verification endpoint
      const response = await fetch(requestUrl, {
        method: 'POST',
        headers: requestHeaders,
        body: requestBody,
      });

      console.log('=== CROSSCHECK API RESPONSE DETAILS ===');
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

      console.log('=========================================');

      // Handle non-200 responses
      if (!response.ok) {
        console.error('CrossCheck API request failed with status:', response.status);
        
        // Try to extract error information from the response
        const errorMessage = responseData?.message || responseData?.error || 'Unknown error';
        const errorCode = responseData?.code || `HTTP_${response.status}`;
        
        return {
          error: 'API Error',
          message: `CrossCheck verification failed: ${errorMessage}`,
          code: errorCode,
          details: `HTTP ${response.status}: ${response.statusText}`
        };
      }

      // Validate that we have a proper CrossCheck response
      if (!responseData || typeof responseData !== 'object') {
        return {
          error: 'Invalid Response',
          message: 'CrossCheck API returned invalid response format',
          code: 'INVALID_RESPONSE_STRUCTURE'
        };
      }

      // Return the successful response
      return responseData as CrossCheckVerificationResponse;

    } catch (error) {
      console.error('CrossCheck verification request failed:', error);
      
      // Handle different types of errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        return {
          error: 'Network Error',
          message: 'Failed to connect to CrossCheck API',
          code: 'NETWORK_ERROR',
          details: error.message
        };
      }
      
      return {
        error: 'Request Error',
        message: 'CrossCheck verification request failed',
        code: 'REQUEST_FAILED',
        details: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Format phone number for API consistency
   */
  private formatPhoneNumber(phone: string): string {
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
    
    // Otherwise, return as-is with + prefix if not already present
    return digits.startsWith('+') ? digits : `+${digits}`;
  }

  /**
   * Format date of birth for API consistency
   */
  private formatDateOfBirth(dateOfBirth: string): string {
    // Try to parse and format as YYYY-MM-DD
    const date = new Date(dateOfBirth);
    if (isNaN(date.getTime())) {
      // If parsing fails, return as-is
      return dateOfBirth;
    }
    
    // Format as YYYY-MM-DD
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  }
}

// Export a singleton instance
export const crossCheckVerificationService = new CrossCheckVerificationService();
