'use client';

import { useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import PageHeader from '../../components/PageHeader';

// Vouched global is already declared elsewhere

function ReverificationVerifyContent() {
  const searchParams = useSearchParams();
  const vouchedInstanceRef = useRef<Record<string, unknown> | null>(null);
  
  const email = searchParams.get('email');
  const originalJobId = searchParams.get('originalJobId');

  // Initialize Vouched JS Plugin for Reverification
  useEffect(() => {
    // Don't initialize if already initialized
    if (vouchedInstanceRef.current) {
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://static.vouched.id/widget/vouched-2.0.0.js';
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
              return;
            }
            
            console.log('Vouched element found, creating reverification configuration...');
            
            // Configure Vouched for Reverification following working pattern
            const vouchedConfig = {
              // The exact App ID that works
              appId: "wYd4PAXW3W2~xHNRx~-cdUpFl!*SFs",

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

              // Add debug mode to get detailed error information
              debug: true
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
              const messageHandler = (event: MessageEvent) => {
                // Only listen to messages from Vouched
                if (event.origin !== 'https://static.vouched.id') return;
                
                console.log('Received reverification message from Vouched:', event.data);
                
                const { type, data } = event.data;
                
                if (type === 'VOUCHED_INIT') {
                  console.log('Reverification onInit called:', data);
                  console.log('Job ID:', data?.id);
                  console.log('Job Token:', data?.token);
                  console.log('Job Status:', data?.status);
                }
                
                if (type === 'VOUCHED_REVERIFY' || type === 'VOUCHED_DONE') {
                  const job = data;
                  console.log("Reverification complete", { 
                    token: job?.token,
                    success: job?.result?.success,
                    jobId: job?.id,
                    fullJob: job
                  });

                  // Store the job data locally so we can show it immediately
                  try {
                    localStorage.setItem('latestJobData', JSON.stringify({
                      timestamp: new Date().toISOString(),
                      data: job
                    }));
                    console.log("Reverification job data stored locally for immediate display");
                  } catch (err) {
                    console.warn("Could not store reverification job data:", err);
                  }

                  // The webhook will also receive this same job information
                  console.log("Webhook should be triggered with reverification data");
                  console.log("Webhook URL:", `${window.location.origin}/api/vouched-webhook`);

                  // Navigate to reverification results page
                  const params = new URLSearchParams({
                    token: job?.token || '',
                    originalJobId: originalJobId || '',
                    email: email || ''
                  });

                  setTimeout(() => {
                    console.log("Redirecting to reverification results page...");
                    window.location.href = `/reverification/results?${params.toString()}`;
                  }, 1500); // 1.5 second delay to allow webhook to arrive
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
              (window as any)._vouchedReverifyMessageHandler = messageHandler;

              console.log('Creating Vouched reverification instance with config:', vouchedConfig);
              
              // Create the Vouched instance
              const vouchedInstance = window.Vouched(vouchedConfig);
              vouchedInstance.mount('#vouched-element');
              vouchedInstanceRef.current = vouchedInstance;
              
              console.log('Vouched reverification instance created successfully');
            } catch (error) {
              console.error('Error creating Vouched reverification instance:', error);
            }
          };

          // Try to initialize immediately, or wait for element
          initializeVouched();
          
          // If element not found, try again after a short delay
          if (!document.getElementById('vouched-element')) {
            setTimeout(initializeVouched, 500);
          }
        } else {
          console.log('Vouched object not available after script load');
        }
      }, 100);
    };

    script.onerror = () => {
      console.error('Failed to load Vouched script');
    };

    // Add script to document head
    document.head.appendChild(script);

    // Cleanup function
    return () => {
      // Cleanup message listener
      if ((window as any)._vouchedReverifyMessageHandler) {
        window.removeEventListener('message', (window as any)._vouchedReverifyMessageHandler);
        delete (window as any)._vouchedReverifyMessageHandler;
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
      
      try {
        document.head.removeChild(script);
      } catch (error) {
        // Script might already be removed
      }
    };

  }, []); // Empty dependency array - run once on mount

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 dark:from-purple-950 dark:via-slate-900 dark:to-indigo-950">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <PageHeader pageTitle="Reverification" />

        {/* Verification Info */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Identity Reverification
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-6">
            Please complete the reverification process to compare against your original verification.
          </p>
          
          {/* User Info Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 mb-8 max-w-md mx-auto">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Verification Details
            </h3>
            <div className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
              <p><span className="font-medium">Email:</span> {email}</p>
              <p><span className="font-medium">Original Job ID:</span> {originalJobId?.substring(0, 20)}...</p>
              <p><span className="font-medium">Match Type:</span> Selfie Comparison</p>
            </div>
          </div>
        </div>

        {/* Vouched Container */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div id="vouched-element" className="min-h-[600px] flex items-center justify-center">
            <div className="text-center p-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-300 font-medium">
                Loading Reverification Interface...
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                Please wait while we prepare your reverification session
              </p>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-purple-50 dark:bg-purple-900/20 rounded-xl p-6 border border-purple-200 dark:border-purple-700">
          <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-200 mb-3">
            Reverification Instructions
          </h3>
          <ul className="text-sm text-purple-700 dark:text-purple-300 space-y-2">
            <li>• This process will compare your new selfie with your original verification</li>
            <li>• Ensure you are in good lighting and your face is clearly visible</li>
            <li>• The system will analyze facial features to confirm your identity</li>
            <li>• Results will be available immediately after completion</li>
          </ul>
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

      {/* Custom styles for Vouched */}
      <style>{`
        #vouched-element {
          border-radius: 0;
        }
        
        /* Responsive adjustments for Vouched widget */
        @media (max-width: 768px) {
          #vouched-element {
            min-height: 500px;
          }
        }
        
        /* Dark mode adjustments */
        .dark #vouched-element {
          background-color: #1f2937;
        }
      `}</style>
    </div>
  );
}

export default function ReverificationVerifyPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 dark:from-purple-950 dark:via-slate-900 dark:to-indigo-950 flex items-center justify-center">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
    </div>}>
      <ReverificationVerifyContent />
    </Suspense>
  );
} 