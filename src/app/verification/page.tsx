'use client';

import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'next/navigation';

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

export default function VerificationPage() {
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const vouchedInstanceRef = useRef<any>(null);
  
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
            setIsLoading(false);
            return;
          }
          
          // Configure Vouched based on flow type and products
          const vouchedConfig = {
            appId: 'wYd4PAXW3W2~xHNRx~-cdUpFl!*SFs',
            
            // Mobile handoff settings based on configuration
            // For localhost testing, allow direct camera access even in phone flow
            crossDevice: config.flowType === 'desktop',
            crossDeviceQRCode: config.flowType === 'desktop',
            crossDeviceSMS: config.flowType === 'desktop',
            
            // Configure products based on selection
            id: config.enabledProducts.includes('id-verification'),
            crosscheck: config.enabledProducts.includes('crosscheck'),
            dobVerification: config.enabledProducts.includes('dob-verification'),
            aml: config.enabledProducts.includes('aml'),
            
            // Include form data for verification
            ...(formData.firstName && { firstName: formData.firstName }),
            ...(formData.lastName && { lastName: formData.lastName }),
            ...(formData.phone && { phone: formData.phone }),
            ...(formData.email && { email: formData.email }),
            ...(formData.dateOfBirth && { dateOfBirth: formData.dateOfBirth }),
            ...(formData.ssn && { ssn: formData.ssn }),
            ...(formData.ipAddress && { ipAddress: formData.ipAddress }),
            
            // UI Configuration
            theme: {
              name: 'avant'
            },
            
            // Callbacks
            onInit: (job: any) => {
              console.log('Vouched initialized', job);
              console.log('Form data:', formData);
              console.log('Config:', vouchedConfig);
              console.log('User agent:', navigator.userAgent);
              console.log('Is HTTPS:', window.location.protocol === 'https:');
              
              // Check camera permissions
              if (navigator.mediaDevices) {
                console.log('Camera API available');
                navigator.mediaDevices.enumerateDevices().then(devices => {
                  const videoDevices = devices.filter(device => device.kind === 'videoinput');
                  console.log('Video devices found:', videoDevices.length);
                  console.log('Video devices:', videoDevices);
                }).catch(err => {
                  console.error('Error enumerating devices:', err);
                });
              } else {
                console.log('Camera API NOT available');
              }
              
              setIsLoading(false);
            },
            
            onDone: (job: any) => {
              console.log('Verification complete', { 
                token: job.token, 
                formData: formData 
              });
              // Handle completion - could navigate to results page
            },
            
            onError: (error: any) => {
              console.error('Vouched error', error);
              console.error('Error details:', JSON.stringify(error, null, 2));
              setIsLoading(false);
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
            setIsLoading(false);
          }
        };
        
        // Give the DOM a moment to render
        setTimeout(initializeVouched, 100);
      }
    };
    
    script.onerror = () => {
      console.error('Failed to load Vouched script');
      setIsLoading(false);
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
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold text-xl">
              Vouched
            </div>
          </div>
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
        <div className="flex justify-center">
          <div className={`
            ${isPhoneView 
              ? 'w-full max-w-sm mx-auto' 
              : 'w-full max-w-4xl'
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
                {isLoading && (
                  <div className="loading-container">
                    <div className={`animate-spin rounded-full border-b-2 border-indigo-600 ${isPhoneView ? 'h-8 w-8' : 'h-12 w-12'}`}></div>
                    <p className={`text-gray-600 dark:text-gray-300 ${isPhoneView ? 'mt-2' : 'mt-4'}`}>Loading verification...</p>
                  </div>
                )}
                <div id="vouched-element" className="vouched-element"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Helpful Note */}
        <div className="mt-8 text-center">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 max-w-2xl mx-auto">
            <p className="text-blue-800 dark:text-blue-200 text-sm">
              <strong>Note:</strong> The verification experience is optimized for your selected flow type. 
              {config.flowType === 'desktop' && ' You\'ll see QR codes or SMS options to continue on your mobile device.'}
              {config.flowType === 'phone' && ' The camera interface will appear directly for mobile verification.'}
            </p>
          </div>
        </div>

        {/* Configuration Display */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 mt-8">
          <div className="flex flex-wrap gap-4 text-sm justify-center">
            <div className="flex items-center gap-2">
              <span className="text-gray-500 dark:text-gray-400">Flow:</span>
              <span className="bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 px-2 py-1 rounded capitalize">
                {config.flowType}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500 dark:text-gray-400">Workflow:</span>
              <span className="bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 px-2 py-1 rounded">
                {config.workflowType}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500 dark:text-gray-400">Products:</span>
              <span className="bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 px-2 py-1 rounded">
                {config.enabledProducts.length}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500 dark:text-gray-400">Form Data:</span>
              <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                {Object.keys(formData).filter(key => formData[key as keyof FormData]).length} fields
              </span>
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
          height: 600px;
        }
        
        .desktop-container {
          height: 700px;
        }
        
        .vouched-element {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
        }
        
        .loading-container {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          display: flex;
          flex-direction: column;
          align-items: center;
          z-index: 10;
        }
        
        /* Responsive adjustments */
        @media (max-width: 768px) {
          .desktop-container {
            height: 500px;
          }
          .phone-container {
            height: 500px;
          }
        }
      `}</style>
    </div>
  );
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    Vouched: any;
  }
} 