'use client';

import { useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import PageHeader from '../components/PageHeader';
import { SSNVerificationRequest, SSNApiResponse, isSSNVerificationResponse } from '../../types/ssn-api';
import { VouchedConfig as VouchedSDKConfig, VouchedJob, VouchedInstance, VouchedMessageEvent } from '../../types/vouched';

interface AppConfig {
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

function VerificationPageContent() {
  const searchParams = useSearchParams();
  const vouchedInstanceRef = useRef<VouchedInstance | null>(null);
  
  // Parse configuration from URL params
  const config: AppConfig = {
    flowType: (searchParams.get('flow') as 'desktop' | 'phone') || 'desktop',
    workflowType: (searchParams.get('workflow') as 'simultaneous' | 'step-up') || 'simultaneous',
    enabledProducts: searchParams.get('products')?.split(',') || ['id-verification']
  };
  
  const reverificationEnabled = searchParams.get('reverification') === 'true';
  const useCaseContext = searchParams.get('useCase') || 'financial';

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
      
      if (window.Vouched) {
          
          // Wait for the DOM element to be available
          const initializeVouched = () => {
            const element = document.getElementById('vouched-element');
            if (!element) {
              console.error('Vouched element not found');
              // Retry after a short delay
              setTimeout(initializeVouched, 100);
              return;
            }
            
            
            // Start SSN verification in parallel if enabled
            if (config.enabledProducts.includes('ssnPrivate')) {
              performSSNVerification();
            }
            
            // Configure Vouched based on flow type and products
            const verificationData: Record<string, string | boolean> = {};
            
            // Always add basic identity data (required for all products)
            if (formData.firstName) verificationData.firstName = formData.firstName;
            if (formData.lastName) verificationData.lastName = formData.lastName;
            if (formData.phone) verificationData.phone = formData.phone;
            if (formData.email) verificationData.email = formData.email;
            if (formData.ipAddress) verificationData.ipAddress = formData.ipAddress;
            
            // Add DOB for DOB verification - MUST use birthDate parameter
            if (config.enabledProducts.includes('dob-verification') && formData.dateOfBirth) {
              verificationData.birthDate = formData.dateOfBirth;
            }
            

            // Validate required data for product combinations
            const hasRequiredData = (products: string[], data: Record<string, string | boolean>): boolean => {
              // For CrossCheck, require basic identity data
              if (products.includes('crosscheck')) {
                if (!data.firstName || !data.lastName || !data.email || !data.phone) {
                  console.error('CrossCheck requires firstName, lastName, email, and phone');
                  return false;
                }
              }
              
              // For DOB verification, require birth date
              if (products.includes('dob-verification') && !data.birthDate) {
                console.error('DOB verification requires birthDate');
                return false;
              }
              
              
              // For AML, require at least name data
              if (products.includes('aml') && (!data.firstName || !data.lastName)) {
                console.error('AML requires firstName and lastName');
                return false;
              }
              
              return true;
            };

            // Check if we have required data for the selected products
            if (!hasRequiredData(config.enabledProducts, verificationData)) {
              console.error('Missing required verification data for selected products:', config.enabledProducts);
              console.error('Available data:', verificationData);
              // Show user-friendly error instead of loading indefinitely
              const errorElement = document.getElementById('vouched-element');
              if (errorElement) {
                errorElement.innerHTML = `
                  <div style="padding: 40px; text-align: center; color: #dc2626; font-family: system-ui;">
                    <h3>Configuration Error</h3>
                    <p>Missing required data for selected verification products.</p>
                    <p>Please go back and ensure all required fields are filled.</p>
                    <button onclick="window.history.back()" style="margin-top: 20px; padding: 10px 20px; background: #dc2626; color: white; border: none; border-radius: 5px; cursor: pointer;">
                      Go Back
                    </button>
                  </div>
                `;
              }
              return;
            }

            // Only set minimal fallback data for ID verification only
            if (config.enabledProducts.length === 1 && config.enabledProducts.includes('id-verification')) {
              if (!verificationData.firstName && !verificationData.lastName) {
                verificationData.firstName = '';
                verificationData.lastName = '';
              }
            }

            // Create proper Vouched configuration following working example
            const vouchedConfig: VouchedSDKConfig = {
              // Use environment variable for App ID (public key)
              appId: process.env.NEXT_PUBLIC_VOUCHED_APP_ID || "wYd4PAXW3W2~xHNRx~-cdUpFl!*SFs",

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
              onDone: function(job: VouchedJob) {
                console.log("Verification complete", { token: job.token });
                
                // Store essential data
                if (job.id) {
                  localStorage.setItem('vouchedJobId', job.id);
                }
                localStorage.setItem('latestJobData', JSON.stringify({
                  timestamp: new Date().toISOString(),
                  data: job
                }));

                // Simple navigation based on success
                if (job.result && job.result.success) {
                  const dashboardParams = new URLSearchParams({
                    reverification: reverificationEnabled.toString(),
                    useCase: useCaseContext
                  });
                  window.location.href = `/dashboard?${dashboardParams.toString()}`;
                } else {
                  window.location.href = '/webhook-response';
                }
              }
            };

          try {
            // Check if there's already an instance and clean it up first
            if (vouchedInstanceRef.current) {
              console.log("Cleaning up existing Vouched instance before creating a new one");
              try {
                if (typeof vouchedInstanceRef.current.unmount === 'function') {
                  vouchedInstanceRef.current.unmount();
                }
                if (typeof vouchedInstanceRef.current.destroy === 'function') {
                  vouchedInstanceRef.current.destroy();
                }
              } catch (cleanupError) {
                console.warn("Error during cleanup:", cleanupError);
              }
              vouchedInstanceRef.current = null;
            }
            
            // Set up message listener for Vouched events (since callbacks cause DataCloneError)
            const messageHandler = (event: MessageEvent<VouchedMessageEvent>) => {
              // Only listen to messages from Vouched
              if (event.origin !== 'https://static.vouched.id') return;
              
              console.log('Received message from Vouched:', event.data);
              
              const { type, data } = event.data;
              const jobData = data as Record<string, unknown> | undefined;
              
              if (type === 'VOUCHED_INIT') {
                console.log('onInit called:', data);
                console.log('Job ID:', jobData?.id);
                console.log('Job Token:', jobData?.token);
                console.log('Job Status:', jobData?.status);
              }
              
              if (type === 'VOUCHED_SUBMIT') {
                console.log("Photo submitted", data);
                console.log("Job ID in onSubmit:", (jobData?.job as Record<string, unknown>)?.id);
                console.log("Job Status in onSubmit:", (jobData?.job as Record<string, unknown>)?.status);
              }
              
              if (type === 'VOUCHED_DONE') {
                console.log("Scanning complete via postMessage", data);
                // Navigation is now handled by onDone callback
              }
              
              if (type === 'VOUCHED_CAMERA') {
                console.log("Camera status", data);
              }
              
              if (type === 'VOUCHED_ERROR') {
                console.error('Vouched error', data);
              }
            };
            
            window.addEventListener('message', messageHandler);
            
            // Store handler for cleanup
            (window as Window & { _vouchedMessageHandler?: typeof messageHandler })._vouchedMessageHandler = messageHandler;

            // Initialize Vouched using the correct pattern
            console.log('=== VOUCHED PRODUCT CONFIGURATION ===');
            console.log('Enabled Products:', config.enabledProducts);
            console.log('Product Keys Being Sent to Vouched:');
            console.log('  verification.enableCrossCheck:', vouchedConfig.verification?.enableCrossCheck);
            console.log('  verification.enableDriversLicenseValidation:', vouchedConfig.verification?.enableDriversLicenseValidation);
            console.log('  dobVerification (root):', vouchedConfig.dobVerification);
            console.log('  enableAML (root):', vouchedConfig.enableAML);
            console.log('Full Vouched Config:', JSON.stringify(vouchedConfig, null, 2));
            console.log('=====================================');
            const vouched = window.Vouched(vouchedConfig);
            
            // Store the instance in ref
            vouchedInstanceRef.current = vouched;
            
            console.log('About to mount Vouched to #vouched-element...');
            vouched.mount('#vouched-element');
            console.log('Vouched mount called successfully');
            
          } catch (error) {
            console.error('Failed to initialize Vouched:', error);
            console.error('Error details:', {
              message: error instanceof Error ? error.message : String(error),
              stack: error instanceof Error ? error.stack : undefined,
              config: vouchedConfig
            });
          }
        };
        
        // Call the initialization function
        initializeVouched();
        } else {
          console.error('Vouched object not found on window');
        }
    };
    
    document.head.appendChild(script);
    
    return () => {
      // Cleanup message listener
      const windowWithHandler = window as Window & { _vouchedMessageHandler?: (event: MessageEvent) => void };
      if (windowWithHandler._vouchedMessageHandler) {
        window.removeEventListener('message', windowWithHandler._vouchedMessageHandler);
        delete windowWithHandler._vouchedMessageHandler;
      }
      
      // Cleanup Vouched instance properly
      if (vouchedInstanceRef.current) {
        try {
          console.log("Cleaning up Vouched instance on unmount");
          // If there's an unmount method, call it
          if (typeof vouchedInstanceRef.current.unmount === 'function') {
            vouchedInstanceRef.current.unmount();
          }
          // If there's a destroy method, call it
          if (typeof vouchedInstanceRef.current.destroy === 'function') {
            vouchedInstanceRef.current.destroy();
          }
        } catch (error) {
          console.error('Error cleaning up Vouched:', error);
        }
        vouchedInstanceRef.current = null;
      }
      
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount - intentionally ignoring dependencies to prevent re-initialization

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-indigo-950 dark:via-slate-900 dark:to-purple-950">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <PageHeader/>
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Identity Verification
          </h1>
          

        </div>

        {/* Verification Container */}
        <div className="w-full flex justify-center items-center">
          <div className={`
            ${isPhoneView 
              ? 'w-full max-w-lg mx-auto' 
              : '' /* Desktop will use CSS-defined dimensions */
            }
            transition-all duration-300
          `}>
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
                        Identity Verification
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

export default function VerificationPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-indigo-950 dark:via-slate-900 dark:to-purple-950 flex items-center justify-center">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
    </div>}>
      <VerificationPageContent />
    </Suspense>
  );
}