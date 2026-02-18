'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ChevronRightIcon, CheckCircleIcon, XCircleIcon, ClockIcon } from '@heroicons/react/24/outline';
import PageHeader from '@/app/components/PageHeader';
import { CrossCheckVerificationRequest, CrossCheckApiResponse, isCrossCheckVerificationResponse } from '@/types/crosscheck-api';

interface VouchedConfig {
  flowType: 'desktop' | 'phone';
  workflowType: 'simultaneous' | 'step-up';
  enabledProducts: string[];
  disabledProducts: string[];
  ssnMode: 'off' | 'last4' | 'full9';
}

interface FormData {
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  ipAddress?: string;
  dateOfBirth?: string;
}

interface CrossCheckElement {
  label: string;
  key: string;
  description: string;
}

const IAL2_CROSSCHECK_ELEMENTS: CrossCheckElement[] = [
  { label: 'Phone Validity', key: 'phoneValid', description: 'Phone number is a real, active number' },
  { label: 'Phone Match', key: 'phoneMatch', description: 'Phone number matches the provided identity' },
  { label: 'Email Validity', key: 'emailValid', description: 'Email address is a real, active address' },
  { label: 'Email Match', key: 'emailMatch', description: 'Email address matches the provided identity' },
];

function IAL2CrossCheckPageContent() {
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [verificationResult, setVerificationResult] = useState<CrossCheckApiResponse | null>(null);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [requestData, setRequestData] = useState<CrossCheckVerificationRequest | null>(null);

  // Parse configuration from URL params
  const config: VouchedConfig = {
    flowType: (searchParams.get('flow') as 'desktop' | 'phone') || 'desktop',
    workflowType: (searchParams.get('workflow') as 'simultaneous' | 'step-up') || 'step-up',
    enabledProducts: searchParams.get('products')?.split(',').filter(p => p) || ['crosscheck'],
    disabledProducts: searchParams.get('disabledProducts')?.split(',').filter(p => p) || [],
    ssnMode: (searchParams.get('ssnMode') as 'off' | 'last4' | 'full9') || 'off'
  };

  const reverificationEnabled = searchParams.get('reverification') === 'true';
  const useCaseContext = searchParams.get('useCase') || 'ial2';

  // Parse form data from URL params
  const formData: FormData = searchParams.get('formData')
    ? JSON.parse(searchParams.get('formData')!)
    : {};

  // JSON display component
  const JsonDisplay = ({ data, title }: { data: unknown; title: string }) => {
    if (!data) return <div className="text-gray-500 italic">Waiting for {title.toLowerCase()}...</div>;

    const jsonString = typeof data === 'string' ? data : JSON.stringify(data, null, 2);

    return (
      <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto max-w-none">
        <pre className="text-sm text-gray-100 whitespace-pre-wrap break-words">
          <code className="language-json">{jsonString}</code>
        </pre>
      </div>
    );
  };

  // Auto-start CrossCheck verification when component mounts
  useEffect(() => {
    if (formData.firstName && formData.lastName && formData.phone) {
      performCrossCheckVerification();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount

  const performCrossCheckVerification = async () => {
    if (!formData.firstName || !formData.lastName || !formData.phone) {
      setVerificationError('Missing required data for CrossCheck verification');
      return;
    }

    setIsLoading(true);
    setVerificationError(null);

    const crossCheckRequest: CrossCheckVerificationRequest = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      phone: formData.phone,
      ...(formData.email && { email: formData.email }),
      ...(formData.ipAddress && { ipAddress: formData.ipAddress }),
    };

    setRequestData(crossCheckRequest);

    try {
      console.log('IAL2: Starting CrossCheck verification...');

      const response = await fetch('/api/healthcare/crosscheck-route', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(crossCheckRequest),
      });

      const result: CrossCheckApiResponse = await response.json();

      if (!response.ok) {
        const errorMsg = 'error' in result ? result.error : 'Unknown error';
        throw new Error(`CrossCheck verification failed: ${errorMsg}`);
      }

      console.log('IAL2: CrossCheck verification completed:', result);
      setVerificationResult(result);

      if (isCrossCheckVerificationResponse(result)) {
        localStorage.setItem('ial2CrossCheckResult', JSON.stringify({
          timestamp: new Date().toISOString(),
          data: result
        }));
      }

    } catch (error) {
      console.error('IAL2: CrossCheck verification error:', error);
      const errorMessage = error instanceof Error ? error.message : 'CrossCheck verification failed';
      setVerificationError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinueToIDV = () => {
    // Build products list ensuring drivers-license-verification is included for IAL2
    const products = [...config.enabledProducts];
    if (!products.includes('drivers-license-verification')) {
      products.push('drivers-license-verification');
    }

    const params = new URLSearchParams({
      flow: config.flowType,
      workflow: config.workflowType,
      products: products.join(','),
      formData: JSON.stringify(formData),
      reverification: reverificationEnabled.toString(),
      useCase: useCaseContext
    });

    window.location.href = `/ial2/idv-page?${params.toString()}`;
  };

  const getStatusIcon = () => {
    if (isLoading) return <ClockIcon className="h-6 w-6 text-yellow-500 animate-spin" />;
    if (verificationError) return <XCircleIcon className="h-6 w-6 text-red-500" />;
    if (verificationResult && isCrossCheckVerificationResponse(verificationResult)) {
      return <CheckCircleIcon className="h-6 w-6 text-green-500" />;
    }
    return <ClockIcon className="h-6 w-6 text-gray-400" />;
  };

  const getStatusText = () => {
    if (isLoading) return 'Processing CrossCheck verification...';
    if (verificationError) return 'Verification failed';
    if (verificationResult && isCrossCheckVerificationResponse(verificationResult)) {
      return 'Verification complete';
    }
    return 'Ready to verify';
  };

  // Derive individual check results from the CrossCheck response.
  // The API returns result.phone.isValid, result.phone.isMatch, etc.
  const getCheckResult = (checkKey: string): boolean | null => {
    if (!verificationResult || !isCrossCheckVerificationResponse(verificationResult)) return null;
    const { phone, email } = verificationResult.result;

    switch (checkKey) {
      case 'phoneValid':
        return phone !== null ? phone.isValid : null;
      case 'phoneMatch':
        return phone !== null ? phone.isMatch : null;
      case 'emailValid':
        return email !== null ? email.isValid : null;
      case 'emailMatch':
        return email !== null ? email.isMatch : null;
      default:
        return null;
    }
  };

  const canContinue = !isLoading && (!!verificationResult || !!verificationError);

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-purple-50 dark:from-violet-950 dark:via-slate-900 dark:to-purple-950">
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <PageHeader />

        {/* Page Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 px-4 py-1.5 rounded-full text-sm font-semibold mb-4">
            IAL-2 Compliant Workflow
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            IAL2 Verification — CrossCheck
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Step 1 of 2: Verifying identity via Vouched CrossCheck API
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold text-white bg-violet-600">
                1
              </div>
              <span className="ml-3 text-sm font-medium text-violet-600 dark:text-violet-400">CrossCheck</span>
            </div>
            <div className="flex-1 mx-4 h-1 bg-gray-200 rounded">
              <div className="h-1 rounded bg-violet-400" style={{ width: '50%' }}></div>
            </div>
            <div className="flex items-center">
              <div className="flex items-center justify-center w-8 h-8 bg-gray-300 text-gray-600 rounded-full text-sm font-semibold">
                2
              </div>
              <span className="ml-3 text-sm font-medium text-gray-500">ID + DL Verification</span>
            </div>
          </div>
        </div>

        {/* IAL2 Checks Callout */}
        <div className="mb-8 bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-violet-900 dark:text-violet-100 mb-4">
            CrossCheck Validates
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {IAL2_CROSSCHECK_ELEMENTS.map((element) => {
              const result = getCheckResult(element.key);
              return (
                <div
                  key={element.key}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    result === true
                      ? 'border-green-400 bg-green-50 dark:bg-green-900/20'
                      : result === false
                      ? 'border-red-400 bg-red-50 dark:bg-red-900/20'
                      : 'border-violet-200 dark:border-violet-700 bg-white dark:bg-violet-900/10'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      {element.label}
                    </span>
                    {result === true && <CheckCircleIcon className="h-5 w-5 text-green-500" />}
                    {result === false && <XCircleIcon className="h-5 w-5 text-red-500" />}
                    {result === null && isLoading && <ClockIcon className="h-5 w-5 text-violet-400 animate-spin" />}
                    {result === null && !isLoading && !verificationResult && <ClockIcon className="h-5 w-5 text-gray-300" />}
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">{element.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Continue Button */}
        <div className="mb-8 text-center">
          <button
            onClick={handleContinueToIDV}
            disabled={!canContinue}
            className={`inline-flex items-center px-8 py-4 rounded-xl text-lg font-semibold transition-all duration-200 ${
              !canContinue
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-violet-600 hover:bg-violet-700 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-1'
            }`}
          >
            Continue to ID + DL Verification
            <ChevronRightIcon className="ml-2 h-5 w-5" />
          </button>

          {!verificationResult && !verificationError && !isLoading && (
            <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
              CrossCheck verification will start automatically
            </p>
          )}
        </div>

        {/* Request / Response Panels */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Request Panel */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                CrossCheck API Request
              </h3>
            </div>
            <div className="p-6">
              <JsonDisplay
                data={requestData ? {
                  endpoint: '/api/healthcare/crosscheck-route',
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: {
                    ...requestData,
                    phone: requestData.phone ? `***${requestData.phone.slice(-4)}` : undefined
                  }
                } : null}
                title="request"
              />
            </div>
          </div>

          {/* Response Panel */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  CrossCheck API Response
                </h3>
                <div className="flex items-center space-x-2">
                  {getStatusIcon()}
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {getStatusText()}
                  </span>
                </div>
              </div>
            </div>
            <div className="p-6">
              <JsonDisplay
                data={isLoading ? 'Processing...' :
                      verificationError ? { error: verificationError } :
                      verificationResult ? verificationResult :
                      null}
                title="response"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function IAL2CrossCheckPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-purple-50 dark:from-violet-950 dark:via-slate-900 dark:to-purple-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-violet-600"></div>
      </div>
    }>
      <IAL2CrossCheckPageContent />
    </Suspense>
  );
}
