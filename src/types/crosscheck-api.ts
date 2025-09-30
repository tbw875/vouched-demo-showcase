// CrossCheck API types for Vouched integration

export interface CrossCheckVerificationRequest {
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  ipAddress?: string;
  dateOfBirth?: string;
  address?: {
    streetAddress?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
}

export interface CrossCheckVerificationResponse {
  id: string;
  status: string;
  result: {
    success: boolean;
    riskScore?: number;
    riskLevel?: 'low' | 'medium' | 'high';
    confidences?: {
      identity?: number;
      phone?: number;
      email?: number;
    };
    details?: {
      phoneRisk?: {
        score: number;
        level: string;
        details: string;
      };
      emailRisk?: {
        score: number;
        level: string;
        details: string;
      };
      identityRisk?: {
        score: number;
        level: string;
        details: string;
      };
    };
  };
  createdAt: string;
  updatedAt: string;
}

export interface CrossCheckVerificationError {
  error: string;
  message: string;
  code: string;
  details?: string;
}

export type CrossCheckApiResponse = CrossCheckVerificationResponse | CrossCheckVerificationError;

// Type guards
export function isCrossCheckVerificationResponse(response: CrossCheckApiResponse): response is CrossCheckVerificationResponse {
  return 'id' in response && 'status' in response && 'result' in response;
}

export function isCrossCheckVerificationError(response: CrossCheckApiResponse): response is CrossCheckVerificationError {
  return 'error' in response && 'message' in response && 'code' in response;
}
