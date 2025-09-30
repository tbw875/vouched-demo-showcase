'use client';

import React, { useEffect, useState, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import PageHeader from '@/app/components/PageHeader';
import { SSNVerificationRequest, SSNApiResponse, isSSNVerificationResponse } from '@/types/ssn-api';

// Extend Window interface for TypeScript
declare global {
  interface Window {
    Vouched: any;
  }
}

interface VouchedConfig {
  flowType: 'desktop' | 'phone';
  workflowType: 'simultaneous' | 'step-up';
  enabledProducts: string[];
}

interface FormData {
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  dateOfBirth?: string;
  ssn?: string;
  ipAddress?: string;
}

function HealthcareIDVPageContent() {
  const searchParams = useSearchParams();
  const vouchedInstanceRef = useRef<Record<string, unknown> | null>(null);
  
  // SSN verification state
  const [ssnVerificationResult, setSsnVerificationResult] = useState<SSNApiResponse | null>(null);
  const [ssnVerificationInProgress, setSsnVerificationInProgress] = useState(false);
  const [ssnVerificationError, setSsnVerificationError] = useState<string | null>(null);
  
  // Parse configuration from URL params
  const config: VouchedConfig = {
    flowType: (searchParams.get('flow') as 'desktop' | 'phone') || 'desktop',
    workflowType: (searchParams.get('workflow') as 'simultaneous' | 'step-up') || 'step-up',
    enabledProducts: searchParams.get('products')?.split(',') || ['id-verification']
  };
  
  const reverificationEnabled = searchParams.get('reverification') === 'true';
  const useCaseContext = searchParams.get('useCase') || 'healthcare';

  // Parse form data from URL params
  const formData: FormData = searchParams.get('formData') 
    ? JSON.parse(searchParams.get('formData')!) 
    : {};

  // Determine if we should show phone view based on configuration
  const isPhoneView = config.flowType === 'phone';

  // SSN verification function
  const performSSNVerification = async () => {
    if (!config.enabledProducts.includes('ssnPrivate') || !formData.ssn || !formData.firstName || !formData.lastName || !formData.phone) {
      console.log('SSN verification skipped - not enabled or missing required data (firstName, lastName, phone, ssn required)');
      return;
    }

    setSsnVerificationInProgress(true);
    setSsnVerificationError(null);

    try {
      console.log('Starting SSN verification...');
      
      const ssnRequest: SSNVerificationRequest = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        ssn: formData.ssn,
        phone: formData.phone,
        ...(formData.dateOfBirth && { dateOfBirth: formData.dateOfBirth })
      };

      const response = await fetch('/api/ssn-verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(ssnRequest),
      });

      const result: SSNApiResponse = await response.json();
      
      if (!response.ok) {
        const errorMsg = 'error' in result ? result.error : 'Unknown error';
        throw new Error(`SSN verification failed: ${errorMsg}`);
      }

      console.log('SSN verification completed:', result);
      setSsnVerificationResult(result);

      // Store SSN verification result for later display
      if (isSSNVerificationResponse(result)) {
        localStorage.setItem('ssnVerificationResult', JSON.stringify({
          timestamp: new Date().toISOString(),
          data: result
        }));
      }

    } catch (error) {
      console.error('SSN verification error:', error);
      const errorMessage = error instanceof Error ? error.message : 'SSN verification failed';
      setSsnVerificationError(errorMessage);
    } finally {
      setSsnVerificationInProgress(false);
    }
  };

  // Initialize Vouched JS Plugin
  useEffect(() => {
    // Don't initialize if already initialized
    if (vouchedInstanceRef.current) {
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://static.vouched.id/plugin/releases/latest/index.js';
    script.async = true;
    
    script.onload = () => {
      console.log('Vouched script loaded successfully');
      
      // Small delay to ensure script is fully loaded
      setTimeout(() => {
        if (window.Vouched) {
          
          // Wait for the DOM element to be available
          const initializeVouched = () => {
            const element = document.getElementById('vouched-element');
            if (!element) {
              console.log('Vouched element not found, retrying...');
              setTimeout(initializeVouched, 100);
              return;
            }
            
            console.log('Vouched element found, creating configuration...');
            
            // Create verification data object
            const verificationData: Record<string, any> = {};
            
            // Always add basic identity data
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

            // Ensure we have at least basic verification data
            if (!verificationData.firstName && !verificationData.lastName) {
              verificationData.firstName = '';
              verificationData.lastName = '';
            }

            // Create proper Vouched configuration following working example
            const vouchedConfig = {
              // The exact App ID that works
              appId: "wYd4PAXW3W2~xHNRx~-cdUpFl!*SFs",

              // Required verification information for comparison
              verification: {
                firstName: verificationData.firstName || '',
                lastName: verificationData.lastName || '',
                email: verificationData.email || '',
                phone: verificationData.phone || '',
                ...(verificationData.birthDate && { birthDate: verificationData.birthDate })
              },

              // Webhook configuration - this sends verification results to your backend
              callbackURL: `${window.location.origin}/api/vouched-webhook`,
              
              // Mobile handoff fields - crucial for sessions
              crossDevice: true,
              crossDeviceQRCode: true,
              crossDeviceSMS: true,

              // Enable camera access on localhost
              allowLocalhost: true,

              // Configuration from reference implementation
              liveness: 'enhanced',
              id: 'camera',
              selfie: 'camera',
              includeBarcode: true,
              manualCaptureTimeout: 20000,
              showTermsAndPrivacy: true,

              // Theme
              theme: {
                name: "avant",
              },

              // Add product configuration conditionally
              ...(config.enabledProducts.includes('crosscheck') && { enableCrossCheck: true }),
              ...(config.enabledProducts.includes('dob-verification') && { dobVerification: true }),
              ...(config.enabledProducts.includes('drivers-license-verification') && { enableDriversLicenseVerification: true }),
              ...(config.enabledProducts.includes('aml') && { enableAML: true }),

              // Add debug mode to get detailed error information
              debug: true,

              // Simple callback following Vouched documentation pattern
              onDone: (job: any) => {
                console.log('=== VOUCHED JOB COMPLETED ===');
                console.log('Job data:', job);
                console.log('Job ID:', job?.id);
                console.log('Job status:', job?.status);
                console.log('Job result:', job?.result);
                console.log('============================');
                
                // Store the job data for webhook processing
                localStorage.setItem('latestJobData', JSON.stringify({
                  timestamp: new Date().toISOString(),
                  data: job
                }));
                
                // Navigate to results page with job information
                const resultsParams = new URLSearchParams({
                  jobId: job?.id || 'unknown',
                  status: job?.status || 'unknown',
                  reverification: reverificationEnabled.toString(),
                  useCase: useCaseContext
                });
                
                window.location.href = `/results?${resultsParams.toString()}`;
              }
            };

            console.log('Initializing Vouched with config:', {
              ...vouchedConfig,
              verification: {
                ...vouchedConfig.verification,
                phone: vouchedConfig.verification.phone ? `***${vouchedConfig.verification.phone.slice(-4)}` : 'not provided'
              }
            });

            try {
              // Initialize Vouched
              const vouchedInstance = window.Vouched(vouchedConfig);
              vouchedInstanceRef.current = vouchedInstance;
              
              // Mount to the element
              vouchedInstance.mount('#vouched-element');
              
              console.log('Vouched instance created and mounted successfully');
              
              // Perform SSN verification if enabled
              if (config.enabledProducts.includes('ssnPrivate')) {
                performSSNVerification();
              }
              
            } catch (error) {
              console.error('Error initializing Vouched:', error);
            }
          };

          // Start initialization
          initializeVouched();
          
        } else {
          console.error('Vouched library not available after script load');
        }
      }, 500); // Increased delay to ensure proper loading
    };

    script.onerror = () => {
      console.error('Failed to load Vouched script');
    };

    document.head.appendChild(script);

    // Cleanup function
    return () => {
      if (vouchedInstanceRef.current && typeof vouchedInstanceRef.current === 'object' && 'unmount' in vouchedInstanceRef.current) {
        try {
          (vouchedInstanceRef.current as any).unmount();
        } catch (error) {
          console.error('Error unmounting Vouched instance:', error);
        }
      }
      vouchedInstanceRef.current = null;
      
      // Remove script
      const existingScript = document.querySelector('script[src="https://static.vouched.id/plugin/releases/latest/index.js"]');
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, [config.enabledProducts, formData, reverificationEnabled, useCaseContext]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-indigo-950 dark:via-slate-900 dark:to-purple-950">
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <PageHeader/>
        
        {/* Page Title */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Healthcare Verification - Identity Verification
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Step 3 of 3: Document and Selfie Verification
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="flex items-center justify-center w-8 h-8 bg-green-600 text-white rounded-full text-sm font-semibold">
                ✓
              </div>
              <span className="ml-3 text-sm font-medium text-green-600">CrossCheck</span>
            </div>
            <div className="flex-1 mx-4 h-1 bg-green-600 rounded"></div>
            <div className="flex items-center">
              <div className="flex items-center justify-center w-8 h-8 bg-green-600 text-white rounded-full text-sm font-semibold">
                ✓
              </div>
              <span className="ml-3 text-sm font-medium text-green-600">DOB Verification</span>
            </div>
            <div className="flex-1 mx-4 h-1 bg-green-600 rounded"></div>
            <div className="flex items-center">
              <div className="flex items-center justify-center w-8 h-8 bg-indigo-600 text-white rounded-full text-sm font-semibold">
                3
              </div>
              <span className="ml-3 text-sm font-medium text-indigo-600">ID Verification</span>
            </div>
          </div>
        </div>

        {/* Verification Interface */}
        <div className="flex flex-col items-center">
          <div className="w-full max-w-4xl">
            {/* Container with styling based on configuration */}
            <div className={`
              ${isPhoneView 
                ? 'bg-gray-900 rounded-3xl p-2 shadow-2xl' 
                : 'bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700'
              }
              overflow-hidden
            `}>
              {/* Phone frame styling */}
              {isPhoneView && (
                <div className="bg-black rounded-2xl p-1">
                  <div className="bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden">
                    {/* Phone notch */}
                    <div className="bg-black h-6 flex items-center justify-center">
                      <div className="w-16 h-1 bg-gray-600 rounded-full"></div>
                    </div>
                  </div>
                </div>
              )}

              {/* Desktop frame styling */}
              {!isPhoneView && (
                <div className="bg-gray-100 dark:bg-gray-700 px-6 py-4 border-b border-gray-200 dark:border-gray-600">
                  <div className="flex items-center gap-3">
                    <div className="flex gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    </div>
                    <div className="flex-1 text-center">
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        Healthcare Identity Verification
                      </span>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Vouched Container */}
              <div className={`vouched-container ${isPhoneView ? 'phone-container' : 'desktop-container'}`}>
                <div id="vouched-element" className="vouched-element"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .vouched-container {
          position: relative;
          overflow: hidden;
          background: white; /* Ensure background color */
        }
        
        .phone-container {
          height: 90vh;
          min-height: 700px;
          width: 100%;
          max-width: 450px; /* Portrait - very narrow and tall */
          margin: 0 auto;
        }
        
        .desktop-container {
          height: 60vh; /* Shorter height for landscape */
          width: 95vw; /* Much wider - almost full screen */
          min-height: 500px;
          min-width: 1000px; /* Much wider minimum */
          max-height: 700px;
          max-width: 1600px; /* Much wider maximum */
          margin: 0 auto; /* Center it */
        }
        
        .vouched-element {
          position: absolute;
          top: 0;
          left: 0;
          width: 100% !important;
          height: 100% !important;
          border: none; /* Remove any borders that might interfere */
          background: transparent;
        }
        
        /* Ensure iframe content is displayed properly */
        .vouched-element iframe {
          border: none;
          width: 100%;
          height: 100%;
        }
        
        /* Desktop element should be LANDSCAPE */
        .desktop-container .vouched-element {
          min-width: 1000px;
          min-height: 500px;
        }
        
        /* Phone element should be narrow and tall */
        .phone-container .vouched-element {
          max-width: 450px;
          min-height: 700px;
        }
        
        /* Responsive adjustments - maintain LANDSCAPE for desktop */
        @media (max-width: 1400px) {
          .desktop-container {
            height: 55vh;
            width: 90vw;
            min-height: 450px;
            min-width: 800px;
            max-height: 650px;
            max-width: 1400px;
          }
        }
        
        @media (max-width: 1000px) {
          .desktop-container {
            height: 50vh;
            width: 85vw;
            min-height: 400px;
            min-width: 700px;
            max-height: 600px;
            max-width: 1000px;
          }
        }
        
        @media (max-width: 768px) {
          .desktop-container {
            height: 45vh;
            width: 80vw;
            min-height: 350px;
            min-width: 600px;
            max-height: 500px;
            max-width: 800px;
          }
          .phone-container {
            max-width: 380px;
            height: 80vh;
            min-height: 600px;
          }
        }
        
        @media (max-width: 480px) {
          .desktop-container {
            height: 40vh;
            width: 75vw;
            min-height: 300px;
            min-width: 400px;
            max-height: 450px;
            max-width: 600px;
          }
          .phone-container {
            max-width: 320px;
            height: 75vh;
            min-height: 500px;
          }
        }
      `}</style>
    </div>
  );
}

export default function HealthcareIDVPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-pink-50 dark:from-rose-950 dark:via-slate-900 dark:to-pink-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-rose-600"></div>
      </div>
    }>
      <HealthcareIDVPageContent />
    </Suspense>
  );
}
