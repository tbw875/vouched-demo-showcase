'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import PageHeader from '@/app/components/PageHeader';
import { CheckCircleIcon, DevicePhoneMobileIcon, EnvelopeIcon, ClockIcon } from '@heroicons/react/24/outline';

interface FormData {
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  ipAddress?: string;
}

type InviteStatus = 'idle' | 'sending' | 'sent' | 'error';

interface InviteResult {
  success: boolean;
  invite?: Record<string, unknown>;
  sentPayload?: {
    type: string;
    contact: string;
    firstName: string;
    lastName: string;
    phone: string;
    email?: string;
    callbackURL: string;
    send: boolean;
  };
  error?: string;
  details?: unknown;
}

function IAL2IDVPageContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<InviteStatus>('idle');
  const [result, setResult] = useState<InviteResult | null>(null);
  const [showBehindScenes, setShowBehindScenes] = useState(false);

  const reverificationEnabled = searchParams.get('reverification') === 'true';
  const useCaseContext = searchParams.get('useCase') || 'ial2';

  const formData: FormData = searchParams.get('formData')
    ? JSON.parse(searchParams.get('formData')!)
    : {};

  const handleSendInvite = async () => {
    setStatus('sending');
    setResult(null);

    try {
      const response = await fetch('/api/ial2/send-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: formData.firstName || '',
          lastName: formData.lastName || '',
          phone: formData.phone || '',
          email: formData.email,
        }),
      });

      const data: InviteResult = await response.json();

      if (!response.ok || !data.success) {
        setStatus('error');
        setResult(data);
      } else {
        setStatus('sent');
        setResult(data);
      }
    } catch (err) {
      setStatus('error');
      setResult({ success: false, error: err instanceof Error ? err.message : 'Network error' });
    }
  };

  const handleContinueToDashboard = () => {
    const dashboardParams = new URLSearchParams({
      useCase: useCaseContext,
      reverification: reverificationEnabled.toString(),
    });
    window.location.href = `/dashboard?${dashboardParams.toString()}`;
  };

  const maskedPhone = formData.phone
    ? `(***) ***-${formData.phone.replace(/\D/g, '').slice(-4)}`
    : 'phone on file';

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-purple-50 dark:from-violet-950 dark:via-slate-900 dark:to-purple-950">
      <div className="max-w-3xl mx-auto px-6 py-12">

        {/* Header */}
        <PageHeader />

        {/* IAL2 badge + title */}
        <div className="text-center mb-10 mt-8">
          <div className="inline-flex items-center gap-2 bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 px-4 py-1.5 rounded-full text-sm font-semibold mb-4">
            IAL-2 Compliant Workflow
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Identity Verification — Step 2 of 2
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            IAL2 requires the user to complete ID verification on their own device via a secure SMS link.
          </p>
        </div>

        {/* Progress */}
        <div className="flex items-center mb-10">
          <div className="flex items-center">
            <div className="flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold text-white bg-green-500">
              <CheckCircleIcon className="h-5 w-5" />
            </div>
            <span className="ml-3 text-sm font-medium text-green-600 dark:text-green-400">CrossCheck</span>
          </div>
          <div className="flex-1 mx-4 h-1 rounded bg-green-400"></div>
          <div className="flex items-center">
            <div className="flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold text-white bg-violet-600">
              2
            </div>
            <span className="ml-3 text-sm font-medium text-violet-600 dark:text-violet-400">ID + DL Verification</span>
          </div>
        </div>

        {/* Main card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden mb-6">

          {/* Card header */}
          <div className="bg-gradient-to-r from-violet-600 to-purple-600 px-6 py-5 flex items-center gap-4">
            <div className="bg-white/20 rounded-xl p-3">
              <DevicePhoneMobileIcon className="h-7 w-7 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Send Verification Link via SMS</h2>
              <p className="text-violet-200 text-sm">
                IAL2 compliance requires on-device ID capture — no browser camera access
              </p>
            </div>
          </div>

          <div className="p-6 space-y-6">

            {/* Recipient summary */}
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 space-y-3">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Invite recipient</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Name</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {formData.firstName || '—'} {formData.lastName || ''}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Mobile number</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{maskedPhone}</p>
                </div>
                {formData.email && (
                  <div className="col-span-2">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Email</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{formData.email}</p>
                  </div>
                )}
              </div>
            </div>

            {/* What happens */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">What happens next</p>
              <div className="flex items-start gap-3">
                <EnvelopeIcon className="h-5 w-5 text-violet-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  A secure SMS is sent to the user&apos;s mobile number with a unique Vouched verification link.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <DevicePhoneMobileIcon className="h-5 w-5 text-violet-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  The user opens the link on their phone, captures their ID and selfie with the native camera, and submits.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircleIcon className="h-5 w-5 text-violet-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Vouched validates the ID, runs Driver&apos;s License Validation, and posts results to the webhook.
                </p>
              </div>
            </div>

            {/* DL callout */}
            <div className="bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 rounded-xl p-4 flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                <svg className="h-5 w-5 text-violet-600 dark:text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-violet-900 dark:text-violet-100">Driver&apos;s License Validation + NIST IAL2</p>
                <p className="text-xs text-violet-700 dark:text-violet-300 mt-0.5">
                  ID Authenticity · Selfie Liveness · DL Number Validation · <code className="font-mono">nist.ial2ComplianceEnabled: true</code>
                </p>
              </div>
            </div>

            {/* Action / status area */}
            {status === 'idle' && (
              <button
                onClick={handleSendInvite}
                className="w-full py-4 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-3 text-base"
              >
                <DevicePhoneMobileIcon className="h-5 w-5" />
                Send Verification SMS to {maskedPhone}
              </button>
            )}

            {status === 'sending' && (
              <div className="flex items-center justify-center gap-3 py-4 text-violet-600 dark:text-violet-400">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-violet-600"></div>
                <span className="font-medium">Sending SMS invite via Vouched API…</span>
              </div>
            )}

            {status === 'sent' && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
                  <CheckCircleIcon className="h-6 w-6 text-green-500 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-green-800 dark:text-green-200">SMS invite sent successfully</p>
                    <p className="text-xs text-green-700 dark:text-green-300 mt-0.5">
                      The user will receive a text message with a secure verification link.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
                  <ClockIcon className="h-6 w-6 text-amber-500 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">Awaiting user completion</p>
                    <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
                      In a real deployment, the webhook receives the result automatically. For this demo, continue to the dashboard.
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleContinueToDashboard}
                  className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-3 text-base"
                >
                  <CheckCircleIcon className="h-5 w-5" />
                  Continue to Dashboard
                </button>
              </div>
            )}

            {status === 'error' && (
              <div className="space-y-4">
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                  <p className="text-sm font-semibold text-red-800 dark:text-red-200">Failed to send invite</p>
                  <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                    {result?.error || 'An unexpected error occurred.'}
                  </p>
                </div>
                <button
                  onClick={handleSendInvite}
                  className="w-full py-3 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-xl transition-colors"
                >
                  Retry
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Behind the scenes panel */}
        <div className="bg-gray-900 dark:bg-gray-950 rounded-2xl border border-gray-700 overflow-hidden">
          <button
            onClick={() => setShowBehindScenes(!showBehindScenes)}
            className="w-full px-6 py-4 flex items-center justify-between text-left"
          >
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse"></div>
              <span className="text-sm font-semibold text-gray-200">Behind the scenes — API request</span>
            </div>
            <svg
              className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${showBehindScenes ? 'rotate-180' : ''}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showBehindScenes && (
            <div className="px-6 pb-6 space-y-4">
              {/* Endpoint */}
              <div className="space-y-1">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Endpoint</p>
                <div className="flex items-center gap-2 bg-gray-800 rounded-lg px-4 py-2">
                  <span className="text-xs font-bold text-green-400 font-mono">POST</span>
                  <span className="text-xs text-gray-300 font-mono">https://verify.vouched.id/api/invites</span>
                </div>
              </div>

              {/* Auth */}
              <div className="space-y-1">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Authentication</p>
                <div className="bg-gray-800 rounded-lg px-4 py-2">
                  <span className="text-xs text-gray-300 font-mono">X-API-Key: <span className="text-amber-400">••••••••••••••••</span></span>
                </div>
              </div>

              {/* Request body — shown dynamically after send */}
              <div className="space-y-1">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Request body {status === 'idle' ? '(preview)' : '(sent)'}
                </p>
                <pre className="bg-gray-800 rounded-lg px-4 py-3 text-xs text-gray-300 font-mono overflow-x-auto whitespace-pre">
{status === 'sent' && result?.sentPayload
  ? JSON.stringify(result.sentPayload, null, 2)
  : JSON.stringify({
      type: 'idv',
      contact: 'phone',
      firstName: formData.firstName || '<firstName>',
      lastName: formData.lastName || '<lastName>',
      phone: formData.phone || '<phone>',
      ...(formData.email ? { email: formData.email } : {}),
      callbackURL: 'https://<your-domain>/api/vouched-webhook',
      send: true,
    }, null, 2)}
                </pre>
              </div>

              {/* Response — shown after sent */}
              {(status === 'sent' || status === 'error') && result && (
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Vouched API response
                  </p>
                  <pre className="bg-gray-800 rounded-lg px-4 py-3 text-xs font-mono overflow-x-auto whitespace-pre">
                    <span className={status === 'sent' ? 'text-green-400' : 'text-red-400'}>
                      {JSON.stringify(status === 'sent' ? result.invite : result.details ?? result.error, null, 2)}
                    </span>
                  </pre>
                </div>
              )}

              {/* nist config note */}
              <div className="space-y-1">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">NIST IAL2 account config</p>
                <pre className="bg-gray-800 rounded-lg px-4 py-3 text-xs text-violet-300 font-mono overflow-x-auto whitespace-pre">
{`{
  "nist": {
    "ial2ComplianceEnabled": true
  }
}`}
                </pre>
                <p className="text-xs text-gray-500 mt-1">
                  Set at the account level in Vouched — enforces NIST SP 800-63A IAL2 evidence requirements on this job.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function IAL2IDVPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-purple-50 dark:from-violet-950 dark:via-slate-900 dark:to-purple-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-violet-600"></div>
      </div>
    }>
      <IAL2IDVPageContent />
    </Suspense>
  );
}
