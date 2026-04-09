'use client';

import { useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { VouchedConfig as VouchedSDKConfig, VouchedJob, VouchedInstance } from '@/types/vouched';

interface EpicFormData {
  firstName?: string;
  lastName?: string;
  phone?: string;
  dateOfBirth?: string; // YYYY-MM-DD
  email?: string;
}

function EpicVerificationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const crosscheckReferenceId = searchParams.get('crosscheckReferenceId') || undefined;
  const vouchedInstanceRef = useRef<VouchedInstance | null>(null);

  useEffect(() => {
    if (vouchedInstanceRef.current) return;

    let formData: EpicFormData = {};
    try {
      formData = JSON.parse(localStorage.getItem('epicFormData') || '{}');
    } catch {
      // ignore
    }

    const script = document.createElement('script');
    script.src = 'https://static.vouched.id/plugin/releases/latest/index.js';
    script.async = true;

    script.onload = () => {
      setTimeout(() => {
        if (!window.Vouched) return;

        const initializeVouched = () => {
          const element = document.getElementById('vouched-element');
          if (!element) {
            setTimeout(initializeVouched, 100);
            return;
          }

          // Format birthDate as MM/DD/YYYY for Vouched
          let birthDate: string | undefined;
          if (formData.dateOfBirth) {
            const [year, month, day] = formData.dateOfBirth.split('-');
            birthDate = `${month}/${day}/${year}`;
          }

          const vouchedConfig: VouchedSDKConfig = {
            appId: process.env.NEXT_PUBLIC_VOUCHED_APP_ID!,
            type: 'idv',
            verification: {
              firstName: formData.firstName || '',
              lastName: formData.lastName || '',
              email: formData.email || '',
              phone: formData.phone || '',
              ...(birthDate && { birthDate }),
              enableCrossCheck: false,
              enableDriversLicenseValidation: true,
              ...(crosscheckReferenceId && { crosscheckReferenceId }),
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
            theme: { name: 'avant' },
            dobVerification: false,
            enableAML: false,
            debug: true,
            onDone: (job: VouchedJob) => {
              localStorage.setItem('latestJobData', JSON.stringify({
                timestamp: new Date().toISOString(),
                data: job,
              }));
              localStorage.setItem('epicJobData', JSON.stringify(job));
              if (vouchedInstanceRef.current?.unmount) {
                try { vouchedInstanceRef.current.unmount(); } catch { /* ignore */ }
                vouchedInstanceRef.current = null;
              }
              router.push('/epic/complete');
            },
          };

          try {
            const instance = window.Vouched(vouchedConfig);
            vouchedInstanceRef.current = instance;
            instance.mount('#vouched-element');
          } catch (err) {
            console.error('Error initializing Vouched:', err);
          }
        };

        initializeVouched();
      }, 500);
    };

    script.onerror = () => console.error('Failed to load Vouched script');
    document.head.appendChild(script);

    return () => {
      if (vouchedInstanceRef.current?.unmount) {
        try { vouchedInstanceRef.current.unmount(); } catch { /* ignore */ }
      }
      vouchedInstanceRef.current = null;
      const existing = document.querySelector('script[src="https://static.vouched.id/plugin/releases/latest/index.js"]');
      if (existing) existing.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="relative flex flex-col min-h-screen bg-white">
      {/* Simulated URL bar — consistent across all Epic flow pages */}
      <div className="bg-gray-50 border-b border-gray-200 px-4 py-2 text-center text-xs text-gray-400 tracking-wide shrink-0">
        epic.stage.vouched.id
      </div>

      {/* SDK fills remaining height, scoped inside the phone card */}
      <div className="flex-1 relative">
        <div className="vouched-wrapper">
          <div id="vouched-element" className="vouched-element" />
        </div>
      </div>

      <style jsx>{`
        .vouched-wrapper {
          position: absolute;
          inset: 0;
          background: white;
        }

        .vouched-element {
          width: 100%;
          height: 100%;
        }

        .vouched-element iframe {
          border: none;
          width: 100%;
          height: 100%;
        }
      `}</style>
    </div>
  );
}

export default function EpicVerificationPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    }>
      <EpicVerificationContent />
    </Suspense>
  );
}
