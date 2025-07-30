"use client";

import { useEffect, useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { CheckCircleIcon, XCircleIcon, ClockIcon } from '@heroicons/react/24/outline';
import PageHeader from '../components/PageHeader';

interface WebhookResponse {
  timestamp: string;
  data?: any;
  error?: string;
}

export default function WebhookResponsePage() {
  const [responses, setResponses] = useState<WebhookResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [pollingInterval, setPollingInterval] = useState<number>(1000); // 1 second polling interval
  const [localJobData, setLocalJobData] = useState<any>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [pollingCount, setPollingCount] = useState(0);
  const [formData, setFormData] = useState<any>({});

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
        
        // If we got data, stop loading
        if (data.responses && data.responses.length > 0) {
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

  // Check if we're using webhook data or local data
  const isUsingWebhookData = responses.length > 0;
  const isUsingLocalData = !isUsingWebhookData && localJobData;

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
  const transformToVouchedParameters = (rawFormData: any) => {
    const vouchedData: Record<string, any> = {};
    
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-indigo-950 dark:via-slate-900 dark:to-purple-950">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <PageHeader pageTitle="Verification Results" />

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
            
            {loading && (
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
              <div className="mt-4 text-center">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Received: {new Date(latestResponse.timestamp).toLocaleString()}
                </p>
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
              This usually means the verification process wasn't completed or there was an error.
            </p>
            <button 
              className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-lg transition-all duration-200"
              onClick={() => window.location.href = '/'}
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 