'use client';

import { useState } from 'react';
import { ChevronRightIcon, CheckIcon } from '@heroicons/react/24/outline';

type FlowType = 'desktop' | 'phone';
type WorkflowType = 'VouchedRX' | 'VouchedFI' | 'custom';

interface Product {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
}

export default function ConfigurationPage() {
  const [flowType, setFlowType] = useState<FlowType>('desktop');
  const [workflowType, setWorkflowType] = useState<WorkflowType>('VouchedRX');
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
    console.log('Configuration:', {
      flowType,
      workflowType,
      enabledProducts: products.filter(p => p.enabled).map(p => p.id),
    });
    // TODO: Navigate to next step
  };

  const workflows = [
    {
      id: 'simultaneous',
      name: 'Simultaneous',
      description: 'Run checks simultaneously akin to VouchedFI',
    },
    {
      id: 'step-up',
      name: 'Step Up',
      description: 'Run checks sequentially, akin to VouchedRX',
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-4">
            Vouched Identity Verification
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Configure your demo experience to showcase Vouched's powerful identity verification solutions
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 space-y-8">
          {/* Flow Type Selection */}
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
              Choose Your Flow
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => setFlowType('desktop')}
                className={`p-6 rounded-xl border-2 text-left transition-all ${
                  flowType === 'desktop'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">
                    Desktop Flow
                  </h3>
                  {flowType === 'desktop' && (
                    <CheckIcon className="h-5 w-5 text-blue-500" />
                  )}
                </div>
                <p className="text-slate-600 dark:text-slate-400">
                  User completes verification on desktop, then hands off to mobile device
                </p>
              </button>
              
              <button
                onClick={() => setFlowType('phone')}
                className={`p-6 rounded-xl border-2 text-left transition-all ${
                  flowType === 'phone'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">
                    Phone Flow
                  </h3>
                  {flowType === 'phone' && (
                    <CheckIcon className="h-5 w-5 text-blue-500" />
                  )}
                </div>
                <p className="text-slate-600 dark:text-slate-400">
                  User completes entire verification process directly on mobile device
                </p>
              </button>
            </div>
          </div>

          {/* Workflow Selection */}
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
              Select Workflow
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {workflows.map((workflow) => (
                <button
                  key={workflow.id}
                  onClick={() => setWorkflowType(workflow.id as WorkflowType)}
                  className={`p-6 rounded-xl border-2 text-left transition-all ${
                    workflowType === workflow.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">
                      {workflow.name}
                    </h3>
                    {workflowType === workflow.id && (
                      <CheckIcon className="h-5 w-5 text-blue-500" />
                    )}
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 mb-4">
                    {workflow.description}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Product Selection */}
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
              Configure Products
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {products.map((product) => (
                <div
                  key={product.id}
                  className={`p-6 rounded-xl border-2 transition-all ${
                    product.enabled
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                      : 'border-slate-200 dark:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">
                      {product.name}
                    </h3>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={product.enabled}
                        onChange={() => toggleProduct(product.id)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400">
                    {product.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Configuration Summary */}
          <div className="bg-slate-50 dark:bg-slate-700 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
              Configuration Summary
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Flow Type:</span>
                <span className="font-medium text-slate-900 dark:text-slate-100 capitalize">
                  {flowType}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Workflow:</span>
                <span className="font-medium text-slate-900 dark:text-slate-100">
                  {workflowType}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Products:</span>
                <span className="font-medium text-slate-900 dark:text-slate-100">
                  {products.filter(p => p.enabled).length} enabled
                </span>
              </div>
            </div>
          </div>

          {/* Start Demo Button */}
          <div className="pt-6">
            <button
              onClick={handleStartDemo}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-4 px-6 rounded-xl transition-colors flex items-center justify-center group"
            >
              Start Demo Experience
              <ChevronRightIcon className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
