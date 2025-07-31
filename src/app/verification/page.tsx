'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import PageHeader from '../components/PageHeader';

// Extend Window interface for TypeScript
declare global {
  interface Window {
    Vouched: (config: Record<string, unknown>) => { mount: (selector: string) => void; unmount?: () => void };
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

function VerificationPageContent() {
  const searchParams = useSearchParams();
  const vouchedInstanceRef = useRef<Record<string, unknown> | null>(null);
  
  // Parse configuration from URL params
  const config: VouchedConfig = {
    flowType: (searchParams.get('flow') as 'desktop' | 'phone') || 'desktop',
    workflowType: (searchParams.get('workflow') as 'simultaneous' | 'step-up') || 'simultaneous',
    enabledProducts: searchParams.get('products')?.split(',') || ['id-verification']
  };
  
  const reverificationEnabled = searchParams.get('reverification') === 'true';

  // Parse form data from URL params
  const formData: FormData = searchParams.get('formData') 
    ? JSON.parse(searchParams.get('formData')!) 
    : {};

  // Determine if we should show phone view based on configuration
  const isPhoneView = config.flowType === 'phone';

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
      
      // Add a small delay to ensure the script is fully initialized
      setTimeout(() => {
        if (window.Vouched) {
          console.log('Vouched object found, initializing...');
          
          // Wait for the DOM element to be available
          const initializeVouched = () => {
            const element = document.getElementById('vouched-element');
            if (!element) {
              console.error('Vouched element not found');
              // Retry after a short delay
              setTimeout(initializeVouched, 100);
              return;
            }
            
            console.log('Vouched element found, creating configuration...');
                      // Configure Vouched based on flow type and products
            const verificationData: Record<string, any> = {};
            
            // Add basic identity data for CrossCheck and IDV
            if (formData.firstName) verificationData.firstName = formData.firstName;
            if (formData.lastName) verificationData.lastName = formData.lastName;
            if (formData.phone) verificationData.phone = formData.phone;
            if (formData.email) verificationData.email = formData.email;
            if (formData.ipAddress) verificationData.ipAddress = formData.ipAddress;
            
            // Add DOB for DOB verification - MUST use birthDate parameter
            if (config.enabledProducts.includes('dob-verification') && formData.dateOfBirth) {
              verificationData.birthDate = formData.dateOfBirth;
            }
            
            // Add SSN for SSN Private verification
            if (config.enabledProducts.includes('ssnPrivate') && formData.ssn) {
              verificationData.ssn = formData.ssn;
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
                ...(verificationData.birthDate && { dob: verificationData.birthDate }),
                ...(verificationData.ssn && { ssn: verificationData.ssn })
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
              ...(config.enabledProducts.includes('crosscheck') && { crosscheck: true }),
              ...(config.enabledProducts.includes('dob-verification') && { dobVerification: true }),

              // Add debug mode to get detailed error information
              debug: true,

              // Simple callback following Vouched documentation pattern
              onDone: function(job: any) {
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
                  window.location.href = '/dashboard';
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
            const messageHandler = (event: MessageEvent) => {
              // Only listen to messages from Vouched
              if (event.origin !== 'https://static.vouched.id') return;
              
              console.log('Received message from Vouched:', event.data);
              
              const { type, data } = event.data;
              
              if (type === 'VOUCHED_INIT') {
                console.log('onInit called:', data);
                console.log('Job ID:', data?.id);
                console.log('Job Token:', data?.token);
                console.log('Job Status:', data?.status);
              }
              
              if (type === 'VOUCHED_SUBMIT') {
                console.log("Photo submitted", data);
                console.log("Job ID in onSubmit:", data?.job?.id);
                console.log("Job Status in onSubmit:", data?.job?.status);
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
            (window as any)._vouchedMessageHandler = messageHandler;

            // Initialize Vouched using the correct pattern
            console.log('Initializing Vouched with config:', JSON.stringify(vouchedConfig, null, 2));
            const vouched = window.Vouched(vouchedConfig);
            
            // Store the instance in ref
            vouchedInstanceRef.current = vouched;
            
            console.log('About to mount Vouched to #vouched-element...');
            vouched.mount('#vouched-element');
            console.log('Vouched mount called successfully');
            
            // Add a timeout to check if mounting actually worked
            setTimeout(() => {
              const iframeCheck = document.querySelector('#vouched-element iframe');
              if (iframeCheck) {
                console.log('✅ Vouched iframe found and mounted:', iframeCheck);
                console.log('Iframe src:', iframeCheck.getAttribute('src'));
                console.log('Iframe dimensions:', {
                  width: iframeCheck.clientWidth,
                  height: iframeCheck.clientHeight
                });
              } else {
                console.log('❌ Vouched iframe NOT found after mounting');
                console.log('Vouched element contents:', document.getElementById('vouched-element')?.innerHTML);
                
                // Try remounting as a fallback
                console.log('Attempting to remount Vouched...');
                try {
                  if (vouchedInstanceRef.current && typeof (vouchedInstanceRef.current as any).unmount === 'function') {
                    (vouchedInstanceRef.current as any).unmount();
                  }
                  setTimeout(() => {
                    if (vouchedInstanceRef.current && typeof (vouchedInstanceRef.current as any).mount === 'function') {
                      (vouchedInstanceRef.current as any).mount('#vouched-element');
                      console.log('Remount attempt completed');
                    }
                  }, 1000);
                } catch (remountError) {
                  console.error('Remount failed:', remountError);
                }
              }
            }, 3000); // Check after 3 seconds instead of 2
            
          } catch (error) {
            console.error('Failed to initialize Vouched:', error);
            console.error('Error details:', {
              message: error instanceof Error ? error.message : String(error),
              stack: error instanceof Error ? error.stack : undefined,
              config: vouchedConfig
            });
          }
        };
        
        // Give the DOM a moment to render
        setTimeout(initializeVouched, 100);
        } else {
          console.error('Vouched object not found after script load');
        }
      }, 500); // Initial delay for script loading
    };
    
    script.onerror = () => {
      console.error('Failed to load Vouched script');
    };
    
    document.head.appendChild(script);
    
    return () => {
      // Cleanup message listener
      if ((window as any)._vouchedMessageHandler) {
        window.removeEventListener('message', (window as any)._vouchedMessageHandler);
        delete (window as any)._vouchedMessageHandler;
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
  }, []); // Only run once on mount

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-indigo-950 dark:via-slate-900 dark:to-purple-950">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <PageHeader pageTitle="Identity Verification" />
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Identity Verification
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            {config.flowType === 'desktop' 
              ? 'Complete verification on desktop, then use your mobile device' 
              : 'Complete verification on your mobile device'
            }
          </p>
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