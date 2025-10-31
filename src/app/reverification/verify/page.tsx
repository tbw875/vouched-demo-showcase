'use client';

import { useEffect, useRef, Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import PageHeader from '../../components/PageHeader';
import { VouchedConfig as VouchedSDKConfig, VouchedJob, VouchedInstance, VouchedMessageEvent } from '@/types/vouched';

function ReverificationVerifyContent() {
  const searchParams = useSearchParams();
  const vouchedInstanceRef = useRef<VouchedInstance | null>(null);
  const [isPhoneView, setIsPhoneView] = useState(false);
  
  const originalJobId = searchParams.get('originalJobId');

  // Detect device type - for reverification, we'll default to desktop but allow phone mode
  useEffect(() => {
    const checkDeviceType = () => {
      const isMobile = window.innerWidth <= 768;
      setIsPhoneView(isMobile);
    };
    
    checkDeviceType();
    window.addEventListener('resize', checkDeviceType);
    
    return () => window.removeEventListener('resize', checkDeviceType);
  }, []);

  // Initialize Vouched JS Plugin for Reverification
  useEffect(() => {
    // Don't initialize if already initialized
    if (vouchedInstanceRef.current) {
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://static.vouched.id/plugin/releases/latest/index.js';
    script.async = true;
    
    script.onload = () => {
      console.log('Vouched script loaded successfully for reverification');
      
      // Small delay to ensure script is fully loaded
      setTimeout(() => {
        if (window.Vouched) {
          
          // Wait for the DOM element to be available
          const initializeVouched = () => {
            const element = document.getElementById('vouched-element');
            if (!element) {
              console.error('Vouched element not found');
              setTimeout(initializeVouched, 100);
              return;
            }
            
            console.log('Vouched element found, creating reverification configuration...');
            
            if (!originalJobId) {
              console.error('No originalJobId provided for reverification');
              return;
            }
            
            // Configure Vouched for Reverification following working pattern
            const vouchedConfig: VouchedSDKConfig = {
              // Use environment variable for App ID (public key)
              appId: process.env.NEXT_PUBLIC_VOUCHED_APP_ID || "wYd4PAXW3W2~xHNRx~-cdUpFl!*SFs",

              // Specify reverification job
              type: 'reverify',
              reverificationParameters: {
                // Reference the source job by its id
                jobId: originalJobId,
                match: 'selfie'
              },

              // Theme must be 'avant' for reverification
              theme: {
                name: 'avant',
              },

              // Webhook for POST verification processing
              callbackURL: `${window.location.origin}/api/vouched-webhook`,

              // Mobile handoff
              crossDevice: true,
              crossDeviceQRCode: true,
              crossDeviceSMS: true,

              // Enable camera access on localhost
              allowLocalhost: true,

              liveness: 'enhanced',
              id: 'camera',
              selfie: 'camera',
              includeBarcode: true,
              manualCaptureTimeout: 20000,
              showTermsAndPrivacy: true,

              // Add debug mode to get detailed error information
              debug: true,

              // Simple reverification callback following Vouched docs pattern
              onReverify: function(job: VouchedJob) {
                console.log("Reverification complete", { token: job.token });
                
                // Store essential data for dashboard access
                localStorage.setItem('latestJobData', JSON.stringify({
                  timestamp: new Date().toISOString(),
                  data: job,
                  type: 'reverify'
                }));

                // Redirect to dashboard (welcome page) based on success, like regular verification
                if (job.result && job.result.success) {
                  console.log("Reverification successful, redirecting to dashboard");
                  window.location.href = '/dashboard';
                } else {
                  console.log("Reverification failed, redirecting to reverification results");
                  window.location.href = '/reverification/results';
                }
              }
            };

            try {
              // Check if there's already an instance and clean it up first
              if (vouchedInstanceRef.current) {
                console.log("Cleaning up existing reverification Vouched instance before creating a new one");
                try {
                  if (typeof vouchedInstanceRef.current.unmount === 'function') {
                    vouchedInstanceRef.current.unmount();
                  }
                  if (typeof vouchedInstanceRef.current.destroy === 'function') {
                    vouchedInstanceRef.current.destroy();
                  }
                } catch (cleanupError) {
                  console.warn("Error during reverification cleanup:", cleanupError);
                }
                vouchedInstanceRef.current = null;
              }

              // Set up message listener for reverification events
              const messageHandler = (event: MessageEvent<VouchedMessageEvent>) => {
                // Only listen to messages from Vouched
                if (event.origin !== 'https://static.vouched.id') return;
                
                console.log('Received reverification message from Vouched:', event.data);
                
                const { type, data } = event.data;
                const jobData = data as Record<string, unknown> | undefined;
                
                if (type === 'VOUCHED_INIT') {
                  console.log('Reverification onInit called:', data);
                  console.log('Job ID:', jobData?.id);
                  console.log('Job Token:', jobData?.token);
                  console.log('Job Status:', jobData?.status);
                }
                
                if (type === 'VOUCHED_REVERIFY' || type === 'VOUCHED_DONE') {
                  console.log("Reverification complete via postMessage", data);
                  // Navigation is now handled by onReverify callback
                }
                
                if (type === 'VOUCHED_CAMERA') {
                  console.log("Reverification camera status", data);
                }
                
                if (type === 'VOUCHED_ERROR') {
                  console.error('Vouched reverification error', data);
                  console.error('Error details:', JSON.stringify(data, null, 2));
                }
              };
              
              window.addEventListener('message', messageHandler);
              
              // Store handler for cleanup
              (window as Window & { _vouchedReverifyMessageHandler?: typeof messageHandler })._vouchedReverifyMessageHandler = messageHandler;

              console.log('Creating Vouched reverification instance with config:', vouchedConfig);
              
              // Create the Vouched instance
              const vouchedInstance = window.Vouched(vouchedConfig);
              vouchedInstanceRef.current = vouchedInstance;
              
              console.log('About to mount Vouched to #vouched-element...');
              vouchedInstance.mount('#vouched-element');
              console.log('Vouched reverification mount called successfully');
              
              // Add a timeout to check if mounting actually worked
              setTimeout(() => {
                const iframeCheck = document.querySelector('#vouched-element iframe');
                if (iframeCheck) {
                  console.log('✅ Vouched reverification iframe found and mounted:', iframeCheck);
                } else {
                  console.log('❌ Vouched reverification iframe NOT found after mounting');
                }
              }, 3000);
              
            } catch (error) {
              console.error('Error creating Vouched reverification instance:', error);
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
          console.log('Vouched object not available after script load');
        }
      }, 500);
    };

    script.onerror = () => {
      console.error('Failed to load Vouched script');
    };

    // Add script to document head
    document.head.appendChild(script);

    // Cleanup function    
    return () => {
      // Cleanup message listener
      const windowWithHandler = window as Window & { _vouchedReverifyMessageHandler?: (event: MessageEvent) => void };
      if (windowWithHandler._vouchedReverifyMessageHandler) {
        window.removeEventListener('message', windowWithHandler._vouchedReverifyMessageHandler);
        delete windowWithHandler._vouchedReverifyMessageHandler;
      }
      
      // Cleanup Vouched instance properly
      if (vouchedInstanceRef.current) {
        try {
          console.log("Cleaning up reverification Vouched instance on unmount");
          // If there's an unmount method, call it
          if (typeof vouchedInstanceRef.current.unmount === 'function') {
            vouchedInstanceRef.current.unmount();
          }
          // If there's a destroy method, call it
          if (typeof vouchedInstanceRef.current.destroy === 'function') {
            vouchedInstanceRef.current.destroy();
          }
        } catch (error) {
          console.error('Error cleaning up reverification Vouched:', error);
        }
        vouchedInstanceRef.current = null;
      }
      
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array - run once on mount - intentionally ignoring originalJobId to prevent re-initialization

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-indigo-950 dark:via-slate-900 dark:to-purple-950">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <PageHeader pageTitle="Identity Reverification" />
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Identity Reverification
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            {isPhoneView 
              ? 'Complete reverification on your mobile device' 
              : 'Complete reverification on desktop, then use your mobile device'
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
                        Identity Reverification
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

        {/* Back Button */}
        <div className="text-center mt-8">
          <button 
            onClick={() => window.history.back()}
            className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium"
          >
            ← Back to Login
          </button>
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

export default function ReverificationVerifyPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-indigo-950 dark:via-slate-900 dark:to-purple-950 flex items-center justify-center">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
    </div>}>
      <ReverificationVerifyContent />
    </Suspense>
  );
} 