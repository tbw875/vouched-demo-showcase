'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { CheckCircleIcon, XCircleIcon, ClockIcon, ArrowPathIcon, UserIcon } from '@heroicons/react/24/outline';
import PageHeader from '../../components/PageHeader';

interface WebhookResponse {
  timestamp: string;
  data?: any;
  error?: string;
}

function ReverificationResultsContent() {
  const searchParams = useSearchParams();
  const [responses, setResponses] = useState<WebhookResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [pollingCount, setPollingCount] = useState(0);
  const [isMounted, setIsMounted] = useState(false);

  const [token, setToken] = useState('');
  const [originalJobId, setOriginalJobId] = useState('');
  const [email, setEmail] = useState('');
  const [currentJobId, setCurrentJobId] = useState('');

  useEffect(() => {
    setIsMounted(true);
    
    // Get reverification data from localStorage and URL params
    const urlToken = searchParams.get('token');
    const urlOriginalJobId = searchParams.get('originalJobId');
    const urlEmail = searchParams.get('email');
    
    if (urlToken) setToken(urlToken);
    if (urlOriginalJobId) setOriginalJobId(urlOriginalJobId);
    if (urlEmail) setEmail(urlEmail);
    
    // Try to get stored job ID if not in URL
    if (!urlOriginalJobId) {
      try {
        const storedJobId = localStorage.getItem('vouchedJobId');
        if (storedJobId) {
          setOriginalJobId(storedJobId);
        }
      } catch (error) {
        console.error('Error loading original job ID:', error);
      }
    }
    
    // Try to get email from form data if not in URL
    if (!urlEmail) {
      try {
        const storedFormData = localStorage.getItem('vouchedFormData');
        if (storedFormData) {
          const formData = JSON.parse(storedFormData);
          if (formData.email) {
            setEmail(formData.email);
          }
        }
      } catch (error) {
        console.error('Error loading email:', error);
      }
    }
  }, [searchParams]);

  useEffect(() => {
    // First check if we have data in localStorage (from onReverify callback)
    try {
      const storedJobData = localStorage.getItem('latestJobData');
      if (storedJobData) {
        const jobData = JSON.parse(storedJobData);
        if (jobData.data) {
          setResponses([{
            timestamp: jobData.timestamp,
            data: jobData.data
          }]);
          // Extract current job ID from the data
          if (jobData.data.id) {
            setCurrentJobId(jobData.data.id);
          }
          setLoading(false);
          return; // Don't poll if we have local data
        }
      }
    } catch (error) {
      console.error('Error loading local job data:', error);
    }

    let attempts = 0;
    const maxAttempts = 30; // Reduced from 60 to 30 attempts * 2 seconds = 1 minute timeout

    const fetchResponses = async () => {
      try {
        attempts++;
        setPollingCount(attempts);
        
        const res = await fetch('/api/vouched-webhook');
        const data = await res.json();
        setResponses(data.responses || []);
        
        // If we got data, stop loading and extract job ID
        if (data.responses && data.responses.length > 0) {
          // Extract job ID from the latest response
          const latestResponse = data.responses[data.responses.length - 1];
          if (latestResponse.data && latestResponse.data.id) {
            setCurrentJobId(latestResponse.data.id);
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
        console.error('Error fetching reverification webhook responses:', error);
        setLoading(false);
        return true; // Stop polling on error
      }
    };

    // Initial fetch
    fetchResponses().then(shouldStop => {
      if (shouldStop) return;
      
      // Set up polling every 2 seconds
      const intervalId = setInterval(async () => {
        const shouldStop = await fetchResponses();
        if (shouldStop) {
          clearInterval(intervalId);
        }
      }, 2000);

      // Cleanup function
      return () => {
        clearInterval(intervalId);
      };
    });

  }, []); // Run once on mount

  // Use the latest webhook response
  const latestResponse = responses[0] || null;

  // Extract jobID from webhook response for Vouched job link
  const getJobId = (response: WebhookResponse | null): string | null => {
    if (!response?.data) return null;
    
    // Try different possible locations for jobID
    return response.data.id || 
           response.data.job?.id || 
           response.data.jobId || 
           response.data.extractedJobId ||
           null;
  };

  const jobId = getJobId(latestResponse);

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
        return <CheckCircleIcon className="h-12 w-12 text-green-500" />;
      case 'failed':
        return <XCircleIcon className="h-12 w-12 text-red-500" />;
      default:
        return <ClockIcon className="h-12 w-12 text-yellow-500" />;
    }
  };

  const getStatusMessage = () => {
    const status = getVerificationStatus();
    
    switch (status) {
      case 'success':
        return 'Reverification Successful';
      case 'failed':
        return 'Reverification Failed';
      default:
        return 'Reverification Processing';
    }
  };

  const getStatusDescription = () => {
    const status = getVerificationStatus();
    
    switch (status) {
      case 'success':
        return 'Your identity has been successfully reverified and matches your original verification.';
      case 'failed':
        return 'Reverification was not successful. The new verification does not match your original.';
      default:
        return 'Your reverification is being processed. Please wait for the results.';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 dark:from-purple-950 dark:via-slate-900 dark:to-indigo-950">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <PageHeader pageTitle="Reverification Results" />

        {/* Status Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8 mb-8">
          <div className="flex items-center justify-center mb-6">
            <div className="relative">
              {getStatusIcon()}
              <ArrowPathIcon className="h-6 w-6 text-purple-500 absolute -top-2 -right-2 bg-white dark:bg-gray-800 rounded-full p-1" />
            </div>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-2">
            {getStatusMessage()}
          </h1>
          
          <p className="text-gray-600 dark:text-gray-300 text-center mb-6">
            {getStatusDescription()}
          </p>
          
          {loading && (
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-2"></div>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                Waiting for reverification data... (attempt {pollingCount})
              </p>
            </div>
          )}
          
          {!loading && !latestResponse && (
            <p className="text-red-600 dark:text-red-400 text-center">
              Reverification data not received within timeout period
            </p>
          )}
          
          {latestResponse && (
            <div className="mt-4 text-center space-y-3">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Completed: {new Date(latestResponse.timestamp).toLocaleString()}
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

        {/* Verification Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* User Information */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8">
            <div className="flex items-center gap-3 mb-6">
              <UserIcon className="h-6 w-6 text-purple-600" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Verification Details
              </h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</label>
                <p className="text-gray-900 dark:text-white font-medium">{email}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Reverification Token</label>
                <p className="text-gray-900 dark:text-white font-mono text-sm break-all">
                  {token ? `${token.substring(0, 20)}...` : 'Not available'}
                </p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Original Job ID</label>
                <p className="text-gray-900 dark:text-white font-mono text-sm break-all">
                  {originalJobId ? `${originalJobId.substring(0, 20)}...` : 'Not available'}
                </p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Verification Type</label>
                <p className="text-gray-900 dark:text-white font-medium">Selfie Reverification</p>
              </div>
            </div>
          </div>

          {/* Match Information */}
          {latestResponse && getVerificationStatus() !== 'pending' && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8">
              <div className="flex items-center gap-3 mb-6">
                <ArrowPathIcon className="h-6 w-6 text-purple-600" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Match Results
                </h2>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Overall Result</label>
                  <div className="flex items-center gap-2 mt-1">
                    {getVerificationStatus() === 'success' ? (
                      <CheckCircleIcon className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircleIcon className="h-5 w-5 text-red-500" />
                    )}
                    <p className={`font-medium ${
                      getVerificationStatus() === 'success' 
                        ? 'text-green-600 dark:text-green-400' 
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {getVerificationStatus() === 'success' ? 'Match Confirmed' : 'No Match'}
                    </p>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Confidence Score</label>
                  <p className="text-gray-900 dark:text-white font-medium">
                    {latestResponse.data?.confidenceScore 
                      ? `${Math.round(latestResponse.data.confidenceScore * 100)}%`
                      : 'Not available'
                    }
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Full Webhook Response */}
        {latestResponse && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Complete Reverification Response
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
            <ArrowPathIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">No reverification data found</p>
            <p className="text-sm text-gray-400 mb-6">
              This usually means the reverification process wasn't completed or there was an error.
            </p>
            <button 
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold rounded-lg transition-all duration-200"
              onClick={() => window.location.href = '/reverification/login'}
            >
              Try Reverification Again
            </button>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
          {currentJobId ? (
            <button 
              onClick={() => window.open(`https://app.vouched.id/account/jobs/${currentJobId}`, '_blank')}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold rounded-lg transition-all duration-200 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              View Job in Vouched
            </button>
          ) : (
            <button 
              onClick={() => window.location.href = '/'}
              className="px-6 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-semibold rounded-lg transition-all duration-200"
            >
              Start New Verification
            </button>
          )}
          
          <button 
            onClick={() => window.location.href = '/reverification/login'}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold rounded-lg transition-all duration-200"
          >
            Try Reverification Again
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ReverificationResultsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 dark:from-purple-950 dark:via-slate-900 dark:to-indigo-950 flex items-center justify-center">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
    </div>}>
      <ReverificationResultsContent />
    </Suspense>
  );
} 