'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircleIcon, XCircleIcon, ChevronRightIcon, ClockIcon } from '@heroicons/react/24/outline';
import { CrossCheckApiResponse, isCrossCheckVerificationResponse } from '@/types/crosscheck-api';

interface EpicFormData {
  firstName?: string;
  lastName?: string;
  phone?: string;
  dateOfBirth?: string;
  email?: string;
}

function EpicHeart({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} xmlns="http://www.w3.org/2000/svg">
      <path
        d="M50 85 C50 85 10 60 10 35 C10 20 22 10 35 10 C42 10 48 14 50 18 C52 14 58 10 65 10 C78 10 90 20 90 35 C90 60 50 85 50 85Z"
        fill="#E05252"
      />
      <path
        d="M18 45 L30 45 L35 35 L40 55 L45 40 L50 45 L55 45 L60 38 L65 50 L70 45 L82 45"
        fill="none"
        stroke="white"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Simulated MyChart loading screen shown in the left phone card while CrossCheck runs
function EpicLoadingScreen() {
  return (
    <div className="w-full max-w-[390px] h-[680px] max-h-[calc(100dvh-16rem)] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        <div className="flex items-center gap-3 px-3 py-2 bg-gray-100 border-b border-gray-200 shrink-0">
          <div className="flex items-center justify-center w-7 h-7 rounded-full bg-white border border-gray-200 text-gray-500 text-sm">
            ✕
          </div>
          <div className="flex-1 bg-white rounded-lg px-3 py-1.5 text-xs text-gray-700 font-medium border border-gray-200 flex items-center gap-2">
            <span className="text-gray-400">🔒</span>
            vendorservices.epic.com
            <div className="ml-auto w-3/4 h-0.5 bg-blue-500 rounded-full animate-pulse" />
          </div>
          <div className="flex items-center justify-center w-7 h-7 rounded-full bg-white border border-gray-200 text-gray-400 text-sm">
            ⋮
          </div>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <EpicHeart className="w-20 h-20 animate-pulse" />
          <p className="text-sm text-gray-500">Please wait a moment...</p>
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-400" />
        </div>
    </div>
  );
}

const JsonDisplay = ({ data, title }: { data: unknown; title: string }) => {
  if (!data) return <div className="text-gray-500 italic text-sm">Waiting for {title.toLowerCase()}...</div>;
  const jsonString = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
  return (
    <div className="bg-gray-900 rounded-lg p-4 overflow-auto">
      <pre className="text-sm text-gray-100 whitespace-pre-wrap break-words">
        <code>{jsonString}</code>
      </pre>
    </div>
  );
};

export default function EpicCrossCheckPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<EpicFormData>({});
  const [isLoading, setIsLoading] = useState(false);
  const [verificationResult, setVerificationResult] = useState<CrossCheckApiResponse | null>(null);
  const [verificationError, setVerificationError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const data = JSON.parse(localStorage.getItem('epicFormData') || '{}');
      setFormData(data);
    } catch { /* ignore */ }
  }, []);

  // Auto-fire CrossCheck once form data is loaded
  useEffect(() => {
    if (formData.firstName && formData.lastName && formData.phone) {
      performCrossCheck(formData);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.firstName]);

  const performCrossCheck = async (data: EpicFormData) => {
    if (!data.firstName || !data.lastName || !data.phone) return;
    setIsLoading(true);
    setVerificationError(null);
    try {
      const response = await fetch('/api/healthcare/crosscheck-route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone,
          ...(data.email && { email: data.email }),
        }),
      });
      const result: CrossCheckApiResponse = await response.json();
      if (!response.ok) {
        const errorMsg = 'error' in result ? result.error : 'Unknown error';
        throw new Error(`CrossCheck failed: ${errorMsg}`);
      }
      setVerificationResult(result);
      if (isCrossCheckVerificationResponse(result)) {
        localStorage.setItem('epicCrossCheckResult', JSON.stringify({
          timestamp: new Date().toISOString(),
          data: result,
        }));
      }
    } catch (error) {
      setVerificationError(error instanceof Error ? error.message : 'CrossCheck verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinue = () => {
    const params = new URLSearchParams();
    if (verificationResult && isCrossCheckVerificationResponse(verificationResult)) {
      params.set('crosscheckReferenceId', verificationResult.id);
    }
    router.push(`/epic/verification?${params.toString()}`);
  };

  const canContinue = !isLoading && (!!verificationResult || !!verificationError);

  const phoneMatch = verificationResult && isCrossCheckVerificationResponse(verificationResult)
    ? verificationResult.result.phone?.isMatch ?? null
    : null;
  const emailMatch = verificationResult && isCrossCheckVerificationResponse(verificationResult)
    ? verificationResult.result.email?.isMatch ?? null
    : null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center gap-3">
          <EpicHeart className="w-8 h-8" />
          <div>
            <h1 className="text-lg font-bold text-gray-900">Epic MyChart IAL-2</h1>
            <p className="text-xs text-gray-500">Step 1 of 2 — CrossCheck Verification</p>
          </div>
          <div className="ml-auto">
            <span className="inline-flex items-center gap-1.5 bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-semibold">
              IAL-2 Compliant
            </span>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="bg-white border-b border-gray-100 px-6 py-3">
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-7 h-7 rounded-full text-sm font-semibold text-white bg-red-600">1</div>
            <span className="text-sm font-medium text-red-600">CrossCheck</span>
          </div>
          <div className="flex-1 h-1 bg-gray-200 rounded">
            <div className="h-1 rounded bg-red-400" style={{ width: '50%' }} />
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-7 h-7 bg-gray-200 text-gray-500 rounded-full text-sm font-semibold">2</div>
            <span className="text-sm font-medium text-gray-400">ID + DL Verification</span>
          </div>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 xl:grid-cols-[420px_1fr] gap-8 items-start">

          {/* Left: simulated MyChart loading screen */}
          <div>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">MyChart Patient Experience</h2>
            <div className="flex justify-center xl:justify-start">
              <EpicLoadingScreen />
            </div>
          </div>

          {/* Right: CrossCheck API response */}
          <div className="bg-white rounded-2xl shadow border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-900">CrossCheck API Response</h2>
              {isLoading && (
                <span className="flex items-center gap-1.5 text-xs text-gray-400">
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-red-500" />
                  Running...
                </span>
              )}
            </div>

            <div className="p-6 space-y-4">
              {/* Match result callouts */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: 'phone', label: 'phone.isMatch', value: phoneMatch },
                  { key: 'email', label: 'email.isMatch', value: emailMatch },
                ].map(({ key, label, value }) => (
                  <div key={key} className={`flex items-center gap-3 p-3 rounded-xl border-2 ${
                    value === true ? 'border-green-400 bg-green-50'
                    : value === false ? 'border-red-400 bg-red-50'
                    : 'border-gray-200 bg-gray-50'
                  }`}>
                    {value === true && <CheckCircleIcon className="h-5 w-5 text-green-500 shrink-0" />}
                    {value === false && <XCircleIcon className="h-5 w-5 text-red-500 shrink-0" />}
                    {value === null && (
                      isLoading
                        ? <ClockIcon className="h-5 w-5 text-gray-400 animate-spin shrink-0" />
                        : <ClockIcon className="h-5 w-5 text-gray-300 shrink-0" />
                    )}
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">{label}</p>
                      <p className="text-sm font-semibold text-gray-800">
                        {value === true ? 'Match' : value === false ? 'No Match' : '—'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Continue button */}
              <button
                onClick={handleContinue}
                disabled={!canContinue}
                className={`w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  !canContinue
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-red-600 hover:bg-red-700 text-white shadow-md hover:shadow-lg'
                }`}
              >
                Continue to ID + DL Verification
                <ChevronRightIcon className="h-4 w-4" />
              </button>
              {!verificationResult && !verificationError && !isLoading && (
                <p className="text-center text-xs text-gray-400">CrossCheck will run automatically</p>
              )}

              {/* Full JSON response */}
              <JsonDisplay
                data={
                  isLoading ? 'Running CrossCheck...' :
                  verificationError ? { error: verificationError } :
                  verificationResult ?? null
                }
                title="response"
              />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
