// DOB Verification API types for Vouched integration

export interface DOBVerificationRequest {
  firstName: string;
  lastName: string;
  dob: string;  // Date of birth parameter name as required by Vouched API
  phone: string;  // Required for DOB verification
}

export interface DOBVerificationResponse {
  id: string;
  status: string;
  result: {
    success: boolean;
    dobMatch: boolean;
    confidence?: number;
    details?: {
      providedDOB: string;
      verifiedDOB?: string;
      matchStatus: 'exact' | 'partial' | 'no_match';
      source?: string;
    };
  };
  createdAt: string;
  updatedAt: string;
}

export interface DOBVerificationError {
  error: string;
  message: string;
  code: string;
  details?: string;
}

export type DOBApiResponse = DOBVerificationResponse | DOBVerificationError;

// Type guards
export function isDOBVerificationResponse(response: DOBApiResponse): response is DOBVerificationResponse {
  return 'id' in response && 'status' in response && 'result' in response;
}

export function isDOBVerificationError(response: DOBApiResponse): response is DOBVerificationError {
  return 'error' in response && 'message' in response && 'code' in response;
}
