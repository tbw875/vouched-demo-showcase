'use client';

import { useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import PageHeader from '../../components/PageHeader';
import { VouchedConfig as VouchedSDKConfig, VouchedJob, VouchedInstance, VouchedMessageEvent } from '@/types/vouched';

function ReverificationVerifyContent() {
  const searchParams = useSearchParams();
  const vouchedInstanceRef = useRef<VouchedInstance | null>(null);

  const originalJobId = searchParams.get('originalJobId');

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
              appId: process.env.NEXT_PUBLIC_VOUCHED_APP_ID!,

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
      <div className="page-container max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="page-header">
          <PageHeader pageTitle="Identity Reverification" />
        </div>

        <div className="page-title text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Identity Reverification
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Complete reverification to verify your identity
          </p>
        </div>

        {/* Verification Container */}
        <div className="w-full flex justify-center items-center">
          <div className="verification-wrapper">
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
                      Identity Reverification
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
          height: 60vh;
          width: 95vw;
          min-height: 500px;
          min-width: 1000px;
          max-height: 700px;
          max-width: 1600px;
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
          min-width: 1000px;
          min-height: 500px;
        }

        /* Tablet adjustments */
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

export default function ReverificationVerifyPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-indigo-950 dark:via-slate-900 dark:to-purple-950 flex items-center justify-center">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
    </div>}>
      <ReverificationVerifyContent />
    </Suspense>
  );
} 