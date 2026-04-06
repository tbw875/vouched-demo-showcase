'use client';

import { useState, useEffect } from 'react';

// Epic heart SVG (red heart with white EKG line)
function EpicHeart({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} xmlns="http://www.w3.org/2000/svg">
      <path
        d="M50 85 C50 85 10 60 10 35 C10 20 22 10 35 10 C42 10 48 14 50 18 C52 14 58 10 65 10 C78 10 90 20 90 35 C90 60 50 85 50 85Z"
        fill="#E05252"
      />
      {/* EKG line across the heart */}
      <path
        d="M18 45 L30 45 L35 35 L40 55 L45 40 L50 45 L55 45 L60 38 L65 50 L70 45 L82 45"
        fill="none"
        stroke="white"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Animated green checkmark
function GreenCheck() {
  return (
    <div className="flex items-center justify-center w-16 h-16 rounded-full bg-green-50 border-2 border-green-200">
      <svg viewBox="0 0 24 24" className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    </div>
  );
}

interface EpicJobData {
  id?: string;
  token?: string;
  status?: string;
  result?: {
    firstName?: string;
    lastName?: string;
    birthDate?: string;
    phone?: string;
    email?: string;
    sex?: string;
    address?: { postalCode?: string };
  };
}

interface EpicFormData {
  firstName?: string;
  lastName?: string;
  phone?: string;
  dateOfBirth?: string;
  email?: string;
}

function generateNonce(len = 44) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

function generateId(prefix = 'v1:') {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  return prefix + Array.from({ length: 16 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export default function EpicCompletePage() {
  // phase: 1 = vouched complete screen, 2a = epic loading, 2b = epic results
  const [phase, setPhase] = useState<'1' | '2a' | '2b'>('1');
  const [jobData, setJobData] = useState<EpicJobData | null>(null);
  const [formData, setFormData] = useState<EpicFormData | null>(null);
  const [sessionToken] = useState(() =>
    btoa(generateNonce(32)).replace(/[+/=]/g, c => ({ '+': '-', '/': '_', '=': '' }[c] || c))
  );
  const [issuerID] = useState(() => generateId('v1:'));
  const [nonce] = useState(() => generateNonce(44));
  const nowSec = Math.floor(Date.now() / 1000);

  useEffect(() => {
    try {
      const job = JSON.parse(localStorage.getItem('epicJobData') || 'null');
      setJobData(job);
    } catch { /* ignore */ }
    try {
      const fd = JSON.parse(localStorage.getItem('epicFormData') || 'null');
      setFormData(fd);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('2a'), 3000);
    return () => clearTimeout(t1);
  }, []);

  useEffect(() => {
    if (phase === '2a') {
      const t2 = setTimeout(() => setPhase('2b'), 2000);
      return () => clearTimeout(t2);
    }
  }, [phase]);

  // Build token claims from job data + form data
  const firstName = jobData?.result?.firstName || formData?.firstName || 'Oscar';
  const lastName = jobData?.result?.lastName || formData?.lastName || 'Sporer';
  const fullName = `${firstName} ${lastName}`;
  const email = formData?.email || jobData?.result?.email || 'Brooke73@gmail.com';
  const phone = formData?.phone ? `+1${formData.phone.replace(/\D/g, '')}` : '+18823590588';
  const dobIso = formData?.dateOfBirth || '2007-08-24'; // YYYY-MM-DD
  const [dobYear, dobMonth, dobDay] = dobIso.split('-');
  const dobFormatted = `${dobMonth}/${dobDay}/${dobYear}`;
  const zipCode = jobData?.result?.address?.postalCode || '78324';
  const legalSex = jobData?.result?.sex || 'male';

  const tokenClaims = [
    { type: 'aud', value: 'VouchedIdentity2713' },
    { type: 'birthDate', value: dobFormatted },
    { type: 'email', value: email },
    { type: 'emailVerified', value: '1' },
    { type: 'exp', value: String(nowSec + 3600) },
    { type: 'firstName', value: firstName },
    { type: 'fullName', value: fullName },
    { type: 'iat', value: String(nowSec) },
    { type: 'iso8601BirthDate', value: dobIso },
    { type: 'iss', value: 'https://epic.stage.vouched.id' },
    { type: 'issuerID', value: issuerID },
    { type: 'lastName', value: lastName },
    { type: 'legalSex', value: legalSex },
    { type: 'nonce', value: nonce },
    { type: 'phoneNumber', value: phone },
    { type: 'phoneNumberVerified', value: '1' },
    { type: 'sub', value: issuerID },
    { type: 'zipCode', value: zipCode },
  ];

  // Phase 1: Vouched "Verification Complete" screen
  if (phase === '1') {
    return (
      <div className="flex flex-col min-h-screen bg-white">
        <div className="bg-gray-50 border-b border-gray-200 px-4 py-2 text-center text-xs text-gray-400 tracking-wide">
          epic.stage.vouched.id
        </div>
        <div className="flex-1 flex flex-col items-center justify-center px-8 text-center gap-5">
          {/* Language selector cosmetic */}
          <div className="absolute top-10 right-5 flex items-center gap-1 text-xs text-gray-500 border border-gray-200 rounded px-2 py-1">
            <span>Language:</span>
            <span className="font-medium">English</span>
            <span className="text-gray-400">▾</span>
          </div>
          <GreenCheck />
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Verification Complete!</h2>
            <p className="text-sm text-gray-600">
              Your identity has been successfully verified. Redirecting you back to MyChart...
            </p>
          </div>
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-400 mt-2" />
        </div>
      </div>
    );
  }

  // Phase 2a + 2b: Simulated Epic redirect
  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Simulated browser chrome for vendorservices.epic.com */}
      <div className="flex items-center gap-3 px-3 py-2 bg-gray-100 border-b border-gray-200">
        <div className="flex items-center justify-center w-7 h-7 rounded-full bg-white border border-gray-200 text-gray-500 text-sm">
          ✕
        </div>
        <div className="flex-1 bg-white rounded-lg px-3 py-1.5 text-xs text-gray-700 font-medium border border-gray-200 flex items-center gap-2">
          <span className="text-gray-400">🔒</span>
          vendorservices.epic.com
          {phase === '2a' && (
            <div className="ml-auto w-3/4 h-0.5 bg-blue-500 rounded-full animate-pulse" />
          )}
        </div>
        <div className="flex items-center justify-center w-7 h-7 rounded-full bg-white border border-gray-200 text-gray-400 text-sm">
          ⋮
        </div>
      </div>

      {phase === '2a' ? (
        /* Loading state */
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <EpicHeart className="w-20 h-20" />
          <p className="text-sm text-gray-500">Please wait a moment...</p>
        </div>
      ) : (
        /* Results state */
        <div className="flex-1 overflow-y-auto px-4 py-5">
          <h1 className="text-base font-bold text-gray-900 mb-3">OpenID Connect ID Verification Test</h1>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/epic/vouched-verify-badge.png"
            alt="Vouched — Verify with Vouched"
            className="h-8 mb-5"
          />

          {/* Results table */}
          <h2 className="text-sm font-bold text-gray-900 mb-2">Results</h2>
          <table className="w-full text-xs border border-gray-200 rounded-lg overflow-hidden mb-6">
            <tbody>
              {[
                {
                  label: 'ID Verification Session Token',
                  value: sessionToken.slice(0, 44) + '=',
                },
                { label: 'OpenID Provider', value: 'VOUCHED - MYC ID TOKEN RETRIEVAL' },
                { label: 'EPT ID', value: '' },
                { label: 'WPR ID', value: '' },
                { label: 'Match Result', value: 'None' },
              ].map((row, i) => (
                <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-3 py-2 font-medium text-gray-700 border-b border-gray-200 align-top w-2/5">
                    {row.label}
                  </td>
                  <td className="px-3 py-2 text-gray-600 border-b border-gray-200 break-all">
                    {row.value}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Token Claims table */}
          <h2 className="text-sm font-bold text-gray-900 mb-2">Token Claims</h2>
          <table className="w-full text-xs border border-gray-200 rounded-lg overflow-hidden">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-3 py-2 text-left font-semibold text-blue-600 border-b border-gray-200">
                  Claim Type
                </th>
                <th className="px-3 py-2 text-left font-semibold text-blue-600 border-b border-gray-200">
                  Value
                </th>
              </tr>
            </thead>
            <tbody>
              {tokenClaims.map((claim, i) => (
                <tr key={claim.type} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-3 py-2 text-gray-600 border-b border-gray-100 font-mono">
                    {claim.type}
                  </td>
                  <td className="px-3 py-2 text-gray-800 border-b border-gray-100 break-all">
                    {claim.value}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
