'use client';

import { useState } from 'react';
import { AtSymbolIcon, ArrowRightIcon, ArrowPathIcon, CodeBracketIcon, IdentificationIcon } from '@heroicons/react/24/outline';
import PageHeader from '../../components/PageHeader';

interface LoginFormData {
  email: string;
}

export default function ReverificationLoginPage() {
  const [formData, setFormData] = useState<LoginFormData>({ email: '' });
  const [errors, setErrors] = useState<Partial<LoginFormData>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showDevTools, setShowDevTools] = useState(false);
  const [customJobId, setCustomJobId] = useState('');
  const [matchType, setMatchType] = useState<'selfie' | 'id'>('id');

  const validateForm = (): boolean => {
    const newErrors: Partial<LoginFormData> = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    // Simulate API call to fetch original job ID
    await new Promise(resolve => setTimeout(resolve, 1500));

    // For demo purposes, simulate finding the original job ID
    // In production, you would fetch the actual job ID from your database based on email
    let originalJobId = 'HayJkgJbg'; // Default fallback
    let jobIdSource = 'hardcoded default';

    // Dev override: custom job ID takes highest priority
    if (customJobId.trim()) {
      originalJobId = customJobId.trim();
      jobIdSource = 'dev tools (custom input)';
    } else {
      // Try to get the stored job ID from localStorage
      try {
        const storedJobId = localStorage.getItem('vouchedJobId');
        if (storedJobId) {
          originalJobId = storedJobId;
          jobIdSource = 'localStorage (vouchedJobId)';
        } else {
          console.warn("No stored job ID found, using default for demo");
        }
      } catch (err) {
        console.warn("Could not access localStorage for job ID:", err);
      }
    }

    console.log(`[Reverification] Job ID source: ${jobIdSource}`);
    console.log(`[Reverification] Reference job ID: ${originalJobId}`);
    console.log(`[Reverification] Match type: ${matchType}`);

    // Navigate to reverification verify page with the email, original job ID, and match type
    const params = new URLSearchParams({
      email: formData.email,
      originalJobId: originalJobId,
      matchType: matchType
    });

    window.location.href = `/reverification/verify?${params.toString()}`;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name as keyof LoginFormData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 dark:from-purple-950 dark:via-slate-900 dark:to-indigo-950">
      <div className="max-w-2xl mx-auto px-6 py-12">
        {/* Header */}
        <PageHeader />
        
        <div className="text-center mb-12">
          <div className="mb-6">
            <ArrowPathIcon className="h-16 w-16 text-purple-600 mx-auto mb-4" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Passwordless Login
          </h1>
        </div>

        {/* Login Form */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <AtSymbolIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  name="email"
                  id="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter your email address"
                  className={`
                    block w-full pl-10 pr-3 py-3 border rounded-xl shadow-sm 
                    focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500
                    dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400
                    ${errors.email 
                      ? 'border-red-500 dark:border-red-500' 
                      : 'border-gray-300 dark:border-gray-600'
                    }
                  `}
                  disabled={isLoading}
                />
              </div>
              {errors.email && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                  {errors.email}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={isLoading}
                className={`
                  w-full flex items-center justify-center gap-3 px-8 py-4 
                  bg-gradient-to-r from-purple-600 to-indigo-600 
                  hover:from-purple-700 hover:to-indigo-700 
                  disabled:from-gray-400 disabled:to-gray-500
                  text-white font-semibold rounded-xl 
                  transition-all duration-200 shadow-lg hover:shadow-xl
                  disabled:cursor-not-allowed disabled:opacity-75
                `}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Retrieving verification...
                  </>
                ) : (
                  <>
                    <ArrowRightIcon className="h-5 w-5" />
                    Continue to Login
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Back Button */}
        <div className="text-center mt-8">
          <button
            onClick={() => window.history.back()}
            className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium"
          >
            ← Back to Results
          </button>
        </div>

        {/* Dev Tools Toggle */}
        <div className="mt-6">
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => setShowDevTools(prev => !prev)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-mono font-semibold transition-all duration-200 border ${
                showDevTools
                  ? 'bg-amber-50 dark:bg-amber-950 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300'
                  : 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-amber-300 hover:text-amber-600 dark:hover:text-amber-400'
              }`}
            >
              <CodeBracketIcon className="h-3.5 w-3.5" />
              {showDevTools ? '↑ dev' : '↓ dev'}
            </button>
          </div>

          {showDevTools && (
            <div className="mt-4 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <CodeBracketIcon className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <span className="text-sm font-semibold text-amber-800 dark:text-amber-300 font-mono">Dev Tools</span>
              </div>

              <div className="space-y-5">
                {/* Custom Job ID */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-amber-900 dark:text-amber-200">
                    <IdentificationIcon className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    Custom Reference Job ID
                  </label>
                  <p className="text-xs text-amber-700 dark:text-amber-400">
                    Overrides localStorage lookup. Leave blank to use the stored job ID from the last completed verification.
                  </p>
                  <input
                    type="text"
                    value={customJobId}
                    onChange={(e) => setCustomJobId(e.target.value)}
                    placeholder="e.g. HayJkgJbg"
                    className="w-full px-4 py-2.5 rounded-lg border border-amber-300 dark:border-amber-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm font-mono placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
                  />
                  {customJobId.trim() && (
                    <p className="text-xs text-amber-700 dark:text-amber-300 font-mono">
                      ✓ Will use custom job ID: <strong>{customJobId.trim()}</strong>
                    </p>
                  )}
                </div>

                {/* Divider */}
                <div className="border-t border-amber-200 dark:border-amber-800" />

                {/* Match Type */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-amber-900 dark:text-amber-200">
                    <IdentificationIcon className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    Match Type
                  </label>
                  <p className="text-xs text-amber-700 dark:text-amber-400">
                    <strong>selfie</strong> — captures new selfie, compares to source job&apos;s selfie (requires <code className="font-mono">type: idv</code> reference job).<br />
                    <strong>id</strong> — captures new ID scan, compares to source job&apos;s ID document (works with <code className="font-mono">type: id</code> reference job).
                  </p>
                  <div className="relative inline-flex bg-amber-100 dark:bg-amber-900 rounded-full p-1 shadow-inner">
                    <div
                      className="absolute top-1 bottom-1 rounded-full transition-all duration-300 ease-in-out shadow bg-amber-600 dark:bg-amber-500"
                      style={{
                        width: 'calc(50% - 2px)',
                        left: matchType === 'id' ? '2px' : 'calc(50% + 1px)'
                      }}
                    />
                    {(['id', 'selfie'] as const).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setMatchType(type)}
                        className={`relative z-10 px-6 py-1.5 rounded-full text-xs font-mono font-semibold transition-all duration-300 min-w-[80px] ${
                          matchType === type
                            ? 'text-white'
                            : 'text-amber-700 dark:text-amber-300 hover:text-amber-900 dark:hover:text-amber-100'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-amber-700 dark:text-amber-300 font-mono">
                    ✓ reverificationParameters.match: <strong>&apos;{matchType}&apos;</strong>
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 