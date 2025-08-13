// TypeScript types for Vouched SSN Private API

export interface SSNVerificationRequest {
  firstName: string;
  lastName: string;
  ssn: string;
  dateOfBirth?: string;
  phone: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
  };
}

export interface SSNVerificationResponse {
  id: string;
  status: 'completed' | 'processing' | 'failed';
  result: {
    success: boolean;
    ssnValid?: boolean;
    nameMatch?: boolean;
    dobMatch?: boolean;
    addressMatch?: boolean;
    details?: {
      ssnTrace?: {
        found: boolean;
        issued?: string;
        state?: string;
      };
      identity?: {
        firstNameMatch: boolean;
        lastNameMatch: boolean;
        dobMatch?: boolean;
      };
      errors?: string[];
    };
  };
  timestamp: string;
  token?: string;
}

export interface SSNVerificationError {
  error: string;
  message: string;
  code?: string;
  details?: Record<string, unknown>;
}

// Combined response type
export type SSNApiResponse = SSNVerificationResponse | SSNVerificationError;

// Helper type guards
export function isSSNVerificationResponse(response: SSNApiResponse): response is SSNVerificationResponse {
  return 'id' in response && 'status' in response && 'result' in response;
}

export function isSSNVerificationError(response: SSNApiResponse): response is SSNVerificationError {
  return 'error' in response;
}
