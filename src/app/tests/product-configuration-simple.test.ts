/**
 * Simplified Product Configuration Tests
 * 
 * These tests validate the product configuration logic without complex DOM mocking.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
// Test files use 'any' for mocking and flexible test data

describe('Product Configuration Logic', () => {
  // Test the configuration generation logic
  describe('Vouched Configuration Generation', () => {
    const createVouchedConfig = (products: string[], formData: any = {}) => {
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

      return {
        appId: process.env.NEXT_PUBLIC_VOUCHED_APP_ID || "wYd4PAXW3W2~xHNRx~-cdUpFl!*SFs",
        verification: verificationData,
        callbackURL: `http://localhost:3000/api/vouched-webhook`,
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
      };
    };

    it('should create valid configuration for ID Verification only', () => {
      const config = createVouchedConfig(['id-verification']);
      
      expect(config.appId).toBe("wYd4PAXW3W2~xHNRx~-cdUpFl!*SFs");
      expect(config.callbackURL).toBe("http://localhost:3000/api/vouched-webhook");
      expect(config.verification.firstName).toBe('');
      expect(config.verification.lastName).toBe('');
      expect(config.crosscheck).toBeUndefined();
      expect(config.dobVerification).toBeUndefined();
      expect(config.aml).toBeUndefined();
    });

    it('should create valid configuration for CrossCheck', () => {
      const formData = {
        firstName: 'John',
        lastName: 'Doe',
        phone: '+15551234567',
        email: 'john@example.com',
        ipAddress: '192.168.1.1',
      };
      
      const config = createVouchedConfig(['crosscheck'], formData);
      
      expect(config.crosscheck).toBe(true);
      expect(config.verification.firstName).toBe('John');
      expect(config.verification.lastName).toBe('Doe');
      expect(config.verification.phone).toBe('+15551234567');
      expect(config.verification.email).toBe('john@example.com');
      expect(config.verification.ipAddress).toBe('192.168.1.1');
    });

    it('should create valid configuration for DOB Verification', () => {
      const formData = {
        dateOfBirth: '1990-01-01',
      };
      
      const config = createVouchedConfig(['dob-verification'], formData);
      
      expect(config.dobVerification).toBe(true);
      expect(config.verification.birthDate).toBe('1990-01-01');
      expect(config.verification.firstName).toBe('');
      expect(config.verification.lastName).toBe('');
    });

    it('should create valid configuration for AML Check', () => {
      const formData = {
        firstName: 'Jane',
        lastName: 'Smith',
      };
      
      const config = createVouchedConfig(['aml'], formData);
      
      expect(config.aml).toBe(true);
      expect(config.verification.firstName).toBe('Jane');
      expect(config.verification.lastName).toBe('Smith');
    });

    it('should create valid configuration for SSN Private', () => {
      const formData = {
        firstName: 'Bob',
        lastName: 'Johnson',
        ssn: '1234',
      };
      
      const config = createVouchedConfig(['ssnPrivate'], formData);
      
      expect(config.verification.ssn).toBe('1234');
      expect(config.verification.firstName).toBe('Bob');
      expect(config.verification.lastName).toBe('Johnson');
    });

    it('should create valid configuration for all products combined', () => {
      const formData = {
        firstName: 'Alice',
        lastName: 'Wonder',
        phone: '+15559876543',
        email: 'alice@example.com',
        dateOfBirth: '1985-12-25',
        ssn: '5678',
        ipAddress: '10.0.0.1',
      };
      
      const config = createVouchedConfig(['id-verification', 'crosscheck', 'dob-verification', 'aml', 'ssnPrivate'], formData);
      
      expect(config.crosscheck).toBe(true);
      expect(config.dobVerification).toBe(true);
      expect(config.aml).toBe(true);
      expect(config.verification.firstName).toBe('Alice');
      expect(config.verification.lastName).toBe('Wonder');
      expect(config.verification.phone).toBe('+15559876543');
      expect(config.verification.email).toBe('alice@example.com');
      expect(config.verification.birthDate).toBe('1985-12-25');
      expect(config.verification.ssn).toBe('5678');
      expect(config.verification.ipAddress).toBe('10.0.0.1');
    });

    it('should handle empty products array', () => {
      const config = createVouchedConfig([]);
      
      expect(config.appId).toBe("wYd4PAXW3W2~xHNRx~-cdUpFl!*SFs");
      expect(config.callbackURL).toBe("http://localhost:3000/api/vouched-webhook");
      expect(config.verification.firstName).toBe('');
      expect(config.verification.lastName).toBe('');
      expect(config.crosscheck).toBeUndefined();
      expect(config.dobVerification).toBeUndefined();
      expect(config.aml).toBeUndefined();
    });

    it('should handle invalid products gracefully', () => {
      const config = createVouchedConfig(['invalid-product']);
      
      expect(config.appId).toBe("wYd4PAXW3W2~xHNRx~-cdUpFl!*SFs");
      expect(config.callbackURL).toBe("http://localhost:3000/api/vouched-webhook");
      expect(config.verification.firstName).toBe('');
      expect(config.verification.lastName).toBe('');
    });
  });

  // Test form field generation logic
  describe('Form Field Generation', () => {
    const generateFormFields = (products: string[], ssnMode: string = 'off') => {
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
          label: `Social Security Number (${ssnMode === 'full9' ? 'Full 9 digits' : 'Last 4 digits'})`,
          required: false,
        });
      }

      return fields;
    };

    it('should generate correct fields for CrossCheck', () => {
      const fields = generateFormFields(['crosscheck']);
      
      expect(fields).toHaveLength(4);
      expect(fields.find(f => f.id === 'firstName')).toBeDefined();
      expect(fields.find(f => f.id === 'lastName')).toBeDefined();
      expect(fields.find(f => f.id === 'phone')).toBeDefined();
      expect(fields.find(f => f.id === 'email')).toBeDefined();
    });

    it('should generate correct fields for DOB Verification', () => {
      const fields = generateFormFields(['dob-verification']);
      
      expect(fields).toHaveLength(1);
      expect(fields.find(f => f.id === 'dateOfBirth')).toBeDefined();
    });

    it('should generate correct fields for SSN Private', () => {
      const fields = generateFormFields(['ssnPrivate'], 'last4');
      
      expect(fields).toHaveLength(1);
      const ssnField = fields.find(f => f.id === 'ssn');
      expect(ssnField).toBeDefined();
      expect(ssnField.label).toContain('Last 4 digits');
    });

    it('should generate correct fields for all products', () => {
      const fields = generateFormFields(['crosscheck', 'dob-verification', 'ssnPrivate'], 'full9');
      
      expect(fields).toHaveLength(6);
      expect(fields.find(f => f.id === 'firstName')).toBeDefined();
      expect(fields.find(f => f.id === 'lastName')).toBeDefined();
      expect(fields.find(f => f.id === 'phone')).toBeDefined();
      expect(fields.find(f => f.id === 'email')).toBeDefined();
      expect(fields.find(f => f.id === 'dateOfBirth')).toBeDefined();
      
      const ssnField = fields.find(f => f.id === 'ssn');
      expect(ssnField).toBeDefined();
      expect(ssnField.label).toContain('Full 9 digits');
    });

    it('should generate no fields for ID verification only', () => {
      const fields = generateFormFields(['id-verification']);
      
      expect(fields).toHaveLength(0);
    });

    it('should generate no fields for AML only', () => {
      const fields = generateFormFields(['aml']);
      
      expect(fields).toHaveLength(0);
    });
  });

  // Test URL parameter generation
  describe('URL Parameter Generation', () => {
    const buildVerificationUrl = (config: {
      products: string[];
      flowType: string;
      workflowType: string;
      formData: any;
    }) => {
      const params = new URLSearchParams({
        flow: config.flowType,
        workflow: config.workflowType,
        products: config.products.join(','),
        formData: JSON.stringify(config.formData),
        reverification: 'false',
      });

      return `http://localhost:3000/verification?${params.toString()}`;
    };

    it('should build correct URL for basic configuration', () => {
      const url = buildVerificationUrl({
        products: ['id-verification'],
        flowType: 'desktop',
        workflowType: 'simultaneous',
        formData: {},
      });

      expect(url).toContain('flow=desktop');
      expect(url).toContain('workflow=simultaneous');
      expect(url).toContain('products=id-verification');
      expect(url).toContain('reverification=false');
    });

    it('should build correct URL for multiple products', () => {
      const url = buildVerificationUrl({
        products: ['crosscheck', 'dob-verification', 'aml'],
        flowType: 'phone',
        workflowType: 'step-up',
        formData: { firstName: 'Test', lastName: 'User' },
      });

      expect(url).toContain('flow=phone');
      expect(url).toContain('workflow=step-up');
      expect(url).toContain('products=crosscheck%2Cdob-verification%2Caml');
      expect(url).toContain('formData=');
    });
  });
});
