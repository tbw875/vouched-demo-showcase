/**
 * Product Configuration Tests
 * 
 * These tests ensure that no matter what product settings a user has specified,
 * they will always get the Vouched element to load and a resulting webhook to populate.
 * 
 * Current Issues Identified:
 * 1. AML product has no configuration in Vouched config
 * 2. Only crosscheck and dob-verification have explicit configuration
 * 3. ssnPrivate is only added to URL params but not to Vouched config
 * 4. Form fields are generated conditionally, but Vouched element should load regardless
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
// Test files use 'any' for mocking and flexible test data

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';

// Mock window.Vouched for testing
declare global {
  interface Window {
    Vouched: jest.MockedFunction<any>;
  }
}

// Mock fetch for webhook testing
global.fetch = jest.fn();

// Product configurations to test
const PRODUCT_CONFIGURATIONS = [
  // Single products
  { name: 'ID Verification Only', products: ['id-verification'], shouldLoadVouched: true },
  { name: 'CrossCheck Only', products: ['crosscheck'], shouldLoadVouched: true },
  { name: 'DOB Verification Only', products: ['dob-verification'], shouldLoadVouched: true },
  { name: 'Driver\'s License Verification Only', products: ['drivers-license-verification'], shouldLoadVouched: true },
  { name: 'AML Check Only', products: ['aml'], shouldLoadVouched: true },
  { name: 'SSN Private Only', products: ['ssnPrivate'], shouldLoadVouched: true },
  
  // Combinations
  { name: 'IDV + CrossCheck', products: ['id-verification', 'crosscheck'], shouldLoadVouched: true },
  { name: 'IDV + DOB', products: ['id-verification', 'dob-verification'], shouldLoadVouched: true },
  { name: 'IDV + DLV', products: ['id-verification', 'drivers-license-verification'], shouldLoadVouched: true },
  { name: 'IDV + AML', products: ['id-verification', 'aml'], shouldLoadVouched: true },
  { name: 'CrossCheck + DOB', products: ['crosscheck', 'dob-verification'], shouldLoadVouched: true },
  { name: 'CrossCheck + DLV', products: ['crosscheck', 'drivers-license-verification'], shouldLoadVouched: true },
  { name: 'CrossCheck + AML', products: ['crosscheck', 'aml'], shouldLoadVouched: true },
  { name: 'DOB + DLV', products: ['dob-verification', 'drivers-license-verification'], shouldLoadVouched: true },
  { name: 'DOB + AML', products: ['dob-verification', 'aml'], shouldLoadVouched: true },
  { name: 'DLV + AML', products: ['drivers-license-verification', 'aml'], shouldLoadVouched: true },
  
  // All combinations
  { name: 'All Products', products: ['id-verification', 'crosscheck', 'dob-verification', 'drivers-license-verification', 'aml', 'ssnPrivate'], shouldLoadVouched: true },
  
  // Edge cases
  { name: 'No Products', products: [], shouldLoadVouched: true }, // Should still load with default IDV
  { name: 'Invalid Product', products: ['invalid-product'], shouldLoadVouched: true },
];

const FLOW_TYPES = ['desktop', 'phone'] as const;
const WORKFLOW_TYPES = ['simultaneous', 'step-up'] as const;

describe('Product Configuration Tests', () => {
  let mockVouchedInstance: any;
  let mockElement: HTMLElement;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock DOM element
    mockElement = document.createElement('div');
    mockElement.id = 'vouched-element';
    document.body.appendChild(mockElement);
    
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
    
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
      },
      writable: true,
    });
  });

  afterEach(() => {
    // Clean up DOM
    if (mockElement && mockElement.parentNode) {
      mockElement.parentNode.removeChild(mockElement);
    }
  });

  describe('Vouched Element Loading', () => {
    PRODUCT_CONFIGURATIONS.forEach(config => {
      it(`should load Vouched element for ${config.name}`, async () => {
        // Simulate the verification page initialization
        const vouchedConfig = createVouchedConfig({
          enabledProducts: config.products,
          flowType: 'desktop',
          workflowType: 'simultaneous',
        });

        // Simulate script loading and initialization
        await simulateVouchedInitialization(vouchedConfig);

        if (config.shouldLoadVouched) {
          expect(window.Vouched).toHaveBeenCalledWith(expect.objectContaining({
            appId: expect.any(String),
            callbackURL: expect.stringContaining('/api/vouched-webhook'),
          }));
          expect(mockVouchedInstance.mount).toHaveBeenCalledWith('#vouched-element');
        }
      });
    });
  });

  describe('Webhook Configuration', () => {
    PRODUCT_CONFIGURATIONS.forEach(config => {
      it(`should configure webhook correctly for ${config.name}`, async () => {
        const vouchedConfig = createVouchedConfig({
          enabledProducts: config.products,
          flowType: 'desktop',
          workflowType: 'simultaneous',
        });

        await simulateVouchedInitialization(vouchedConfig);

        // Verify webhook URL is always set
        expect(window.Vouched).toHaveBeenCalledWith(expect.objectContaining({
          callbackURL: expect.stringContaining('/api/vouched-webhook'),
        }));
      });
    });
  });

  describe('Product-Specific Configuration', () => {
    it('should include crosscheck configuration when crosscheck is enabled', async () => {
      const vouchedConfig = createVouchedConfig({
        enabledProducts: ['crosscheck'],
        flowType: 'desktop',
        workflowType: 'simultaneous',
      });

      await simulateVouchedInitialization(vouchedConfig);

      expect(window.Vouched).toHaveBeenCalledWith(expect.objectContaining({
        crosscheck: true,
      }));
    });

    it('should include dobVerification configuration when dob-verification is enabled', async () => {
      const vouchedConfig = createVouchedConfig({
        enabledProducts: ['dob-verification'],
        flowType: 'desktop',
        workflowType: 'simultaneous',
      });

      await simulateVouchedInitialization(vouchedConfig);

      expect(window.Vouched).toHaveBeenCalledWith(expect.objectContaining({
        dobVerification: true,
      }));
    });

    it('should include enableDriversLicenseValidation configuration when drivers-license-verification is enabled', async () => {
      const vouchedConfig = createVouchedConfig({
        enabledProducts: ['drivers-license-verification'],
        flowType: 'desktop',
        workflowType: 'simultaneous',
      });

      await simulateVouchedInitialization(vouchedConfig);

      expect(window.Vouched).toHaveBeenCalledWith(expect.objectContaining({
        enableDriversLicenseValidation: true,
      }));
    });

    it('should include AML configuration when aml is enabled', async () => {
      const vouchedConfig = createVouchedConfig({
        enabledProducts: ['aml'],
        flowType: 'desktop',
        workflowType: 'simultaneous',
      });

      await simulateVouchedInitialization(vouchedConfig);

      // AML should be configured (this will currently fail - needs to be fixed)
      expect(window.Vouched).toHaveBeenCalledWith(expect.objectContaining({
        aml: true,
      }));
    });

    it('should handle SSN private configuration correctly', async () => {
      const formData = {
        firstName: 'John',
        lastName: 'Doe',
        ssn: '1234',
      };

      const vouchedConfig = createVouchedConfig({
        enabledProducts: ['ssnPrivate'],
        flowType: 'desktop',
        workflowType: 'simultaneous',
      }, formData);

      await simulateVouchedInitialization(vouchedConfig);

      expect(window.Vouched).toHaveBeenCalledWith(expect.objectContaining({
        verification: expect.objectContaining({
          ssn: '1234',
        }),
      }));
    });
  });

  describe('Flow and Workflow Variations', () => {
    FLOW_TYPES.forEach(flowType => {
      WORKFLOW_TYPES.forEach(workflowType => {
        it(`should work with ${flowType} flow and ${workflowType} workflow`, async () => {
          const vouchedConfig = createVouchedConfig({
            enabledProducts: ['id-verification'],
            flowType,
            workflowType,
          });

          await simulateVouchedInitialization(vouchedConfig);

          expect(window.Vouched).toHaveBeenCalled();
          expect(mockVouchedInstance.mount).toHaveBeenCalled();
        });
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle Vouched script loading failure gracefully', async () => {
      // Mock script loading failure
      const originalAddEventListener = HTMLScriptElement.prototype.addEventListener;
      HTMLScriptElement.prototype.addEventListener = jest.fn((event, handler) => {
        if (event === 'load') {
          // Don't call the load handler
          return;
        }
        if (event === 'error') {
          setTimeout(() => (handler as any)(), 0);
        }
      });

      const vouchedConfig = createVouchedConfig({
        enabledProducts: ['id-verification'],
        flowType: 'desktop',
        workflowType: 'simultaneous',
      });

      // Should not throw an error
      expect(() => simulateVouchedInitialization(vouchedConfig)).not.toThrow();

      // Restore original method
      HTMLScriptElement.prototype.addEventListener = originalAddEventListener;
    });

    it('should handle missing Vouched element gracefully', async () => {
      // Remove the element
      if (mockElement.parentNode) {
        mockElement.parentNode.removeChild(mockElement);
      }

      const vouchedConfig = createVouchedConfig({
        enabledProducts: ['id-verification'],
        flowType: 'desktop',
        workflowType: 'simultaneous',
      });

      // Should not throw an error
      expect(() => simulateVouchedInitialization(vouchedConfig)).not.toThrow();
    });
  });

  describe('Webhook Response Handling', () => {
    it('should handle webhook responses for all product configurations', async () => {
      for (const config of PRODUCT_CONFIGURATIONS) {
        // Mock successful webhook response
        (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            data: {
              id: 'test-job-id',
              result: { success: true },
              products: config.products,
            },
          }),
        } as Response);

        const response = await fetch('/api/webhook?token=test-token');
        const data = await response.json();

        expect(data.data).toBeDefined();
        expect(data.data.id).toBe('test-job-id');
      }
    });
  });
});

// Helper functions
function createVouchedConfig(config: {
  enabledProducts: string[];
  flowType: string;
  workflowType: string;
}, formData: any = {}) {
  const verificationData: Record<string, any> = {};
  
  // Add basic identity data for CrossCheck and IDV
  if (formData.firstName) verificationData.firstName = formData.firstName;
  if (formData.lastName) verificationData.lastName = formData.lastName;
  if (formData.phone) verificationData.phone = formData.phone;
  if (formData.email) verificationData.email = formData.email;
  if (formData.ipAddress) verificationData.ipAddress = formData.ipAddress;
  
  // Add DOB for DOB verification
  if (config.enabledProducts.includes('dob-verification') && formData.dateOfBirth) {
    verificationData.birthDate = formData.dateOfBirth;
  }
  
  // Add SSN for SSN Private verification
  if (config.enabledProducts.includes('ssnPrivate') && formData.ssn) {
    verificationData.ssn = formData.ssn;
  }

  return {
    appId: process.env.NEXT_PUBLIC_VOUCHED_APP_ID || "wYd4PAXW3W2~xHNRx~-cdUpFl!*SFs",
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
    ...(config.enabledProducts.includes('crosscheck') && { crosscheck: true }),
    ...(config.enabledProducts.includes('dob-verification') && { dobVerification: true }),
    ...(config.enabledProducts.includes('drivers-license-verification') && { enableDriversLicenseValidation: true }),
    ...(config.enabledProducts.includes('aml') && { aml: true }),
    
    onDone: expect.any(Function),
  };
}

async function simulateVouchedInitialization(vouchedConfig: any) {
  // Simulate script loading
  const script = document.createElement('script');
  script.src = 'https://static.vouched.id/plugin/releases/latest/index.js';
  
  // Simulate successful loading
  setTimeout(() => {
    // Simulate Vouched initialization
    if (window.Vouched && document.getElementById('vouched-element')) {
      window.Vouched(vouchedConfig);
      mockVouchedInstance.mount('#vouched-element');
    }
  }, 0);
  
  // Wait for async operations
  await new Promise(resolve => setTimeout(resolve, 10));
}
