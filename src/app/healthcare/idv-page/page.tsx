'use client';

import React, { useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import PageHeader from '@/app/components/PageHeader';
import { SSNVerificationRequest, SSNApiResponse, isSSNVerificationResponse } from '@/types/ssn-api';
import { VouchedConfig as VouchedSDKConfig, VouchedJob, VouchedInstance } from '@/types/vouched';

interface AppConfig {
  workflowType: 'simultaneous' | 'step-up';
  enabledProducts: string[];
  disabledProducts: string[];
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
  const vouchedInstanceRef = useRef<VouchedInstance | null>(null);
  
  // Parse configuration from URL params
  const config: AppConfig = {
    workflowType: (searchParams.get('workflow') as 'simultaneous' | 'step-up') || 'step-up',
    enabledProducts: searchParams.get('products')?.split(',').filter(p => p) || ['id-verification'],
    disabledProducts: searchParams.get('disabledProducts')?.split(',').filter(p => p) || []
  };

  const reverificationEnabled = searchParams.get('reverification') === 'true';
  const useCaseContext = searchParams.get('useCase') || 'healthcare';

  // Parse form data from URL params
  const formData: FormData = searchParams.get('formData')
    ? JSON.parse(searchParams.get('formData')!)
    : {};

  // SSN verification function
  const performSSNVerification = async () => {
    if (!config.enabledProducts.includes('ssnPrivate') || !formData.ssn || !formData.firstName || !formData.lastName || !formData.phone) {
      console.log('SSN verification skipped - not enabled or missing required data (firstName, lastName, phone, ssn required)');
      return;
    }

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

      // Store SSN verification result for later display
      if (isSSNVerificationResponse(result)) {
        localStorage.setItem('ssnVerificationResult', JSON.stringify({
          timestamp: new Date().toISOString(),
          data: result
        }));
      }

    } catch (error) {
      console.error('SSN verification error:', error);
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
            const verificationData: Record<string, string | boolean> = {};
            
            // Always add basic identity data
            if (formData.firstName) verificationData.firstName = formData.firstName;
            if (formData.lastName) verificationData.lastName = formData.lastName;
            if (formData.phone) verificationData.phone = formData.phone;
            if (formData.email) verificationData.email = formData.email;
            if (formData.ipAddress) verificationData.ipAddress = formData.ipAddress;
            
            // Add DOB for Visual IDV or DOB verification
            if ((config.enabledProducts.includes('id-verification') || config.enabledProducts.includes('dob-verification')) && formData.dateOfBirth) {
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
            const vouchedConfig: VouchedSDKConfig = {
              // Use environment variable for App ID (public key)
              appId: process.env.NEXT_PUBLIC_VOUCHED_APP_ID!,

              // Required verification information for comparison
              verification: {
                firstName: (typeof verificationData.firstName === 'string' ? verificationData.firstName : '') || '',
                lastName: (typeof verificationData.lastName === 'string' ? verificationData.lastName : '') || '',
                email: (typeof verificationData.email === 'string' ? verificationData.email : '') || '',
                phone: (typeof verificationData.phone === 'string' ? verificationData.phone : '') || '',
                ...(typeof verificationData.birthDate === 'string' && verificationData.birthDate && { birthDate: verificationData.birthDate }),
                // Product configuration goes inside verification object per Vouched docs
                enableCrossCheck: config.enabledProducts.includes('crosscheck'),
                enableDriversLicenseValidation: config.enabledProducts.includes('drivers-license-verification'),
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

              // Other product configurations at root level
              dobVerification: config.enabledProducts.includes('dob-verification'),
              enableAML: config.enabledProducts.includes('aml'),

              // Add debug mode to get detailed error information
              debug: true,

              // Simple callback following Vouched documentation pattern
              onDone: (job: VouchedJob) => {
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
                
                // For healthcare workflows, redirect to dashboard instead of results
                if (useCaseContext === 'healthcare') {
                  console.log('Healthcare workflow detected, redirecting to dashboard...');
                  const dashboardParams = new URLSearchParams({
                    reverification: reverificationEnabled.toString(),
                    useCase: useCaseContext
                  });
                  window.location.href = `/dashboard?${dashboardParams.toString()}`;
                } else {
                  // For other workflows, use the results page
                  const resultsParams = new URLSearchParams({
                    jobId: job?.id || 'unknown',
                    status: job?.status || 'unknown',
                    reverification: reverificationEnabled.toString(),
                    useCase: useCaseContext
                  });
                  window.location.href = `/results?${resultsParams.toString()}`;
                }
              }
            };

            console.log('=== VOUCHED PRODUCT CONFIGURATION (Healthcare) ===');
            console.log('Enabled Products:', config.enabledProducts);
            console.log('Disabled Products:', config.disabledProducts);
            console.log('Product Keys Being Sent to Vouched:');
            console.log('  verification.enableCrossCheck:', vouchedConfig.verification?.enableCrossCheck);
            console.log('  verification.enableDriversLicenseValidation:', vouchedConfig.verification?.enableDriversLicenseValidation);
            console.log('  dobVerification (root):', vouchedConfig.dobVerification);
            console.log('  enableAML (root):', vouchedConfig.enableAML);
            console.log('Full Vouched Config:', JSON.stringify(vouchedConfig, null, 2));
            console.log('==================================================');

            try {
              // Initialize Vouched
              const vouchedInstance = window.Vouched(vouchedConfig);
              vouchedInstanceRef.current = vouchedInstance;
              
              // Mount to the element
              vouchedInstance.mount('#vouched-element');
              
              console.log('Vouched instance created and mounted successfully');
              
              // Perform SSN verification if enabled (only for workflows that explicitly include ssnPrivate)
              if (config.enabledProducts.includes('ssnPrivate')) {
                console.log('SSN verification enabled, performing verification...');
                performSSNVerification();
              } else {
                console.log('SSN verification not enabled for this workflow, skipping...');
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
      if (vouchedInstanceRef.current?.unmount) {
        try {
          vouchedInstanceRef.current.unmount();
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount - intentionally ignoring dependencies to prevent re-initialization

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-indigo-950 dark:via-slate-900 dark:to-purple-950">
      <div className="page-container max-w-none mx-auto px-6 py-12">
        {/* Header */}
        <div className="page-header">
          <PageHeader/>
        </div>

        {/* Page Title */}
        <div className="page-title text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Healthcare Verification - Identity Verification
          </h1>
        </div>

        {/* Progress Indicator */}
        <div className="progress-indicator mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold text-white" style={{ backgroundColor: '#22C55E' }}>
                ✓
              </div>
              <span className="ml-3 text-sm font-medium" style={{ color: '#22C55E' }}>CrossCheck</span>
            </div>
            <div className="flex-1 mx-4 h-1 rounded" style={{ backgroundColor: '#22C55E' }}></div>
            <div className="flex items-center">
              <div className="flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold text-white" style={{ backgroundColor: '#22C55E' }}>
                ✓
              </div>
              <span className="ml-3 text-sm font-medium" style={{ color: '#22C55E' }}>DOB Verification</span>
            </div>
            <div className="flex-1 mx-4 h-1 rounded" style={{ backgroundColor: '#22C55E' }}></div>
            <div className="flex items-center">
              <div className="flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold text-white" style={{ backgroundColor: '#22C55E' }}>
                3
              </div>
              <span className="ml-3 text-sm font-medium" style={{ color: '#22C55E' }}>ID Verification</span>
            </div>
          </div>
        </div>

        {/* Verification Interface */}
        <div className="flex flex-col items-center">
          <div className="verification-wrapper w-full max-w-none">
            {/* Container with styling */}
            <div className="verification-card bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              {/* Desktop frame styling */}
              <div className="desktop-frame bg-gray-100 dark:bg-gray-700 px-6 py-4 border-b border-gray-200 dark:border-gray-600">
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

              {/* Vouched Container */}
              <div className="vouched-container desktop-container">
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
          background: white;
        }

        .desktop-container {
          height: 80vh;
          width: 100vw;
          min-height: 700px;
          min-width: 1400px;
          max-height: 900px;
          max-width: 2000px;
          margin: 0 auto;
        }

        .vouched-element {
          position: absolute;
          top: 0;
          left: 0;
          width: 100% !important;
          height: 100% !important;
          border: none;
          background: transparent;
        }

        .vouched-element iframe {
          border: none;
          width: 100%;
          height: 100%;
        }

        .desktop-container .vouched-element {
          min-width: 1400px;
          min-height: 700px;
        }

        /* Tablet adjustments */
        @media (max-width: 1800px) {
          .desktop-container {
            height: 75vh;
            width: 98vw;
            min-height: 650px;
            min-width: 1200px;
            max-height: 850px;
            max-width: 1800px;
          }
        }

        @media (max-width: 1400px) {
          .desktop-container {
            height: 70vh;
            width: 95vw;
            min-height: 600px;
            min-width: 1000px;
            max-height: 800px;
            max-width: 1400px;
          }
        }

        /* Mobile: Full-screen iframe experience */
        @media (max-width: 768px) {
          /* Ensure html and body are full height */
          :global(html),
          :global(body) {
            height: 100%;
            overflow: hidden;
          }

          /* Hide everything except iframe on mobile */
          .page-container {
            padding: 0 !important;
            max-width: 100% !important;
            height: 100%;
          }

          .page-header {
            display: none;
          }

          .page-title {
            display: none;
          }

          .progress-indicator {
            display: none;
          }

          .verification-wrapper {
            width: 100% !important;
            height: 100% !important;
            position: fixed;
            top: 0;
            left: 0;
            z-index: 10;
          }

          .verification-card {
            width: 100% !important;
            height: 100% !important;
            border: none !important;
            border-radius: 0 !important;
            box-shadow: none !important;
          }

          .desktop-frame {
            display: none;
          }

          .desktop-container {
            height: 100% !important;
            width: 100% !important;
            max-width: 100% !important;
            min-width: 100% !important;
            min-height: 100% !important;
            max-height: 100% !important;
            margin: 0 !important;
          }

          .desktop-container .vouched-element {
            height: 100% !important;
            width: 100% !important;
            min-width: 100% !important;
            min-height: 100% !important;
          }
        }

        @media (max-width: 480px) {
          /* Same full-screen treatment for smaller mobile devices */
          .desktop-container {
            height: 100% !important;
            width: 100% !important;
            max-width: 100% !important;
            min-width: 100% !important;
            min-height: 100% !important;
            max-height: 100% !important;
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
