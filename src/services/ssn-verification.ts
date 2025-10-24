// Vouched SSN Private API Service

import { 
  SSNVerificationRequest, 
  SSNVerificationResponse,
  SSNApiResponse
} from '../types/ssn-api';

export class SSNVerificationService {
  private readonly baseUrl: string;

  constructor() {
    // Base URL for the API - this can be set here since it's not sensitive
    // Using the official Vouched API base URL
    this.baseUrl = 'https://verify.vouched.id';
  }

  /**
   * Verify SSN using Vouched's private SSN API
   * Note: This method expects to be called from server-side code where env vars are available
   */
  async verifySSN(request: SSNVerificationRequest, apiKey: string): Promise<SSNApiResponse> {
    if (!apiKey) {
      return {
        error: 'Configuration Error',
        message: 'SSN Private API key is not provided',
        code: 'MISSING_API_KEY'
      };
    }

    try {
      // Format the request data according to Vouched API requirements
      const formattedRequest = {
        ssn: this.formatSSN(request.ssn),
        firstName: request.firstName,
        lastName: request.lastName,
        phone: this.formatPhoneNumber(request.phone),
        ...(request.dateOfBirth && { dob: this.formatDateOfBirth(request.dateOfBirth) })
      };

      const requestUrl = `${this.baseUrl}/api/private-ssn/verify`;
      const requestHeaders = {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
      };
      const requestBody = JSON.stringify(formattedRequest);

      console.log('=== SSN API REQUEST DETAILS ===');
      console.log('URL:', requestUrl);
      console.log('Method: POST');
      console.log('Headers:', {
        'Content-Type': requestHeaders['Content-Type'],
        'X-API-Key': apiKey ? `${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}` : 'MISSING'
      });
      console.log('Request body (raw JSON):', requestBody);
      console.log('Request data (parsed):', { 
        ...formattedRequest, 
        ssn: '***masked***',
        phone: formattedRequest.phone ? `***${formattedRequest.phone.slice(-4)}` : 'not provided'
      });
      console.log('Request body length:', requestBody.length);
      console.log('================================');

      // Make the request to the SSN verification endpoint
      const response = await fetch(requestUrl, {
        method: 'POST',
        headers: requestHeaders,
        body: requestBody,
      });

      console.log('=== SSN API RESPONSE DETAILS ===');
      console.log('Response status:', response.status, response.statusText);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      
      let responseData;
      const responseText = await response.text();
      console.log('Response body (raw):', responseText.substring(0, 1000)); // First 1000 chars
      console.log('Response body length:', responseText.length);
      
      try {
        responseData = JSON.parse(responseText);
        console.log('Response body (parsed JSON):', responseData);
      } catch (jsonError) {
        console.error('JSON parsing failed:', jsonError.message);
        console.error('Raw response text:', responseText.substring(0, 500));
        console.log('=================================');
        return {
          error: 'API Error',
          message: `Received non-JSON response. Status: ${response.status} ${response.statusText}`,
          code: `HTTP_${response.status}`,
          details: { responseText: responseText.substring(0, 500) }
        };
      }
      
      console.log('=================================');

      if (!response.ok) {
        console.error('SSN API Error Response:', responseData);
        return {
          error: 'API Error',
          message: responseData.message || `HTTP ${response.status}: ${response.statusText}`,
          code: responseData.code || `HTTP_${response.status}`,
          details: responseData
        };
      }

      console.log('SSN verification successful:', { 
        id: responseData.id, 
        status: responseData.status,
        success: responseData.result?.success 
      });

      return responseData as SSNVerificationResponse;

    } catch (error) {
      console.error('SSN verification request failed:', error);
      
      return {
        error: 'Network Error',
        message: error instanceof Error ? error.message : 'Unknown network error occurred',
        code: 'NETWORK_ERROR',
        details: { originalError: error }
      };
    }
  }

  /**
   * Format SSN according to Vouched API requirements
   * - Remove dashes and spaces
   * - Keep only digits
   * - Accept either last 4 digits or full 9 digits
   */
  private formatSSN(ssn: string): string {
    // Remove all non-digit characters
    const digits = ssn.replace(/\D/g, '');
    
    // If it's 4 digits (last 4), return as is
    if (digits.length === 4) {
      return digits;
    }
    
    // If it's 9 digits (full SSN), return without dashes
    if (digits.length === 9) {
      return digits;
    }
    
    // If it's something else, return the digits we have
    return digits;
  }

  /**
   * Format phone number to E.164 format required by Vouched API
   */
  private formatPhoneNumber(phone: string): string {
    // Remove all non-digit characters
    const digits = phone.replace(/\D/g, '');
    
    // If it's already in the right format, return as is
    if (digits.startsWith('1') && digits.length === 11) {
      return `+${digits}`;
    }
    
    // If it's a 10-digit US number, add the country code
    if (digits.length === 10) {
      return `+1${digits}`;
    }
    
    // If it already has a + sign, return as is
    if (phone.startsWith('+')) {
      return phone;
    }
    
    // Default: assume US number and add +1
    return `+1${digits}`;
  }

  /**
   * Format date of birth to ISO 8601 format required by Vouched API
   */
  private formatDateOfBirth(dateOfBirth: string): string {
    // If it's already in ISO format (YYYY-MM-DD), return as is
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth)) {
      return dateOfBirth;
    }
    
    // Try to parse and format the date
    const date = new Date(dateOfBirth);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0]; // Get YYYY-MM-DD part
    }
    
    // If parsing fails, return original
    return dateOfBirth;
  }

  /**
   * Get configuration status for debugging
   */
  getConfigStatus(hasApiKey: boolean): { configured: boolean; hasApiKey: boolean; baseUrl: string } {
    return {
      configured: hasApiKey && Boolean(this.baseUrl),
      hasApiKey,
      baseUrl: this.baseUrl
    };
  }
}

// Export a singleton instance
export const ssnVerificationService = new SSNVerificationService();
