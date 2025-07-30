'use client';

import { useState } from 'react';
import { ChevronRightIcon, CheckIcon, ShieldCheckIcon, DocumentCheckIcon, UserGroupIcon } from '@heroicons/react/24/outline';

type FlowType = 'desktop' | 'phone';
type WorkflowType = 'simultaneous' | 'step-up';
type SSNMode = 'off' | 'last4' | 'full9';

interface Product {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
}

export default function ConfigurationPage() {
  const [flowType, setFlowType] = useState<FlowType>('desktop');
  const [workflowType, setWorkflowType] = useState<WorkflowType>('simultaneous');
  const [ssnMode, setSsnMode] = useState<SSNMode>('off');
  const [reverificationEnabled, setReverificationEnabled] = useState(false);
  const [products, setProducts] = useState<Product[]>([
    {
      id: 'id-verification',
      name: 'Visual ID Verification',
      description: 'Verify government-issued IDs with advanced fraud detection',
      enabled: true,
    },
    {
      id: 'crosscheck',
      name: 'CrossCheck',
      description: 'KYC Compliance with CrossCheck run simultaneously',
      enabled: true,
    },
    {
      id: 'dob-verification',
      name: 'DOB Verification',
      description: 'Asks user for DOB input and compares to ID',
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

  const handleStartDemo = () => {
    const enabledProducts = products.filter(p => p.enabled).map(p => p.id);
    
    // Add ssnPrivate to products if it's not 'off'
    if (ssnMode !== 'off') {
      enabledProducts.push('ssnPrivate');
    }
    
    console.log('Configuration:', {
      flowType,
      workflowType,
      enabledProducts,
      ssnMode,
      reverificationEnabled,
    });
    
    // Navigate to form fill page with configuration
    const params = new URLSearchParams({
      flow: flowType,
      workflow: workflowType,
      products: enabledProducts.join(','),
      ssnMode: ssnMode,
      reverification: reverificationEnabled.toString()
    });
    
    window.location.href = `/form-fill?${params.toString()}`;
  };

  const workflows = [
    {
      id: 'simultaneous',
      name: 'Simultaneous',
      description: 'Run checks simultaneously akin to VouchedFI',
      icon: ShieldCheckIcon,
    },
    {
      id: 'step-up',
      name: 'Step Up',
      description: 'Run checks sequentially, akin to VouchedRX',
      icon: DocumentCheckIcon,
    }
  ];

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
          {/* Flow Type Selection */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <UserGroupIcon className="h-8 w-8 text-indigo-600" />
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                Choose Your Flow
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <button
                onClick={() => setFlowType('desktop')}
                className={`p-8 rounded-2xl border-2 text-left transition-all duration-200 transform hover:scale-105 ${
                  flowType === 'desktop'
                    ? 'border-indigo-500 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 shadow-lg'
                    : 'border-gray-200 dark:border-gray-600 hover:border-indigo-300 dark:hover:border-indigo-400 hover:shadow-md'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Desktop Flow
                  </h3>
                  {flowType === 'desktop' && (
                    <div className="bg-indigo-500 rounded-full p-1">
                      <CheckIcon className="h-5 w-5 text-white" />
                    </div>
                  )}
                </div>
                <p className="text-gray-600 dark:text-gray-300">
                  User completes verification on desktop, then hands off to mobile device via QR code or SMS
                </p>
              </button>
              
              <button
                onClick={() => setFlowType('phone')}
                className={`p-8 rounded-2xl border-2 text-left transition-all duration-200 transform hover:scale-105 ${
                  flowType === 'phone'
                    ? 'border-indigo-500 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 shadow-lg'
                    : 'border-gray-200 dark:border-gray-600 hover:border-indigo-300 dark:hover:border-indigo-400 hover:shadow-md'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Phone Flow
                  </h3>
                  {flowType === 'phone' && (
                    <div className="bg-indigo-500 rounded-full p-1">
                      <CheckIcon className="h-5 w-5 text-white" />
                    </div>
                  )}
                </div>
                <p className="text-gray-600 dark:text-gray-300">
                  User completes entire verification process directly on mobile device
                </p>
              </button>
            </div>
          </div>

          {/* Workflow Selection */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <ShieldCheckIcon className="h-8 w-8 text-indigo-600" />
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                Select Workflow
              </h2>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {workflows.map((workflow) => {
                const IconComponent = workflow.icon;
                return (
                  <button
                    key={workflow.id}
                    onClick={() => setWorkflowType(workflow.id as WorkflowType)}
                    className={`p-8 rounded-2xl border-2 text-left transition-all duration-200 transform hover:scale-105 ${
                      workflowType === workflow.id
                        ? 'border-indigo-500 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 shadow-lg'
                        : 'border-gray-200 dark:border-gray-600 hover:border-indigo-300 dark:hover:border-indigo-400 hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <IconComponent className="h-6 w-6 text-indigo-600" />
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                          {workflow.name}
                        </h3>
                      </div>
                      {workflowType === workflow.id && (
                        <div className="bg-indigo-500 rounded-full p-1">
                          <CheckIcon className="h-5 w-5 text-white" />
                        </div>
                      )}
                    </div>
                    <p className="text-gray-600 dark:text-gray-300">
                      {workflow.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Product Selection */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <DocumentCheckIcon className="h-8 w-8 text-indigo-600" />
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                Configure Products
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {products.map((product) => (
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
              
              {/* Reverification Card - Spans 2 columns */}
              <div className="md:col-span-2 p-8 rounded-2xl border-2 border-gray-200 dark:border-gray-600 transition-all duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {/* Custom Face ID Icon */}
                    <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {/* Face circle */}
                      <circle cx="12" cy="12" r="4" strokeWidth="1.5"/>
                      {/* Eyes */}
                      <circle cx="10.5" cy="10.5" r="0.5" fill="currentColor"/>
                      <circle cx="13.5" cy="10.5" r="0.5" fill="currentColor"/>
                      {/* Mouth */}
                      <path d="M10.5 13.5c.5.5 1.5.5 3 0" strokeWidth="1.5" strokeLinecap="round"/>
                      {/* Scanning corners */}
                      <path d="M4 8V6a2 2 0 0 1 2-2h2" strokeWidth="2" strokeLinecap="round"/>
                      <path d="M20 8V6a2 2 0 0 0-2-2h-2" strokeWidth="2" strokeLinecap="round"/>
                      <path d="M4 16v2a2 2 0 0 0 2 2h2" strokeWidth="2" strokeLinecap="round"/>
                      <path d="M20 16v2a2 2 0 0 1-2 2h-2" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
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
                
                <p className="text-gray-600 dark:text-gray-300 mt-4">
                  Enable additional verification step after initial results for enhanced compliance and security validation
                </p>
              </div>
            </div>
          </div>



          {/* Configuration Summary */}
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-2xl p-8 border border-indigo-100 dark:border-indigo-800">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Configuration Summary
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              <div className="text-center">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Flow Type</div>
                <div className="text-lg font-semibold text-indigo-600 dark:text-indigo-400 capitalize">
                  {flowType}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Workflow</div>
                <div className="text-lg font-semibold text-indigo-600 dark:text-indigo-400">
                  {workflowType === 'simultaneous' ? 'Simultaneous' : 'Step Up'}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Products</div>
                <div className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">
                  {products.filter(p => p.enabled).length + (ssnMode !== 'off' ? 1 : 0)} enabled
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
      </div>
    </div>
  );
}
