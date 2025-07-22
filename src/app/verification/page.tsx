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
    script.src = 'https://static.vouched.id/widget/vouched-2.0.0.js';
    script.async = true;
    
    script.onload = () => {
      if (window.Vouched) {
        // Wait for the DOM element to be available
        const initializeVouched = () => {
          const element = document.getElementById('vouched-element');
          if (!element) {
            console.error('Vouched element not found');
            return;
          }
          
                      // Configure Vouched based on flow type and products
            const vouchedConfig = {
              appId: 'wYd4PAXW3W2~xHNRx~-cdUpFl!*SFs',
              
              // Webhook configuration for receiving results
              callbackURL: `${window.location.origin}/api/vouched-webhook`,
              
              // Force desktop mode for cross-device handoff
              ...(config.flowType === 'desktop' && {
                crossDevice: true,
                crossDeviceQRCode: true, 
                crossDeviceSMS: true,
                mode: 'desktop', // Explicitly set desktop mode
              }),
              
              // Force mobile mode when phone flow is selected
              ...(config.flowType === 'phone' && {
                crossDevice: false,
                crossDeviceQRCode: false,
                crossDeviceSMS: false,
                mode: 'mobile', // Explicitly set mobile mode
              }),
              
              // Verification information for comparison
              verification: {
                ...(formData.firstName && { firstName: formData.firstName }),
                ...(formData.lastName && { lastName: formData.lastName }),
                ...(formData.phone && { phone: formData.phone }),
                ...(formData.email && { email: formData.email }),
                ...(formData.dateOfBirth && { dob: formData.dateOfBirth }),
                ...(formData.ssn && { ssn: formData.ssn }),
              },
              
              // Enable camera access on localhost
              allowLocalhost: true,
              
              // Basic verification configuration (always enabled)
              id: 'camera',
              selfie: 'camera',
              
              // Product configuration - conditional based on selection
              ...(config.enabledProducts.includes('crosscheck') ? { crosscheck: true } : {}),
              ...(config.enabledProducts.includes('ssnPrivate') ? { ssnPrivate: true } : {}),
              ...(config.enabledProducts.includes('dob-verification') ? { dobVerification: true } : {}),
              ...(config.enabledProducts.includes('aml') ? { aml: true } : {}),
              
              // Additional configuration from reference implementation
              liveness: 'enhanced',
              includeBarcode: true,
              manualCaptureTimeout: 20000,
              showTermsAndPrivacy: true,
              
              // UI Configuration
              theme: {
                name: 'avant'
              },
              
              // Callbacks
              onInit: (job: { token: string }) => {
                console.log('Vouched initialized', job);
              },
              
              onDone: (job: { token: string }) => {
                console.log('Verification complete', { 
                  token: job.token, 
                  formData: formData 
                });
                
                // Navigate to webhook response page
                window.location.href = '/webhook-response';
              },
              
              onError: (error: Error) => {
                console.error('Vouched error', error);
                console.error('Error details:', JSON.stringify(error, null, 2));
              }
            };

          try {
            // Initialize Vouched using the correct pattern
            console.log('Initializing Vouched with config:', vouchedConfig);
            const vouched = window.Vouched(vouchedConfig);
            
            // Store the instance in ref
            vouchedInstanceRef.current = vouched;
            
            vouched.mount('#vouched-element');
            console.log('Vouched mounted successfully');
          } catch (error) {
            console.error('Failed to initialize Vouched:', error);
          }
        };
        
        // Give the DOM a moment to render
        setTimeout(initializeVouched, 100);
      }
    };
    
    script.onerror = () => {
      console.error('Failed to load Vouched script');
    };
    
    document.head.appendChild(script);
    
    return () => {
      // Cleanup Vouched instance properly
      if (vouchedInstanceRef.current) {
        try {
          // If there's an unmount method, call it
          if (typeof vouchedInstanceRef.current.unmount === 'function') {
            vouchedInstanceRef.current.unmount();
          }
        } catch (error) {
          console.error('Error unmounting Vouched:', error);
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