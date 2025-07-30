'use client';

import { useState } from 'react';
import { AtSymbolIcon, ArrowRightIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import PageHeader from '../../components/PageHeader';

interface LoginFormData {
  email: string;
}

export default function ReverificationLoginPage() {
  const [formData, setFormData] = useState<LoginFormData>({ email: '' });
  const [errors, setErrors] = useState<Partial<LoginFormData>>({});
  const [isLoading, setIsLoading] = useState(false);

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
    
    // Try to get the stored job ID from localStorage
    try {
      const storedJobId = localStorage.getItem('vouchedJobId');
      if (storedJobId) {
        originalJobId = storedJobId;
        console.log("Using stored job ID for reverification:", originalJobId);
      } else {
        console.warn("No stored job ID found, using default for demo");
      }
    } catch (err) {
      console.warn("Could not access localStorage for job ID:", err);
    }
    
    // Navigate to reverification verify page with the email and original job ID
    const params = new URLSearchParams({
      email: formData.email,
      originalJobId: originalJobId
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
        <PageHeader pageTitle="Reverification Login" />
        
        <div className="text-center mb-12">
          <div className="mb-6">
            <ArrowPathIcon className="h-16 w-16 text-purple-600 mx-auto mb-4" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Reverification Login
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-lg mx-auto">
            Enter your email address to retrieve your original verification and start the reverification process.
          </p>
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
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                This will be used to locate your original verification for comparison.
              </p>
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
                    Continue to Reverification
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Info Card */}
          <div className="mt-8 p-6 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-200 dark:border-purple-700">
            <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-200 mb-2">
              What is Reverification?
            </h3>
            <p className="text-sm text-purple-700 dark:text-purple-300">
              Reverification allows you to verify your identity again and compare the new verification 
              against your original one. This helps ensure consistent identity verification over time.
            </p>
          </div>
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
      </div>
    </div>
  );
} 