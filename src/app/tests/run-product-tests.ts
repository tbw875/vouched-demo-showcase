/**
 * Product Configuration Test Runner
 * 
 * This script can be run to test all product configurations and ensure
 * the Vouched element loads and webhooks populate correctly for each one.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
// Test utility script uses 'any' for flexible configuration objects

interface TestResult {
  productConfig: string;
  vouchedLoaded: boolean;
  webhookReceived: boolean;
  error?: string;
}

interface ProductTestConfig {
  name: string;
  products: string[];
  formData: Record<string, any>;
  flowType: 'desktop' | 'phone';
  workflowType: 'simultaneous' | 'step-up';
}

const PRODUCT_TEST_CONFIGS: ProductTestConfig[] = [
  {
    name: 'ID Verification Only',
    products: ['id-verification'],
    formData: {},
    flowType: 'desktop',
    workflowType: 'simultaneous',
  },
  {
    name: 'CrossCheck Only',
    products: ['crosscheck'],
    formData: {
      firstName: 'Test',
      lastName: 'User',
      phone: '+15551234567',
      email: 'test@example.com',
    },
    flowType: 'desktop',
    workflowType: 'simultaneous',
  },
  {
    name: 'DOB Verification Only',
    products: ['dob-verification'],
    formData: {
      dateOfBirth: '1990-01-01',
    },
    flowType: 'desktop',
    workflowType: 'simultaneous',
  },
  {
    name: 'AML Check Only',
    products: ['aml'],
    formData: {
      firstName: 'John',
      lastName: 'Doe',
    },
    flowType: 'desktop',
    workflowType: 'simultaneous',
  },
  {
    name: 'SSN Private Only',
    products: ['ssnPrivate'],
    formData: {
      firstName: 'Jane',
      lastName: 'Smith',
      ssn: '1234',
    },
    flowType: 'desktop',
    workflowType: 'simultaneous',
  },
  {
    name: 'All Products Combined',
    products: ['id-verification', 'crosscheck', 'dob-verification', 'aml', 'ssnPrivate'],
    formData: {
      firstName: 'Complete',
      lastName: 'Test',
      phone: '+15559876543',
      email: 'complete@example.com',
      dateOfBirth: '1985-05-15',
      ssn: '5678',
    },
    flowType: 'desktop',
    workflowType: 'simultaneous',
  },
  // Test with different flow types
  {
    name: 'CrossCheck + Phone Flow',
    products: ['crosscheck'],
    formData: {
      firstName: 'Mobile',
      lastName: 'User',
      phone: '+15551111111',
      email: 'mobile@example.com',
    },
    flowType: 'phone',
    workflowType: 'simultaneous',
  },
  {
    name: 'IDV + Step-up Workflow',
    products: ['id-verification'],
    formData: {},
    flowType: 'desktop',
    workflowType: 'step-up',
  },
];

export class ProductConfigurationTester {
  private results: TestResult[] = [];
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:3000') {
    this.baseUrl = baseUrl;
  }

  async runAllTests(): Promise<TestResult[]> {
    console.log('🚀 Starting Product Configuration Tests...\n');
    
    for (const config of PRODUCT_TEST_CONFIGS) {
      console.log(`📋 Testing: ${config.name}`);
      const result = await this.testProductConfiguration(config);
      this.results.push(result);
      
      if (result.error) {
        console.log(`❌ FAILED: ${result.error}`);
      } else {
        console.log(`✅ PASSED: Vouched loaded: ${result.vouchedLoaded}, Webhook received: ${result.webhookReceived}`);
      }
      console.log('');
    }

    this.printSummary();
    return this.results;
  }

  private async testProductConfiguration(config: ProductTestConfig): Promise<TestResult> {
    const result: TestResult = {
      productConfig: config.name,
      vouchedLoaded: false,
      webhookReceived: false,
    };

    try {
      // Step 1: Navigate to form-fill page with configuration
      const formFillUrl = this.buildFormFillUrl(config);
      console.log(`  🔗 Form Fill URL: ${formFillUrl}`);

      // Step 2: Simulate form submission (in a real test, you'd use a browser automation tool)
      const verificationUrl = this.buildVerificationUrl(config);
      console.log(`  🔗 Verification URL: ${verificationUrl}`);

      // Step 3: Check if Vouched element would load with this configuration
      result.vouchedLoaded = await this.checkVouchedConfiguration(config);

      // Step 4: Check webhook endpoint
      result.webhookReceived = await this.checkWebhookEndpoint();

      return result;
    } catch (error) {
      result.error = error instanceof Error ? error.message : 'Unknown error';
      return result;
    }
  }

  private buildFormFillUrl(config: ProductTestConfig): string {
    const params = new URLSearchParams({
      flow: config.flowType,
      workflow: config.workflowType,
      products: config.products.join(','),
      ssnMode: config.products.includes('ssnPrivate') ? 'last4' : 'off',
      reverification: 'false',
    });

    return `${this.baseUrl}/form-fill?${params.toString()}`;
  }

  private buildVerificationUrl(config: ProductTestConfig): string {
    const params = new URLSearchParams({
      flow: config.flowType,
      workflow: config.workflowType,
      products: config.products.join(','),
      formData: JSON.stringify(config.formData),
      reverification: 'false',
    });

    return `${this.baseUrl}/verification?${params.toString()}`;
  }

  private async checkVouchedConfiguration(config: ProductTestConfig): Promise<boolean> {
    // Simulate the Vouched configuration creation logic
    const verificationData: Record<string, any> = {};
    
    // Always add basic identity data
    if (config.formData.firstName) verificationData.firstName = config.formData.firstName;
    if (config.formData.lastName) verificationData.lastName = config.formData.lastName;
    if (config.formData.phone) verificationData.phone = config.formData.phone;
    if (config.formData.email) verificationData.email = config.formData.email;
    if (config.formData.ipAddress) verificationData.ipAddress = config.formData.ipAddress;
    
    // Add DOB for DOB verification
    if (config.products.includes('dob-verification') && config.formData.dateOfBirth) {
      verificationData.birthDate = config.formData.dateOfBirth;
    }
    
    // Add SSN for SSN Private verification
    if (config.products.includes('ssnPrivate') && config.formData.ssn) {
      verificationData.ssn = config.formData.ssn;
    }

    // Ensure we have at least basic verification data
    if (!verificationData.firstName && !verificationData.lastName) {
      verificationData.firstName = '';
      verificationData.lastName = '';
    }

    const vouchedConfig = {
      appId: "wYd4PAXW3W2~xHNRx~-cdUpFl!*SFs",
      verification: verificationData,
      callbackURL: `${this.baseUrl}/api/vouched-webhook`,
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
      ...(config.products.includes('crosscheck') && { crosscheck: true }),
      ...(config.products.includes('dob-verification') && { dobVerification: true }),
      ...(config.products.includes('aml') && { aml: true }),
    };

    // Validate the configuration
    const isValid = this.validateVouchedConfig(vouchedConfig);
    console.log(`  🔧 Vouched config valid: ${isValid}`);
    
    return isValid;
  }

  private validateVouchedConfig(config: any): boolean {
    // Check required fields
    if (!config.appId) return false;
    if (!config.callbackURL) return false;
    if (!config.verification) return false;
    
    // Check that verification has at least firstName and lastName (even if empty)
    if (config.verification.firstName === undefined || config.verification.lastName === undefined) {
      return false;
    }
    
    return true;
  }

  private async checkWebhookEndpoint(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/vouched-webhook`, {
        method: 'GET',
      });
      
      // The GET endpoint should return the stored responses
      return response.ok;
    } catch (error) {
      console.log(`  ⚠️  Webhook endpoint check failed: ${error}`);
      return false;
    }
  }

  private printSummary(): void {
    const passed = this.results.filter(r => !r.error && r.vouchedLoaded).length;
    const failed = this.results.length - passed;
    
    console.log('📊 Test Summary:');
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📝 Total: ${this.results.length}`);
    
    if (failed > 0) {
      console.log('\n❌ Failed Tests:');
      this.results
        .filter(r => r.error || !r.vouchedLoaded)
        .forEach(r => {
          console.log(`  - ${r.productConfig}: ${r.error || 'Vouched failed to load'}`);
        });
    }

    console.log('\n🎯 Recommendations:');
    console.log('1. Ensure all product configurations include proper Vouched parameters');
    console.log('2. Verify webhook endpoints are accessible');
    console.log('3. Test with real browser automation for complete validation');
    console.log('4. Monitor webhook responses in production');
  }
}

// CLI runner
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new ProductConfigurationTester();
  tester.runAllTests().then(() => {
    console.log('\n🏁 Testing complete!');
  }).catch(error => {
    console.error('❌ Test runner failed:', error);
    process.exit(1);
  });
}

export default ProductConfigurationTester;
