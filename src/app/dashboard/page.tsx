'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { 
  CheckCircleIcon, 
  CreditCardIcon, 
  BanknotesIcon, 
  BuildingLibraryIcon,
  ShieldCheckIcon,
  DocumentTextIcon,
  ChartBarIcon,
  GlobeAltIcon,
  XMarkIcon,
  EyeIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';
import PageHeader from '../components/PageHeader';

interface WebhookResponse {
  timestamp: string;
  data?: any;
  error?: string;
}

function DashboardContent() {
  const searchParams = useSearchParams();
  const [userName, setUserName] = useState('');
  const [webhookData, setWebhookData] = useState<any>(null);
  const [showWebhookModal, setShowWebhookModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [reverificationEnabled, setReverificationEnabled] = useState(false);

  useEffect(() => {
    // Get user name and reverification setting from localStorage
    try {
      const storedFormData = localStorage.getItem('vouchedFormData');
      if (storedFormData) {
        const formData = JSON.parse(storedFormData);
        const fullName = `${formData.firstName || ''}`.trim();
        setUserName(fullName || 'User');
      }
    } catch (error) {
      console.error('Error loading user name:', error);
      setUserName('User');
    }

    // Check if reverification was enabled from URL or assume it was if we got here
    const reverifyParam = searchParams.get('reverification');
    if (reverifyParam === 'true') {
      setReverificationEnabled(true);
    } else {
      // Default to true for demo purposes if not specified
      setReverificationEnabled(true);
    }

    // Get webhook data from localStorage
    try {
      const storedJobData = localStorage.getItem('latestJobData');
      if (storedJobData) {
        const jobData = JSON.parse(storedJobData);
        setWebhookData(jobData.data);
      }
    } catch (error) {
      console.error('Error loading webhook data:', error);
    }

    setIsLoading(false);
  }, []);

  // Fake service cards data
  const serviceCards = [
    {
      id: 1,
      title: 'Digital Banking',
      description: 'Access your accounts, transfer funds, and manage your finances securely.',
      icon: BanknotesIcon,
      color: 'from-green-500 to-emerald-600',
      features: ['Account Balance', 'Money Transfer', 'Bill Pay', 'Mobile Deposit']
    },
    {
      id: 2,
      title: 'Credit Services',
      description: 'Apply for loans, credit cards, and view your credit score.',
      icon: CreditCardIcon,
      color: 'from-blue-500 to-cyan-600',
      features: ['Credit Score', 'Loan Applications', 'Credit Cards', 'Payment History']
    },
    {
      id: 3,
      title: 'Investment Portal',
      description: 'Trade stocks, bonds, and manage your investment portfolio.',
      icon: ChartBarIcon,
      color: 'from-purple-500 to-indigo-600',
      features: ['Stock Trading', 'Portfolio View', 'Market Analysis', 'Crypto Trading']
    },
    {
      id: 4,
      title: 'Insurance Hub',
      description: 'Manage your policies, file claims, and get coverage quotes.',
      icon: ShieldCheckIcon,
      color: 'from-orange-500 to-red-600',
      features: ['Policy Management', 'Claims Filing', 'Coverage Quotes', 'Risk Assessment']
    },
    {
      id: 5,
      title: 'Document Vault',
      description: 'Securely store and access your important documents.',
      icon: DocumentTextIcon,
      color: 'from-teal-500 to-cyan-600',
      features: ['Secure Storage', 'Document Sharing', 'Digital Signatures', 'Version Control']
    },
    {
      id: 6,
      title: 'Global Services',
      description: 'International transfers, currency exchange, and global banking.',
      icon: GlobeAltIcon,
      color: 'from-pink-500 to-rose-600',
      features: ['Wire Transfers', 'Currency Exchange', 'Global ATM', 'Travel Cards']
    }
  ];

  const getVerificationStatus = () => {
    if (!webhookData) return 'unknown';
    const result = webhookData.result;
    return result?.success ? 'verified' : 'pending';
  };

  const isReverification = () => {
    // Check if this is a reverification by looking at the stored data
    if (webhookData && webhookData.type === 'reverify') {
      return true;
    }
    // Also check if we came from reverification flow
    return window.location.pathname.includes('reverification') || 
           document.referrer.includes('reverification');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-indigo-950 dark:via-slate-900 dark:to-purple-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-indigo-950 dark:via-slate-900 dark:to-purple-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <PageHeader 
          customRightContent={
            <button
              onClick={() => window.location.href = '/reverification/login'}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <ArrowRightOnRectangleIcon className="h-5 w-5" />
              Log Out
            </button>
          }
        />

        {/* Welcome Section */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <div className="relative">
              <CheckCircleIcon className="h-16 w-16 text-green-500" />
              <div className="absolute -top-2 -right-2 bg-green-100 dark:bg-green-900 rounded-full p-1">
                <ShieldCheckIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>
          
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            {isReverification() ? `Welcome back, ${userName}!` : `Welcome, ${userName}!`}
          </h1>
          
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-6">
            {isReverification() 
              ? ""
              : ""
            }
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-12">
          {serviceCards.map((service) => {
            const IconComponent = service.icon;
            return (
              <div key={service.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                {/* Card Header with Gradient */}
                <div className={`bg-gradient-to-r ${service.color} p-6 text-white`}>
                  <div className="flex items-center gap-4">
                    <div className="bg-white/20 rounded-lg p-3">
                      <IconComponent className="h-6 w-6" />
                    </div>
                    <h3 className="text-xl font-bold">{service.title}</h3>
                  </div>
                </div>
                
                {/* Card Content */}
                <div className="p-6">
                  <p className="text-gray-600 dark:text-gray-300 mb-6">
                    {service.description}
                  </p>
                  
                  {/* Features List */}
                  <div className="space-y-2 mb-6">
                    {service.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <CheckCircleIcon className="h-4 w-4 text-green-500 flex-shrink-0" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">{feature}</span>
                      </div>
                    ))}
                  </div>
                  
                  {/* Action Button */}
                  <button className="w-full py-3 px-4 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-medium rounded-lg transition-colors duration-200">
                    Access Service
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button
            onClick={() => setShowWebhookModal(true)}
            className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <EyeIcon className="h-5 w-5" />
            View Webhook Response
          </button>

          {reverificationEnabled && (
            <button
              onClick={() => window.location.href = '/reverification/login'}
              className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <ShieldCheckIcon className="h-5 w-5" />
              Start Reverification
            </button>
          )}
        </div>

        {/* Back to Configuration */}
        <div className="text-center mt-8">
          <button 
            onClick={() => window.location.href = '/'}
            className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium"
          >
            ← Back to Configuration
          </button>
        </div>
      </div>

      {/* Webhook Modal */}
      {showWebhookModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                Webhook Response Data
              </h3>
              <button
                onClick={() => setShowWebhookModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <XMarkIcon className="h-6 w-6 text-gray-500" />
              </button>
            </div>
            
            {/* Modal Content */}
            <div className="p-6 overflow-auto max-h-[calc(90vh-120px)]">
              {webhookData ? (
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
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    No webhook data available
                  </p>
                  <button
                    onClick={() => window.location.href = '/webhook-response'}
                    className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
                  >
                    View Full Webhook Response Page
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-indigo-950 dark:via-slate-900 dark:to-purple-950 flex items-center justify-center">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
    </div>}>
      <DashboardContent />
    </Suspense>
  );
} 