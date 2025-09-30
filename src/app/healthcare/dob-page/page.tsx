'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ChevronRightIcon, CheckCircleIcon, XCircleIcon, ClockIcon } from '@heroicons/react/24/outline';
import PageHeader from '@/app/components/PageHeader';
import { DOBVerificationRequest, DOBApiResponse, isDOBVerificationResponse } from '@/types/dob-api';

interface VouchedConfig {
  flowType: 'desktop' | 'phone';
  workflowType: 'simultaneous' | 'step-up';
  enabledProducts: string[];
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

function DOBPageContent() {
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [verificationResult, setVerificationResult] = useState<DOBApiResponse | null>(null);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [requestData, setRequestData] = useState<DOBVerificationRequest | null>(null);

  // Parse configuration from URL params
  const config: VouchedConfig = {
    flowType: (searchParams.get('flow') as 'desktop' | 'phone') || 'desktop',
    workflowType: (searchParams.get('workflow') as 'simultaneous' | 'step-up') || 'step-up',
    enabledProducts: searchParams.get('products')?.split(',') || ['dob-verification'],
    ssnMode: (searchParams.get('ssnMode') as 'off' | 'last4' | 'full9') || 'off'
  };
  
  const reverificationEnabled = searchParams.get('reverification') === 'true';
  const useCaseContext = searchParams.get('useCase') || 'healthcare';

  // Parse form data from URL params
  const formData: FormData = searchParams.get('formData') 
    ? JSON.parse(searchParams.get('formData')!) 
    : {};

  // Auto-start DOB verification when component mounts
  useEffect(() => {
    if (formData.firstName && formData.lastName && formData.dateOfBirth) {
      performDOBVerification();
    }
  }, []);

  const performDOBVerification = async () => {
    if (!formData.firstName || !formData.lastName || !formData.dateOfBirth) {
      setVerificationError('Missing required data for DOB verification');
      return;
    }

    setIsLoading(true);
    setVerificationError(null);

    const dobRequest: DOBVerificationRequest = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      dateOfBirth: formData.dateOfBirth,
      ...(formData.phone && { phone: formData.phone }),
      ...(formData.email && { email: formData.email })
    };

    setRequestData(dobRequest);

    try {
      console.log('Starting DOB verification...');
      
      const response = await fetch('/api/healthcare/dob-route', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dobRequest),
      });

      const result: DOBApiResponse = await response.json();
      
      if (!response.ok) {
        const errorMsg = 'error' in result ? result.error : 'Unknown error';
        throw new Error(`DOB verification failed: ${errorMsg}`);
      }

      console.log('DOB verification completed:', result);
      setVerificationResult(result);

      // Store DOB verification result for later display
      if (isDOBVerificationResponse(result)) {
        localStorage.setItem('dobVerificationResult', JSON.stringify({
          timestamp: new Date().toISOString(),
          data: result
        }));
      }

    } catch (error) {
      console.error('DOB verification error:', error);
      const errorMessage = error instanceof Error ? error.message : 'DOB verification failed';
      setVerificationError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinueToNextStep = () => {
    // Navigate to IDV page with same parameters
    const params = new URLSearchParams({
      flow: config.flowType,
      workflow: config.workflowType,
      products: config.enabledProducts.join(','),
      formData: JSON.stringify(formData),
      reverification: reverificationEnabled.toString(),
      useCase: useCaseContext
    });

    window.location.href = `/healthcare/idv-page?${params.toString()}`;
  };

  const getStatusIcon = () => {
    if (isLoading) {
      return <ClockIcon className="h-6 w-6 text-yellow-500 animate-spin" />;
    }
    if (verificationError) {
      return <XCircleIcon className="h-6 w-6 text-red-500" />;
    }
    if (verificationResult && isDOBVerificationResponse(verificationResult)) {
      return verificationResult.result.success 
        ? <CheckCircleIcon className="h-6 w-6 text-green-500" />
        : <XCircleIcon className="h-6 w-6 text-red-500" />;
    }
    return <ClockIcon className="h-6 w-6 text-gray-400" />;
  };

  const getStatusText = () => {
    if (isLoading) return 'Processing DOB verification...';
    if (verificationError) return 'Verification failed';
    if (verificationResult && isDOBVerificationResponse(verificationResult)) {
      return verificationResult.result.success ? 'Verification successful' : 'Verification failed';
    }
    return 'Ready to verify';
  };

  // JSON syntax highlighting component
  const JsonDisplay = ({ data, title }: { data: any; title: string }) => {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-indigo-950 dark:via-slate-900 dark:to-purple-950">
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <PageHeader/>
        
        {/* Page Title */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Healthcare Verification - DOB Verification
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Step 2 of 3: Date of Birth Verification
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="flex items-center justify-center w-8 h-8 bg-green-600 text-white rounded-full text-sm font-semibold">
                ✓
              </div>
              <span className="ml-3 text-sm font-medium text-green-600">CrossCheck</span>
            </div>
            <div className="flex-1 mx-4 h-1 bg-green-600 rounded"></div>
            <div className="flex items-center">
              <div className="flex items-center justify-center w-8 h-8 bg-indigo-600 text-white rounded-full text-sm font-semibold">
                2
              </div>
              <span className="ml-3 text-sm font-medium text-indigo-600">DOB Verification</span>
            </div>
            <div className="flex-1 mx-4 h-1 bg-gray-200 rounded">
              <div className="h-1 bg-indigo-600 rounded" style={{ width: '66%' }}></div>
            </div>
            <div className="flex items-center">
              <div className="flex items-center justify-center w-8 h-8 bg-gray-300 text-gray-600 rounded-full text-sm font-semibold">
                3
              </div>
              <span className="ml-3 text-sm font-medium text-gray-500">ID Verification</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Request Panel */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                DOB Verification API Request
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                Date of Birth verification request details
              </p>
            </div>
            <div className="p-6">
              <JsonDisplay 
                data={requestData ? {
                  endpoint: '/api/healthcare/dob-route',
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json'
                  },
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
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    DOB Verification API Response
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                    Date of Birth verification results
                  </p>
                </div>
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

        {/* Continue Button */}
        <div className="mt-8 text-center">
          <button
            onClick={handleContinueToNextStep}
            disabled={isLoading || (!verificationResult && !verificationError)}
            className={`inline-flex items-center px-8 py-4 rounded-xl text-lg font-semibold transition-all duration-200 ${
              isLoading || (!verificationResult && !verificationError)
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-1'
            }`}
          >
            Continue to next step
            <ChevronRightIcon className="ml-2 h-5 w-5" />
          </button>
          
          {!verificationResult && !verificationError && !isLoading && (
            <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
              DOB verification will start automatically
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function DOBPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-indigo-950 dark:via-slate-900 dark:to-purple-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    }>
      <DOBPageContent />
    </Suspense>
  );
}
