// Vouched SDK Type Definitions
// These types represent the Vouched JavaScript SDK interfaces

/**
 * Vouched Job Result
 */
export interface VouchedJobResult {
  success: boolean;
  confidences?: {
    id?: number;
    selfie?: number;
    faceMatch?: number;
  };
  errors?: string[];
  [key: string]: unknown;
}

/**
 * Vouched Job Data
 * Represents the job object returned by Vouched SDK
 */
export interface VouchedJob {
  id: string;
  token?: string;
  status?: string;
  result?: VouchedJobResult;
  request?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

/**
 * Vouched Verification Configuration
 */
export interface VouchedVerificationConfig {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  birthDate?: string;
  ipAddress?: string;
  enableCrossCheck?: boolean;
  enableDriversLicenseValidation?: boolean;
  [key: string]: unknown;
}

/**
 * Vouched Theme Configuration
 */
export interface VouchedTheme {
  name: string;
  [key: string]: unknown;
}

/**
 * Vouched Reverification Parameters
 */
export interface VouchedReverificationParams {
  jobId: string;
  match?: string;
}

/**
 * Vouched SDK Configuration
 */
export interface VouchedConfig {
  appId: string;
  verification?: VouchedVerificationConfig;
  callbackURL?: string;
  crossDevice?: boolean;
  crossDeviceQRCode?: boolean;
  crossDeviceSMS?: boolean;
  allowLocalhost?: boolean;
  liveness?: string;
  id?: string;
  selfie?: string;
  includeBarcode?: boolean;
  manualCaptureTimeout?: number;
  showTermsAndPrivacy?: boolean;
  theme?: VouchedTheme;
  dobVerification?: boolean;
  enableAML?: boolean;
  debug?: boolean;
  type?: string;
  reverificationParameters?: VouchedReverificationParams;
  onDone?: (job: VouchedJob) => void;
  onReverify?: (job: VouchedJob) => void;
  onInit?: (job: VouchedJob) => void;
  onSubmit?: (data: unknown) => void;
  onCamera?: (data: unknown) => void;
  onError?: (error: unknown) => void;
  [key: string]: unknown;
}

/**
 * Vouched SDK Instance
 */
export interface VouchedInstance {
  mount: (selector: string) => void;
  unmount?: () => void;
  destroy?: () => void;
  [key: string]: unknown;
}

/**
 * Vouched SDK Constructor
 */
export type VouchedConstructor = (config: VouchedConfig) => VouchedInstance;

/**
 * Message Event from Vouched
 */
export interface VouchedMessageEvent {
  type: string;
  data: unknown;
}

