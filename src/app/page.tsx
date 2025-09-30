'use client';

import { useState, useEffect } from 'react';
import { ChevronRightIcon, ShieldCheckIcon, DocumentCheckIcon, BuildingOffice2Icon, HeartIcon, CubeIcon } from '@heroicons/react/24/outline';

type SSNMode = 'off' | 'last4' | 'full9';
type UseCaseContext = 'healthcare' | 'financial' | 'generic';

interface Product {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
}

export default function ConfigurationPage() {
  const [ssnMode, setSsnMode] = useState<SSNMode>('off');
  const [reverificationEnabled, setReverificationEnabled] = useState(false);
  const [useCaseContext, setUseCaseContext] = useState<UseCaseContext>('financial');
  const [showDevLinks, setShowDevLinks] = useState(false);
  const [products, setProducts] = useState<Product[]>([
    {
      id: 'id-verification',
      name: 'Visual ID Verification',
      description: 'Verify government-issued IDs with advanced fraud & deepfake detection',
      enabled: true,
    },
    {
      id: 'crosscheck',
      name: 'CrossCheck',
      description: 'Know Your Customer with CrossCheck PII Risk Assessment',
      enabled: true,
    },
    {
      id: 'dob-verification',
      name: 'DOB Verification',
      description: 'Asks user for DOB input and compares to ID',
      enabled: false,
    },
    {
      id: 'drivers-license-verification',
      name: 'Driver\'s License Verification',
      description: 'Verify driver\'s license information and authenticity',
      enabled: false,
    },
    {
      id: 'aml',
      name: 'AML Check',
      description: 'Checks user against AML lists: OFAC, PEP, Police watchlists',
      enabled: false,
    },
  ]);

  const toggleProduct = (productId: string) => {
    setProducts(prev => 
      prev.map(product => 
        product.id === productId 
          ? { ...product, enabled: !product.enabled }
          : product
      )
    );
  };

  // Auto-toggle DOB verification when Healthcare use case is selected
  useEffect(() => {
    if (useCaseContext === 'healthcare') {
      setProducts(prev => 
        prev.map(product => 
          product.id === 'dob-verification' 
            ? { ...product, enabled: true }
            : product
        )
      );
    }
  }, [useCaseContext]);

  const handleStartDemo = () => {
    const enabledProducts = products.filter(p => p.enabled).map(p => p.id);
    
    // Add ssnPrivate to products if it's not 'off'
    if (ssnMode !== 'off') {
      enabledProducts.push('ssnPrivate');
    }
    
    console.log('Configuration:', {
      flow: 'desktop',
      workflow: 'simultaneous',
      enabledProducts,
      ssnMode,
      reverificationEnabled,
    });
    
    // Navigate to form fill page with configuration
    const params = new URLSearchParams({
      flow: 'desktop', // Default to desktop flow
      workflow: 'simultaneous', // Default to simultaneous workflow
      products: enabledProducts.join(','),
      ssnMode: ssnMode,
      reverification: reverificationEnabled.toString(),
      useCase: useCaseContext
    });
    
    window.location.href = `/form-fill?${params.toString()}`;
  };



  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-indigo-950 dark:via-slate-900 dark:to-purple-950">
      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <div className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold text-xl">
              Vouched
            </div>
          </div>
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Identity Verification
            <span className="text-indigo-600"> Showcase</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Configure your demo experience to showcase Vouched&apos;s AI-powered identity verification solutions
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-700 p-8 space-y-10">

          {/* Product Selection */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <DocumentCheckIcon className="h-8 w-8 text-indigo-600" />
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                Configure Products
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Row 1: Core Products - ID Verification and CrossCheck */}
              {products.filter(product => ['id-verification', 'crosscheck'].includes(product.id)).map((product) => (
                <div
                  key={product.id}
                  className={`p-8 rounded-2xl border-2 transition-all duration-200 ${
                    product.enabled
                      ? 'border-emerald-500 bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/30 dark:to-green-900/30 shadow-lg'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {product.name}
                    </h3>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={product.enabled}
                        onChange={() => toggleProduct(product.id)}
                        className="sr-only peer"
                      />
                      <div className="w-12 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300">
                    {product.description}
                  </p>
                </div>
              ))}
              
              {/* Row 2: DOB Verification and Driver's License Verification */}
              {products.filter(product => product.id === 'dob-verification').map((product) => (
                <div
                  key={product.id}
                  className={`p-8 rounded-2xl border-2 transition-all duration-200 ${
                    product.enabled
                      ? 'border-emerald-500 bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/30 dark:to-green-900/30 shadow-lg'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {product.name}
                    </h3>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={product.enabled}
                        onChange={() => toggleProduct(product.id)}
                        className="sr-only peer"
                      />
                      <div className="w-12 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300">
                    {product.description}
                  </p>
                </div>
              ))}
              
              {products.filter(product => product.id === 'drivers-license-verification').map((product) => (
                <div
                  key={product.id}
                  className={`p-8 rounded-2xl border-2 transition-all duration-200 ${
                    product.enabled
                      ? 'border-emerald-500 bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/30 dark:to-green-900/30 shadow-lg'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {product.name}
                    </h3>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={product.enabled}
                        onChange={() => toggleProduct(product.id)}
                        className="sr-only peer"
                      />
                      <div className="w-12 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300">
                    {product.description}
                  </p>
                </div>
              ))}
              
              {/* Row 3: AML Check and Reverification */}
              {products.filter(product => product.id === 'aml').map((product) => (
                <div
                  key={product.id}
                  className={`p-8 rounded-2xl border-2 transition-all duration-200 ${
                    product.enabled
                      ? 'border-emerald-500 bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/30 dark:to-green-900/30 shadow-lg'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {product.name}
                    </h3>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={product.enabled}
                        onChange={() => toggleProduct(product.id)}
                        className="sr-only peer"
                      />
                      <div className="w-12 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300">
                    {product.description}
                  </p>
                </div>
              ))}
              
              {/* Reverification Card */}
              <div className={`p-8 rounded-2xl border-2 transition-all duration-200 ${
                reverificationEnabled
                  ? 'border-purple-500 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/30 dark:to-indigo-900/30 shadow-lg'
                  : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
              }`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                      Reverification
                    </h3>
                  </div>
                  
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={reverificationEnabled}
                      onChange={(e) => setReverificationEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-12 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"></div>
                  </label>
                </div>
                
                <p className="text-gray-600 dark:text-gray-300">
                  Passwordless Login 
                </p>
              </div>
              
              {/* SSN Collection Card - Spans 2 columns */}
              <div className="md:col-span-2 p-8 rounded-2xl border-2 border-gray-200 dark:border-gray-600 transition-all duration-200">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <ShieldCheckIcon className="h-6 w-6 text-indigo-600" />
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                      SSN Collection
                    </h3>
                  </div>
                  
                  {/* Triple Toggle Switch */}
                  <div className="relative inline-flex bg-gray-200 dark:bg-gray-700 rounded-full p-1 shadow-inner">
                    {/* Background slider */}
                    <div 
                      className={`absolute top-1 bottom-1 rounded-full transition-all duration-300 ease-in-out shadow-lg ${
                        ssnMode === 'off' 
                          ? 'bg-gray-500' 
                          : ssnMode === 'last4' 
                          ? 'bg-orange-500' 
                          : 'bg-red-500'
                      }`}
                      style={{
                        width: 'calc(33.333333% - 2px)',
                        left: ssnMode === 'off' ? '2px' : 
                              ssnMode === 'last4' ? 'calc(33.333333% + 1px)' : 
                              'calc(66.666667% + 0px)'
                      }}
                    />
                    
                    {/* Toggle Options */}
                    <button
                      type="button"
                      onClick={() => setSsnMode('off')}
                      className={`relative z-10 px-6 py-2 rounded-full text-sm font-semibold transition-all duration-300 min-w-[80px] ${
                        ssnMode === 'off' 
                          ? 'text-white' 
                          : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100'
                      }`}
                    >
                      OFF
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setSsnMode('last4')}
                      className={`relative z-10 px-6 py-2 rounded-full text-sm font-semibold transition-all duration-300 min-w-[80px] ${
                        ssnMode === 'last4' 
                          ? 'text-white' 
                          : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100'
                      }`}
                    >
                      LAST 4
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setSsnMode('full9')}
                      className={`relative z-10 px-6 py-2 rounded-full text-sm font-semibold transition-all duration-300 min-w-[80px] ${
                        ssnMode === 'full9' 
                          ? 'text-white' 
                          : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100'
                      }`}
                    >
                      FULL 9
                    </button>
                  </div>
                </div>
                
                {/* Description based on selected mode */}
                <p className="text-gray-600 dark:text-gray-300">
                  {ssnMode === 'off' && "SSN information will not be collected during verification"}
                  {ssnMode === 'last4' && "Collect only the last 4 digits of SSN for enhanced security"}
                  {ssnMode === 'full9' && "Collect full SSN (XXX-XX-XXXX) for comprehensive verification"}
                </p>
              </div>

            </div>
          </div>

          {/* Use Case Context Selection */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <CubeIcon className="h-8 w-8 text-indigo-600" />
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                Use Case Context
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Healthcare Option */}
              <div 
                onClick={() => setUseCaseContext('healthcare')}
                className={`p-8 rounded-2xl border-2 transition-all duration-200 cursor-pointer ${
                  useCaseContext === 'healthcare'
                    ? 'border-rose-500 bg-gradient-to-r from-rose-50 to-pink-50 dark:from-rose-900/30 dark:to-pink-900/30 shadow-lg'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                }`}
              >
                <div className="flex flex-col items-center text-center">
                  <div className={`p-4 rounded-full mb-4 ${
                    useCaseContext === 'healthcare' ? 'bg-rose-100 dark:bg-rose-900/50' : 'bg-gray-100 dark:bg-gray-700'
                  }`}>
                    <HeartIcon className={`h-8 w-8 ${
                      useCaseContext === 'healthcare' ? 'text-rose-600' : 'text-gray-600 dark:text-gray-300'
                    }`} />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    Healthcare
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    For verifying you are treating the correct patient, and protecting their PHI.
                  </p>
                </div>
              </div>

              {/* Financial Services Option */}
              <div 
                onClick={() => setUseCaseContext('financial')}
                className={`p-8 rounded-2xl border-2 transition-all duration-200 cursor-pointer ${
                  useCaseContext === 'financial'
                    ? 'border-emerald-500 bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/30 dark:to-green-900/30 shadow-lg'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                }`}
              >
                <div className="flex flex-col items-center text-center">
                  <div className={`p-4 rounded-full mb-4 ${
                    useCaseContext === 'financial' ? 'bg-emerald-100 dark:bg-emerald-900/50' : 'bg-gray-100 dark:bg-gray-700'
                  }`}>
                    <BuildingOffice2Icon className={`h-8 w-8 ${
                      useCaseContext === 'financial' ? 'text-emerald-600' : 'text-gray-600 dark:text-gray-300'
                    }`} />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    Financial Services
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    For verifying your customer's identity, and ensuring they are eligible for financial services.
                  </p>
                </div>
              </div>

              {/* Generic Option */}
              <div 
                onClick={() => setUseCaseContext('generic')}
                className={`p-8 rounded-2xl border-2 transition-all duration-200 cursor-pointer ${
                  useCaseContext === 'generic'
                    ? 'border-indigo-500 bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/30 dark:to-blue-900/30 shadow-lg'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                }`}
              >
                <div className="flex flex-col items-center text-center">
                  <div className={`p-4 rounded-full mb-4 ${
                    useCaseContext === 'generic' ? 'bg-indigo-100 dark:bg-indigo-900/50' : 'bg-gray-100 dark:bg-gray-700'
                  }`}>
                    <CubeIcon className={`h-8 w-8 ${
                      useCaseContext === 'generic' ? 'text-indigo-600' : 'text-gray-600 dark:text-gray-300'
                    }`} />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    Generic
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                  AI-Powered Identity Verification for Digital Onboarding / Remote IDV Workflows
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Configuration Summary */}
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-2xl p-8 border border-indigo-100 dark:border-indigo-800">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Configuration Summary
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Products</div>
                <div className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">
                  {products.filter(p => p.enabled).length + (ssnMode !== 'off' ? 1 : 0)} enabled
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Use Case</div>
                <div className={`text-lg font-semibold ${
                  useCaseContext === 'healthcare' ? 'text-rose-600 dark:text-rose-400' :
                  useCaseContext === 'financial' ? 'text-emerald-600 dark:text-emerald-400' :
                  'text-indigo-600 dark:text-indigo-400'
                }`}>
                  {useCaseContext === 'healthcare' ? 'Healthcare' : 
                   useCaseContext === 'financial' ? 'Financial' : 'Generic'}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">SSN Collection</div>
                <div className={`text-lg font-semibold ${
                  ssnMode === 'off' ? 'text-gray-600 dark:text-gray-400' :
                  ssnMode === 'last4' ? 'text-orange-600 dark:text-orange-400' :
                  'text-red-600 dark:text-red-400'
                }`}>
                  {ssnMode === 'off' ? 'Off' : ssnMode === 'last4' ? 'Last 4 Digits' : 'Full 9 Digits'}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Reverification</div>
                <div className={`text-lg font-semibold ${
                  reverificationEnabled ? 'text-purple-600 dark:text-purple-400' : 'text-gray-600 dark:text-gray-400'
                }`}>
                  {reverificationEnabled ? 'Enabled' : 'Disabled'}
                </div>
              </div>
            </div>
          </div>

          {/* Start Demo Button */}
          <div className="pt-6">
            <button
              onClick={handleStartDemo}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-6 px-8 rounded-2xl transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center group"
            >
              <span className="text-lg">Start Demo Experience</span>
              <ChevronRightIcon className="h-6 w-6 ml-3 group-hover:translate-x-2 transition-transform duration-200" />
            </button>
          </div>
        </div>

        {/* Dev Navigation Links */}
        <div className="text-center mt-8 space-y-4">
          <button 
            onClick={() => setShowDevLinks(!showDevLinks)}
            className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium transition-colors duration-200"
          >
            {showDevLinks ? '↑ Hide dev' : '↓ dev'}
          </button>
          
          {showDevLinks && (
            <div className="space-y-2 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div>
                <button 
                  onClick={() => {
                    const dashboardParams = new URLSearchParams({
                      reverification: reverificationEnabled.toString(),
                      useCase: useCaseContext
                    });
                    window.location.href = `/dashboard?${dashboardParams.toString()}`;
                  }}
                  className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium transition-colors duration-200"
                >
                  → Dashboard
                </button>
              </div>
              
              <div>
                <button 
                  onClick={() => window.location.href = '/reverification/login'}
                  className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium transition-colors duration-200"
                >
                  → Reverification Page
                </button>
              </div>
              
              <div>
                <button 
                  onClick={() => window.location.href = '/webhook-response'}
                  className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium transition-colors duration-200"
                >
                  → Failed Webhook Page
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
