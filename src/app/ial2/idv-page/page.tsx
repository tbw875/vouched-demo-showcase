'use client';

import React, { useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import PageHeader from '@/app/components/PageHeader';
import { VouchedConfig as VouchedSDKConfig, VouchedJob, VouchedInstance } from '@/types/vouched';

interface FormData {
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  dateOfBirth?: string;
  ipAddress?: string;
}

function IAL2IDVPageContent() {
  const searchParams = useSearchParams();
  const vouchedInstanceRef = useRef<VouchedInstance | null>(null);

  const reverificationEnabled = searchParams.get('reverification') === 'true';
  const useCaseContext = searchParams.get('useCase') || 'ial2';

  // Parse form data from URL params
  const formData: FormData = searchParams.get('formData')
    ? JSON.parse(searchParams.get('formData')!)
    : {};

  // Initialize Vouched JS Plugin
  useEffect(() => {
    if (vouchedInstanceRef.current) return;

    const script = document.createElement('script');
    script.src = 'https://static.vouched.id/plugin/releases/latest/index.js';
    script.async = true;

    script.onload = () => {
      console.log('IAL2 IDV: Vouched script loaded');

      setTimeout(() => {
        if (window.Vouched) {
          const initializeVouched = () => {
            const element = document.getElementById('vouched-element');
            if (!element) {
              setTimeout(initializeVouched, 100);
              return;
            }

            console.log('IAL2 IDV: Initializing Vouched...');

            const verificationData: Record<string, string | boolean> = {};
            if (formData.firstName) verificationData.firstName = formData.firstName;
            if (formData.lastName) verificationData.lastName = formData.lastName;
            if (formData.phone) verificationData.phone = formData.phone;
            if (formData.email) verificationData.email = formData.email;
            if (formData.ipAddress) verificationData.ipAddress = formData.ipAddress;
            if (formData.dateOfBirth) {
              // Vouched expects MM/DD/YYYY; HTML date input returns YYYY-MM-DD
              const [year, month, day] = formData.dateOfBirth.split('-');
              verificationData.birthDate = `${month}/${day}/${year}`;
            }

            if (!verificationData.firstName && !verificationData.lastName) {
              verificationData.firstName = '';
              verificationData.lastName = '';
            }

            // IAL2: always enable Driver's License Validation
            const vouchedConfig: VouchedSDKConfig = {
              appId: process.env.NEXT_PUBLIC_VOUCHED_APP_ID!,

              verification: {
                firstName: (typeof verificationData.firstName === 'string' ? verificationData.firstName : '') || '',
                lastName: (typeof verificationData.lastName === 'string' ? verificationData.lastName : '') || '',
                email: (typeof verificationData.email === 'string' ? verificationData.email : '') || '',
                phone: (typeof verificationData.phone === 'string' ? verificationData.phone : '') || '',
                ...(typeof verificationData.birthDate === 'string' && verificationData.birthDate && { birthDate: verificationData.birthDate }),
                enableCrossCheck: false,
                // IAL2 requires Driver's License Validation
                enableDriversLicenseValidation: true,
              },

              callbackURL: `${window.location.origin}/api/vouched-webhook`,

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

              theme: {
                name: 'avant',
              },

              dobVerification: false,
              enableAML: false,

              nist: {
                ial2ComplianceEnabled: true,
              },

              debug: true,

              onDone: (job: VouchedJob) => {
                console.log('IAL2 IDV: Job completed:', job);

                // Store job data for dashboard to read
                localStorage.setItem('ial2JobData', JSON.stringify({
                  timestamp: new Date().toISOString(),
                  data: job
                }));
                localStorage.setItem('latestJobData', JSON.stringify({
                  timestamp: new Date().toISOString(),
                  data: job
                }));

                // Route to dashboard — IAL2 does not use webhook polling
                const dashboardParams = new URLSearchParams({
                  useCase: useCaseContext,
                  reverification: reverificationEnabled.toString(),
                });
                window.location.href = `/dashboard?${dashboardParams.toString()}`;
              }
            };

            console.log('IAL2 IDV: Vouched config:', JSON.stringify(vouchedConfig, null, 2));

            try {
              const vouchedInstance = window.Vouched(vouchedConfig);
              vouchedInstanceRef.current = vouchedInstance;
              vouchedInstance.mount('#vouched-element');
              console.log('IAL2 IDV: Vouched mounted successfully');
            } catch (error) {
              console.error('IAL2 IDV: Error initializing Vouched:', error);
            }
          };

          initializeVouched();
        } else {
          console.error('IAL2 IDV: Vouched library not available after script load');
        }
      }, 500);
    };

    script.onerror = () => {
      console.error('IAL2 IDV: Failed to load Vouched script');
    };

    document.head.appendChild(script);

    return () => {
      if (vouchedInstanceRef.current?.unmount) {
        try {
          vouchedInstanceRef.current.unmount();
        } catch (error) {
          console.error('IAL2 IDV: Error unmounting:', error);
        }
      }
      vouchedInstanceRef.current = null;

      const existingScript = document.querySelector('script[src="https://static.vouched.id/plugin/releases/latest/index.js"]');
      if (existingScript) existingScript.remove();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-purple-50 dark:from-violet-950 dark:via-slate-900 dark:to-purple-950">
      <div className="page-container max-w-none mx-auto px-6 py-12">
        {/* Header */}
        <div className="page-header">
          <PageHeader />
        </div>

        {/* Page Title */}
        <div className="page-title text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 px-4 py-1.5 rounded-full text-sm font-semibold mb-4">
            IAL-2 Compliant Workflow
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            IAL2 Verification — ID + Driver&apos;s License
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Step 2 of 2: Visual IDV with Driver&apos;s License Validation
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="progress-indicator mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold text-white bg-green-500">
                ✓
              </div>
              <span className="ml-3 text-sm font-medium text-green-600 dark:text-green-400">CrossCheck</span>
            </div>
            <div className="flex-1 mx-4 h-1 rounded bg-green-400"></div>
            <div className="flex items-center">
              <div className="flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold text-white bg-violet-600">
                2
              </div>
              <span className="ml-3 text-sm font-medium text-violet-600 dark:text-violet-400">ID + DL Verification</span>
            </div>
          </div>
        </div>

        {/* DL Verification callout */}
        <div className="mb-6 bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 rounded-xl p-4 flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            <svg className="h-5 w-5 text-violet-600 dark:text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-violet-900 dark:text-violet-100">Driver&apos;s License Validation enabled</p>
            <p className="text-xs text-violet-700 dark:text-violet-300 mt-0.5">
              This session verifies: ID Authenticity · Selfie Authenticity · DL Number Authenticity
            </p>
          </div>
        </div>

        {/* Verification Interface */}
        <div className="flex flex-col items-center">
          <div className="verification-wrapper w-full max-w-none">
            <div className="verification-card bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="desktop-frame bg-gray-100 dark:bg-gray-700 px-6 py-4 border-b border-gray-200 dark:border-gray-600">
                <div className="flex items-center gap-3">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  </div>
                  <div className="flex-1 text-center">
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      IAL2 Identity Verification
                    </span>
                  </div>
                </div>
              </div>

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

        @media (max-width: 768px) {
          :global(html),
          :global(body) {
            height: 100%;
            overflow: hidden;
          }

          .page-container {
            padding: 0 !important;
            max-width: 100% !important;
            height: 100%;
          }

          .page-header { display: none; }
          .page-title { display: none; }
          .progress-indicator { display: none; }

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

          .desktop-frame { display: none; }

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

export default function IAL2IDVPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-purple-50 dark:from-violet-950 dark:via-slate-900 dark:to-purple-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-violet-600"></div>
      </div>
    }>
      <IAL2IDVPageContent />
    </Suspense>
  );
}
