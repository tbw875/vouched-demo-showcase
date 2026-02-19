"use client";

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { CheckCircleIcon, XCircleIcon, ClockIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import PageHeader from '../components/PageHeader';
import { VouchedJob } from '@/types/vouched';

interface WebhookResponse {
  timestamp: string;
  data?: VouchedJob;
  error?: string;
}

function WebhookResponsePageContent() {
  const searchParams = useSearchParams();
  const [responses, setResponses] = useState<WebhookResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const pollingInterval = 1000; // 1 second polling interval
  const [localJobData, setLocalJobData] = useState<WebhookResponse | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [pollingCount, setPollingCount] = useState(0);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [currentJobId, setCurrentJobId] = useState('');
  
  const reverificationEnabled = searchParams.get('reverification') === 'true';

  useEffect(() => {
    setIsMounted(true);
    
    // Load form data from localStorage
    try {
      const storedFormData = localStorage.getItem('vouchedFormData');
      if (storedFormData) {
        setFormData(JSON.parse(storedFormData));
      }
    } catch (error) {
      console.error('Error loading form data:', error);
    }
  }, []);

  useEffect(() => {
    // Load local job data as fallback
    const loadLocalJobData = () => {
      try {
        const stored = localStorage.getItem('latestJobData');
        if (stored) {
          const parsedData = JSON.parse(stored);
          setLocalJobData(parsedData);
          // Extract job ID from the data
          if (parsedData.data && parsedData.data.id) {
            setCurrentJobId(parsedData.data.id);
          }
          console.log('Loaded local job data:', parsedData);
        }
      } catch (error) {
        console.error('Error loading local job data:', error);
      }
    };

    let attempts = 0;
    const maxAttempts = 90; // 90 attempts * 1 second = 90 seconds timeout

    const fetchResponses = async () => {
      try {
        attempts++;
        setPollingCount(attempts);
        
        const res = await fetch('/api/vouched-webhook');
        const data = await res.json();
        setResponses(data.responses || []);
        
        // If we got data, stop loading and persist to localStorage so the dashboard can read it
        if (data.responses && data.responses.length > 0) {
          const latest = data.responses[0];
          if (latest?.data) {
            localStorage.setItem('latestJobData', JSON.stringify({
              timestamp: latest.timestamp,
              data: latest.data,
            }));
          }
          setLoading(false);
          return true; // Signal to stop polling
        }
        
        // Continue polling if no data and within attempts limit
        if (attempts >= maxAttempts) {
          setLoading(false);
          return true; // Stop polling after max attempts
        }
        
        return false; // Continue polling
      } catch (error) {
        console.error('Error fetching webhook responses:', error);
        setLoading(false);
        return true; // Stop polling on error
      }
    };

    // Load local data first
    loadLocalJobData();

    // Initial fetch
    fetchResponses().then(shouldStop => {
      if (shouldStop) return;
      
      // Set up polling
      const intervalId = setInterval(async () => {
        const shouldStop = await fetchResponses();
        if (shouldStop) {
          clearInterval(intervalId);
        }
      }, pollingInterval);

      // Cleanup function
      return () => {
        clearInterval(intervalId);
      };
    });

  }, []); // Run once on mount

  // Use webhook response if available, otherwise use local job data
  const latestResponse = responses[0] || (localJobData ? {
    timestamp: localJobData.timestamp,
    data: localJobData.data
  } : null);

  const getVerificationStatus = () => {
    if (!latestResponse) return 'pending';
    
    const result = latestResponse.data?.result as { success?: boolean } | undefined;
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
        return 'Verification Completed';
      case 'failed':
        return 'Verification Failed';
      default:
        return 'Verification Processing';
    }
  };

  // Transform form data to match what was actually sent to Vouched
  const transformToVouchedParameters = (rawFormData: Record<string, string>) => {
    const vouchedData: Record<string, string> = {};
    
    // Basic identity data (always included when available)
    if (rawFormData.firstName) vouchedData.firstName = rawFormData.firstName;
    if (rawFormData.lastName) vouchedData.lastName = rawFormData.lastName;
    if (rawFormData.phone) vouchedData.phone = rawFormData.phone;
    if (rawFormData.email) vouchedData.email = rawFormData.email;
    if (rawFormData.ipAddress) vouchedData.ipAddress = rawFormData.ipAddress;
    
    // Transform dateOfBirth to birthDate (Vouched's expected parameter)
    if (rawFormData.dateOfBirth) {
      vouchedData.birthDate = rawFormData.dateOfBirth;
    }
    
    // SSN data (when provided)
    if (rawFormData.ssn) {
      vouchedData.ssn = rawFormData.ssn;
    }
    
    return vouchedData;
  };

  // Get the transformed data for display
  const vouchedParameters = Object.keys(formData).length > 0 ? transformToVouchedParameters(formData) : {};

  // Extract jobID from webhook response for Vouched job link
  const getJobId = (response: WebhookResponse | null): string | null => {
    if (!response?.data) return null;
    
    const data = response.data as unknown as Record<string, unknown>;
    // Try different possible locations for jobID
    return (data?.id as string) || 
           ((data?.job as Record<string, unknown>)?.id as string) || 
           (data?.jobId as string) || 
           (data?.extractedJobId as string) ||
           null;
  };

  const jobId = getJobId(latestResponse);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-indigo-950 dark:via-slate-900 dark:to-purple-950">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <PageHeader/>

        {/* Two Column Layout - Status + Input Data */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Status Card */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8">
            <div className="flex items-center justify-center mb-6">
              {getStatusIcon()}
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-2">
              {getStatusMessage()}
            </h1>
            
            {loading && !latestResponse && (
              <p className="text-gray-600 dark:text-gray-300 text-center text-sm">
                Waiting for webhook data... (attempt {pollingCount})
              </p>
            )}
            
            {!loading && !latestResponse && (
              <p className="text-red-600 dark:text-red-400 text-center text-sm">
                Webhook data not received within timeout period
              </p>
            )}
            
            {latestResponse && (
              <div className="mt-4 text-center space-y-3">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Received: {new Date(latestResponse.timestamp).toLocaleString()}
                </p>
                
                {/* Job Link Button */}
                {jobId && (
                  <div className="pt-2">
                    <a
                      href={`https://app.vouched.id/account/job/${jobId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors duration-200"
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

          {/* Input Data Card */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Data Sent to Vouched
            </h2>
            
            {Object.keys(vouchedParameters).length > 0 ? (
              <div className="overflow-hidden rounded-lg">
                {isMounted ? (
                  <SyntaxHighlighter
                    language="json"
                    style={oneDark}
                    customStyle={{
                      margin: 0,
                      borderRadius: '0.5rem',
                      fontSize: '0.75rem',
                      maxHeight: '300px'
                    }}
                  >
                    {JSON.stringify(vouchedParameters, null, 2)}
                  </SyntaxHighlighter>
                ) : (
                  <div className="p-4 bg-gray-900 rounded-lg text-gray-400 text-sm">
                    Loading syntax highlighter...
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 text-sm">No verification data available</p>
                <p className="text-xs text-gray-400 mt-2">
                  No data was sent to Vouched for this verification
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Full Width Webhook Response */}
        {latestResponse && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Webhook Response
            </h2>
            <div className="overflow-hidden rounded-lg">
              {isMounted ? (
                <SyntaxHighlighter
                  language="json"
                  style={oneDark}
                  customStyle={{
                    margin: 0,
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                  }}
                >
                  {JSON.stringify(latestResponse.data || latestResponse.error, null, 2)}
                </SyntaxHighlighter>
              ) : (
                <div className="p-4 bg-gray-900 rounded-lg text-gray-400">
                  Loading syntax highlighter...
                </div>
              )}
            </div>
          </div>
        )}

        {/* No Data State */}
        {!loading && !latestResponse && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8 text-center">
            <p className="text-gray-500 mb-4">No verification data found</p>
            <p className="text-sm text-gray-400 mb-6">
              This usually means the verification process wasn&apos;t completed or there was an error.
            </p>
            <button 
              className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-lg transition-all duration-200"
              onClick={() => window.location.href = '/'}
            >
              Try Again
            </button>
          </div>
        )}

        {/* Action Buttons */}
        {latestResponse && getVerificationStatus() === 'success' && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8 text-center mt-8">
            <div className="mb-6">
              <CheckCircleIcon className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Verification Complete
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Your identity has been verified. Access your dashboard to explore available services.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-3 justify-center"
                onClick={() => {
                  const params = new URLSearchParams({
                    reverification: reverificationEnabled.toString()
                  });
                  window.location.href = `/dashboard?${params.toString()}`;
                }}
              >
                <CheckCircleIcon className="h-5 w-5" />
                Go to Dashboard
              </button>
              
              {currentJobId ? (
                <button 
                  className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-3 justify-center"
                  onClick={() => window.open(`https://app.vouched.id/account/jobs/${currentJobId}`, '_blank')}
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  View Job in Vouched
                </button>
              ) : reverificationEnabled ? (
                <button 
                  className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-3 justify-center"
                  onClick={() => window.location.href = '/reverification/login'}
                >
                  <ArrowPathIcon className="h-5 w-5" />
                  Start Reverification
                </button>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function WebhookResponsePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-indigo-950 dark:via-slate-900 dark:to-purple-950 flex items-center justify-center">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
    </div>}>
      <WebhookResponsePageContent />
    </Suspense>
  );
} 