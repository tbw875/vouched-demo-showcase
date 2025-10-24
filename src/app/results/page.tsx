'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { CheckCircleIcon, XCircleIcon, ClockIcon } from '@heroicons/react/24/outline';
import PageHeader from '../components/PageHeader';
import { SSNApiResponse, isSSNVerificationResponse } from '../../types/ssn-api';

interface WebhookData {
  data: Record<string, unknown>;
}

function ResultsPageContent() {
  const searchParams = useSearchParams();
  const [webhookData, setWebhookData] = useState<Record<string, unknown> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pollingCount, setPollingCount] = useState(0);
  const [ssnVerificationData, setSsnVerificationData] = useState<SSNApiResponse | null>(null);

  const jobToken = searchParams.get('token');
  const formData = searchParams.get('formData') ? JSON.parse(searchParams.get('formData')!) : {};

  // Extract jobID from webhook response for Vouched job link
  const getJobId = (data: Record<string, unknown> | null): string | null => {
    if (!data) return null;
    
    // Try different possible locations for jobID
    return (data.id as string) || 
           ((data.job as Record<string, unknown>)?.id as string) || 
           (data.jobId as string) || 
           (data.extractedJobId as string) ||
           null;
  };

  const jobId = getJobId(webhookData);

  // Load SSN verification data from localStorage
  useEffect(() => {
    const storedSSNData = localStorage.getItem('ssnVerificationResult');
    if (storedSSNData) {
      try {
        const parsedData = JSON.parse(storedSSNData);
        setSsnVerificationData(parsedData.data);
      } catch (error) {
        console.error('Error parsing SSN verification data:', error);
      }
    }
  }, []);

  // Poll for webhook data
  useEffect(() => {
    if (!jobToken) {
      setError('Missing job token');
      setIsLoading(false);
      return;
    }

    let attempts = 0;
    const maxAttempts = 90; // 90 attempts * 2 seconds = 3 minutes timeout
    let intervalId: NodeJS.Timeout | null = null;
    
    const pollWebhookData = async () => {
      try {
        attempts++;
        setPollingCount(attempts);
        
        const response = await fetch(`/api/webhook?token=${jobToken}`);
        
        if (response.ok) {
          const result: WebhookData = await response.json();
          setWebhookData(result.data);
          setIsLoading(false);
          if (intervalId) clearInterval(intervalId);
        } else if (response.status === 404) {
          // Data not found yet, continue polling
          if (attempts >= maxAttempts) {
            setError('Webhook data not received within timeout period (3 minutes)');
            setIsLoading(false);
            if (intervalId) clearInterval(intervalId);
          }
          // Continue polling - don't clear interval
        } else {
          throw new Error(`HTTP ${response.status}`);
        }
      } catch (err) {
        console.error('Error polling webhook data:', err);
        setError('Failed to retrieve webhook data');
        setIsLoading(false);
        if (intervalId) clearInterval(intervalId);
      }
    };

    // Initial poll
    pollWebhookData();
    
    // Set up interval polling every 2 seconds
    intervalId = setInterval(pollWebhookData, 2000);

    // Cleanup function
    return () => {
      if (intervalId) clearInterval(intervalId);
    };

  }, [jobToken]); // Only depend on jobToken, not pollingCount

  const getVerificationStatus = () => {
    if (!webhookData) return 'pending';
    
    const result = webhookData.result as { success?: boolean } | undefined;
    if (result?.success) return 'success';
    if (result?.success === false) return 'failed';
    return 'pending';
  };

  const getStatusIcon = () => {
    const status = getVerificationStatus();
    
    switch (status) {
      case 'success':
        return <CheckCircleIcon className="h-8 w-8 text-green-500" />;
      case 'failed':
        return <XCircleIcon className="h-8 w-8 text-red-500" />;
      default:
        return <ClockIcon className="h-8 w-8 text-yellow-500" />;
    }
  };

  const getStatusMessage = () => {
    const status = getVerificationStatus();
    
    switch (status) {
      case 'success':
        return 'Verification Successful';
      case 'failed':
        return 'Verification Failed';
      default:
        return 'Verification Processing';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-indigo-950 dark:via-slate-900 dark:to-purple-950">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <PageHeader/>

        {/* Status Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8 mb-8">
          <div className="flex items-center justify-center mb-6">
            {getStatusIcon()}
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-2">
            {getStatusMessage()}
          </h1>
          
          {isLoading && (
            <p className="text-gray-600 dark:text-gray-300 text-center">
              Waiting for webhook data... (polling attempt {pollingCount + 1})
            </p>
          )}
          
          {error && (
            <p className="text-red-600 dark:text-red-400 text-center">
              {error}
            </p>
          )}
          
          {webhookData && (
            <div className="mt-4 text-center space-y-3">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Job Token: {jobToken}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Received: {new Date(webhookData.timestamp as string).toLocaleString()}
              </p>
              
              {/* Job Link Button */}
              {jobId && (
                <div className="pt-2">
                  <a
                    href={`https://app.vouched.id/account/job/${jobId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors duration-200"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    View Job in Vouched
                  </a>
                </div>
              )}
            </div>
          )}
        </div>

        {/* SSN Verification Results */}
        {ssnVerificationData && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                SSN Verification Results
              </h2>
              {isSSNVerificationResponse(ssnVerificationData) && (
                <div className="flex items-center gap-2">
                  {ssnVerificationData.result.success ? (
                    <CheckCircleIcon className="h-6 w-6 text-green-500" />
                  ) : (
                    <XCircleIcon className="h-6 w-6 text-red-500" />
                  )}
                  <span className={`text-sm font-medium ${
                    ssnVerificationData.result.success 
                      ? 'text-green-600 dark:text-green-400' 
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    {ssnVerificationData.result.success ? 'Verified' : 'Failed'}
                  </span>
                </div>
              )}
            </div>
            
            {/* SSN Verification Summary */}
            {isSSNVerificationResponse(ssnVerificationData) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Verification ID</h3>
                  <p className="text-gray-900 dark:text-white font-mono text-sm">{ssnVerificationData.id}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Status</h3>
                  <p className="text-gray-900 dark:text-white">{ssnVerificationData.status}</p>
                </div>
                {ssnVerificationData.result.details && (
                  <>
                    {ssnVerificationData.result.details.ssnTrace && (
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">SSN Trace</h3>
                        <p className={`${ssnVerificationData.result.details.ssnTrace.found ? 'text-green-600' : 'text-red-600'}`}>
                          {ssnVerificationData.result.details.ssnTrace.found ? 'Found' : 'Not Found'}
                        </p>
                        {ssnVerificationData.result.details.ssnTrace.state && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Issued in: {ssnVerificationData.result.details.ssnTrace.state}
                          </p>
                        )}
                      </div>
                    )}
                    {ssnVerificationData.result.details.identity && (
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Identity Match</h3>
                        <div className="space-y-1 text-sm">
                          <p>First Name: <span className={ssnVerificationData.result.details.identity.firstNameMatch ? 'text-green-600' : 'text-red-600'}>
                            {ssnVerificationData.result.details.identity.firstNameMatch ? 'Match' : 'No Match'}
                          </span></p>
                          <p>Last Name: <span className={ssnVerificationData.result.details.identity.lastNameMatch ? 'text-green-600' : 'text-red-600'}>
                            {ssnVerificationData.result.details.identity.lastNameMatch ? 'Match' : 'No Match'}
                          </span></p>
                          {ssnVerificationData.result.details.identity.dobMatch !== undefined && (
                            <p>Date of Birth: <span className={ssnVerificationData.result.details.identity.dobMatch ? 'text-green-600' : 'text-red-600'}>
                              {ssnVerificationData.result.details.identity.dobMatch ? 'Match' : 'No Match'}
                            </span></p>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
            
            {/* Full SSN Data */}
            <div className="overflow-hidden rounded-lg">
              <SyntaxHighlighter
                language="json"
                style={oneDark}
                customStyle={{
                  margin: 0,
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                }}
              >
                {JSON.stringify(ssnVerificationData, null, 2)}
              </SyntaxHighlighter>
            </div>
          </div>
        )}

        {/* Form Data Display */}
        {Object.keys(formData).length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Form Data Submitted
            </h2>
            <div className="overflow-hidden rounded-lg">
              <SyntaxHighlighter
                language="json"
                style={oneDark}
                customStyle={{
                  margin: 0,
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                }}
              >
                {JSON.stringify(formData, null, 2)}
              </SyntaxHighlighter>
            </div>
          </div>
        )}

        {/* Webhook Data Display */}
        {webhookData && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Webhook Response
            </h2>
            <div className="overflow-hidden rounded-lg">
              <SyntaxHighlighter
                language="json"
                style={oneDark}
                customStyle={{
                  margin: 0,
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                }}
              >
                {JSON.stringify(webhookData, null, 2)}
              </SyntaxHighlighter>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ResultsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-indigo-950 dark:via-slate-900 dark:to-purple-950 flex items-center justify-center">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
    </div>}>
      <ResultsPageContent />
    </Suspense>
  );
} 