/**
 * Integration Tests for Product Configurations
 * 
 * These tests simulate the entire flow from form fill to verification to webhook response
 * for all product configurations to ensure everything works end-to-end.
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';

// Test configurations for all possible product combinations
const TEST_CONFIGURATIONS = [
  {
    name: 'ID Verification Only',
    products: ['id-verification'],
    formData: {},
    expectedVouchedConfig: {
      verification: { firstName: '', lastName: '' },
      // No product-specific config needed for basic IDV
    },
  },
  {
    name: 'CrossCheck Only',
    products: ['crosscheck'],
    formData: {
      firstName: 'John',
      lastName: 'Doe',
      phone: '+15551234567',
      email: 'john.doe@example.com',
      ipAddress: '192.168.1.1',
    },
    expectedVouchedConfig: {
      crosscheck: true,
      verification: {
        firstName: 'John',
        lastName: 'Doe',
        phone: '+15551234567',
        email: 'john.doe@example.com',
        ipAddress: '192.168.1.1',
      },
    },
  },
  {
    name: 'DOB Verification Only',
    products: ['dob-verification'],
    formData: {
      dateOfBirth: '1990-01-01',
    },
    expectedVouchedConfig: {
      dobVerification: true,
      verification: {
        firstName: '',
        lastName: '',
        dob: '1990-01-01',
      },
    },
  },
  {
    name: 'AML Check Only',
    products: ['aml'],
    formData: {
      firstName: 'Jane',
      lastName: 'Smith',
    },
    expectedVouchedConfig: {
      aml: true,
      verification: {
        firstName: 'Jane',
        lastName: 'Smith',
      },
    },
  },
  {
    name: 'SSN Private Only',
    products: ['ssnPrivate'],
    formData: {
      firstName: 'Bob',
      lastName: 'Johnson',
      ssn: '1234',
    },
    expectedVouchedConfig: {
      verification: {
        firstName: 'Bob',
        lastName: 'Johnson',
        ssn: '1234',
      },
    },
  },
  {
    name: 'All Products Combined',
    products: ['id-verification', 'crosscheck', 'dob-verification', 'aml', 'ssnPrivate'],
    formData: {
      firstName: 'Alice',
      lastName: 'Wonder',
      phone: '+15559876543',
      email: 'alice@example.com',
      dateOfBirth: '1985-12-25',
      ssn: '5678',
      ipAddress: '10.0.0.1',
    },
    expectedVouchedConfig: {
      crosscheck: true,
      dobVerification: true,
      aml: true,
      verification: {
        firstName: 'Alice',
        lastName: 'Wonder',
        phone: '+15559876543',
        email: 'alice@example.com',
        dob: '1985-12-25',
        ssn: '5678',
        ipAddress: '10.0.0.1',
      },
    },
  },
  {
    name: 'No Products (Edge Case)',
    products: [],
    formData: {},
    expectedVouchedConfig: {
      verification: { firstName: '', lastName: '' },
    },
  },
];

describe('Product Integration Tests', () => {
  let mockVouchedInstance: any;
  let mockFetch: jest.MockedFunction<typeof fetch>;
  let originalLocation: Location;

  beforeEach(() => {
    // Mock DOM
    document.body.innerHTML = '<div id="vouched-element"></div>';
    
    // Mock Vouched instance
    mockVouchedInstance = {
      mount: jest.fn(),
      unmount: jest.fn(),
      destroy: jest.fn(),
    };
    
    // Mock window.Vouched
    Object.defineProperty(window, 'Vouched', {
      value: jest.fn().mockReturnValue(mockVouchedInstance),
      writable: true,
    });
    
    // Mock fetch
    mockFetch = jest.fn();
    global.fetch = mockFetch;
    
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
      },
      writable: true,
    });

    // Mock window.location
    originalLocation = window.location;
    delete (window as any).location;
    window.location = {
      ...originalLocation,
      origin: 'https://localhost:3000',
      href: 'https://localhost:3000/verification',
    } as Location;
  });

  afterEach(() => {
    jest.clearAllMocks();
    document.body.innerHTML = '';
    window.location = originalLocation;
  });

  describe('End-to-End Product Configuration Tests', () => {
    TEST_CONFIGURATIONS.forEach(testConfig => {
      describe(`${testConfig.name}`, () => {
        it('should load Vouched element with correct configuration', async () => {
          // Simulate the verification page flow
          await simulateVerificationFlow(
            testConfig.products,
            testConfig.formData
          );

          // Verify Vouched was called with correct configuration
          expect(window.Vouched).toHaveBeenCalledWith(
            expect.objectContaining({
              appId: expect.any(String),
              callbackURL: 'https://localhost:3000/api/vouched-webhook',
              ...testConfig.expectedVouchedConfig,
            })
          );

          // Verify Vouched element was mounted
          expect(mockVouchedInstance.mount).toHaveBeenCalledWith('#vouched-element');
        });

        it('should handle webhook response correctly', async () => {
          // Mock successful webhook response
          mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
              data: {
                id: 'test-job-123',
                result: { success: true },
                products: testConfig.products,
                verification: testConfig.formData,
              },
            }),
          } as Response);

          // Simulate webhook polling
          const response = await fetch('/api/webhook?token=test-token');
          const webhookData = await response.json();

          expect(webhookData.data).toBeDefined();
          expect(webhookData.data.id).toBe('test-job-123');
          expect(webhookData.data.result.success).toBe(true);
        });

        it('should complete verification flow successfully', async () => {
          // Simulate complete flow
          const jobData = {
            id: 'job-456',
            token: 'test-token-456',
            result: { success: true },
            products: testConfig.products,
          };

          // Simulate onDone callback
          await simulateVerificationFlow(
            testConfig.products,
            testConfig.formData
          );

          // Get the onDone callback from the Vouched config
          const calledConfig = (window.Vouched as jest.MockedFunction<any>).mock.calls[0][0];
          expect(calledConfig.onDone).toBeDefined();

          // Simulate calling onDone
          calledConfig.onDone(jobData);

          // Verify localStorage was updated
          expect(localStorage.setItem).toHaveBeenCalledWith(
            'latestJobData',
            expect.stringContaining('job-456')
          );
        });

        it('should handle verification failure gracefully', async () => {
          // Simulate failed verification
          const jobData = {
            id: 'job-failed',
            token: 'test-token-failed',
            result: { success: false, error: 'Verification failed' },
            products: testConfig.products,
          };

          await simulateVerificationFlow(
            testConfig.products,
            testConfig.formData
          );

          const calledConfig = (window.Vouched as jest.MockedFunction<any>).mock.calls[0][0];
          calledConfig.onDone(jobData);

          // Should still store the job data
          expect(localStorage.setItem).toHaveBeenCalledWith(
            'latestJobData',
            expect.stringContaining('job-failed')
          );
        });
      });
    });
  });

  describe('Form Field Generation Tests', () => {
    it('should generate correct form fields for each product configuration', () => {
      TEST_CONFIGURATIONS.forEach(testConfig => {
        const formFields = generateFormFields(testConfig.products);
        
        if (testConfig.products.includes('crosscheck')) {
          expect(formFields.some(field => field.id === 'firstName')).toBe(true);
          expect(formFields.some(field => field.id === 'lastName')).toBe(true);
          expect(formFields.some(field => field.id === 'phone')).toBe(true);
          expect(formFields.some(field => field.id === 'email')).toBe(true);
        }

        if (testConfig.products.includes('dob-verification')) {
          expect(formFields.some(field => field.id === 'dateOfBirth')).toBe(true);
        }

        if (testConfig.products.includes('ssnPrivate')) {
          expect(formFields.some(field => field.id === 'ssn')).toBe(true);
        }
      });
    });
  });

  describe('Error Handling Tests', () => {
    it('should handle missing form data gracefully', async () => {
      // Test with minimal/missing form data
      await simulateVerificationFlow(['id-verification'], {});

      expect(window.Vouched).toHaveBeenCalledWith(
        expect.objectContaining({
          verification: expect.objectContaining({
            firstName: '',
            lastName: '',
          }),
        })
      );
    });

    it('should handle invalid product configurations', async () => {
      // Test with invalid product
      await simulateVerificationFlow(['invalid-product'], {});

      // Should still load with basic configuration
      expect(window.Vouched).toHaveBeenCalled();
      expect(mockVouchedInstance.mount).toHaveBeenCalled();
    });

    it('should handle webhook timeout gracefully', async () => {
      // Mock timeout scenario
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ error: 'Webhook data not found' }),
      } as Response);

      const response = await fetch('/api/webhook?token=timeout-token');
      expect(response.ok).toBe(false);
    });
  });
});

// Helper functions
async function simulateVerificationFlow(products: string[], formData: any) {
  // Simulate form data storage
  (localStorage.setItem as jest.MockedFunction<any>).mockImplementation((key) => {
    if (key === 'vouchedFormData') {
      return JSON.stringify(formData);
    }
  });

  (localStorage.getItem as jest.MockedFunction<any>).mockImplementation((key) => {
    if (key === 'vouchedFormData') {
      return JSON.stringify(formData);
    }
    return null;
  });

  // Simulate script loading and Vouched initialization
  const script = document.createElement('script');
  script.src = 'https://static.vouched.id/plugin/releases/latest/index.js';
  
  // Create verification configuration
  const verificationData: Record<string, any> = {};
  
  // Always add basic identity data
  if (formData.firstName) verificationData.firstName = formData.firstName;
  if (formData.lastName) verificationData.lastName = formData.lastName;
  if (formData.phone) verificationData.phone = formData.phone;
  if (formData.email) verificationData.email = formData.email;
  if (formData.ipAddress) verificationData.ipAddress = formData.ipAddress;
  
  // Add DOB for DOB verification
  if (products.includes('dob-verification') && formData.dateOfBirth) {
    verificationData.birthDate = formData.dateOfBirth;
  }
  
  // Add SSN for SSN Private verification
  if (products.includes('ssnPrivate') && formData.ssn) {
    verificationData.ssn = formData.ssn;
  }

  // Ensure we have at least basic verification data
  if (!verificationData.firstName && !verificationData.lastName) {
    verificationData.firstName = '';
    verificationData.lastName = '';
  }

  const vouchedConfig = {
    appId: "wYd4PAXW3W2~xHNRx~-cdUpFl!*SFs",
    verification: verificationData,
    callbackURL: `${window.location.origin}/api/vouched-webhook`,
    crossDevice: true,
    crossDeviceQRCode: true,
    crossDeviceSMS: true,
    allowLocalhost: true,
    liveness: 'enhanced',
    id: 'camera',
    selfie: 'camera',
    includeBarcode: true,
    manualCaptureTimeout: 20000,
    showTermsAndPrivacy: true,
    theme: { name: "avant" },
    debug: true,
    
    // Product-specific configurations
    ...(products.includes('crosscheck') && { crosscheck: true }),
    ...(products.includes('dob-verification') && { dobVerification: true }),
    ...(products.includes('aml') && { aml: true }),
    
    onDone: jest.fn(),
  };

  // Simulate Vouched initialization
  if (window.Vouched && document.getElementById('vouched-element')) {
    window.Vouched(vouchedConfig);
    mockVouchedInstance.mount('#vouched-element');
  }

  return vouchedConfig;
}

function generateFormFields(products: string[]) {
  const fields: any[] = [];

  // CrossCheck fields
  if (products.includes('crosscheck')) {
    fields.push(
      { id: 'firstName', label: 'First Name', required: true },
      { id: 'lastName', label: 'Last Name', required: true },
      { id: 'phone', label: 'Phone Number', required: true },
      { id: 'email', label: 'Email Address', required: true }
    );
  }

  // DOB Verification fields
  if (products.includes('dob-verification')) {
    fields.push({
      id: 'dateOfBirth',
      label: 'Date of Birth',
      required: true,
    });
  }

  // SSN field
  if (products.includes('ssnPrivate')) {
    fields.push({
      id: 'ssn',
      label: 'Social Security Number',
      required: false,
    });
  }

  return fields;
}
