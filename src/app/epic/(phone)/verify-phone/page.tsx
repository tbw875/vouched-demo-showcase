'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

function maskPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.length < 4) return raw;
  const last4 = digits.slice(-4);
  const areaCode = digits.slice(0, 3);
  return `+1 (${areaCode}) \u2022\u2022\u2022-${last4}`;
}

export default function EpicVerifyPhonePage() {
  const router = useRouter();
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(30);
  const [resendActive, setResendActive] = useState(false);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const [phone, setPhone] = useState('');

  useEffect(() => {
    try {
      const data = JSON.parse(localStorage.getItem('epicFormData') || '{}');
      setPhone(data.phone || '');
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (countdown <= 0) {
      setResendActive(true);
      return;
    }
    const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  function handleDigit(index: number, value: string) {
    const digit = value.replace(/\D/g, '').slice(-1);
    const next = [...code];
    next[index] = digit;
    setCode(next);
    setError('');
    if (digit && index < 5) {
      inputs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setCode(pasted.split(''));
      inputs.current[5]?.focus();
    }
  }

  function handleVerify() {
    const entered = code.join('');
    if (entered.length < 6) {
      setError('Please enter all 6 digits');
      return;
    }
    // Route based on mode saved during form entry
    try {
      const data = JSON.parse(localStorage.getItem('epicFormData') || '{}');
      const mode = data.mode || 'idv';
      router.push(mode === 'ial2' ? '/epic/crosscheck' : '/epic/verification');
    } catch {
      router.push('/epic/verification');
    }
  }

  function handleResend() {
    setCountdown(30);
    setResendActive(false);
    setCode(['', '', '', '', '', '']);
    inputs.current[0]?.focus();
  }

  const allFilled = code.every(d => d !== '');

  return (
    <div className="flex flex-col bg-white">
      <div className="bg-gray-50 border-b border-gray-200 px-4 py-2 text-center text-xs text-gray-400 tracking-wide">
        epic.stage.vouched.id
      </div>

      <div className="flex-1 flex flex-col px-5 py-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-3">Phone Verification</h1>
        <p className="text-sm text-gray-600 mb-8">
          We sent a 6-digit verification code to{' '}
          <span className="font-medium">{phone ? maskPhone(phone) : 'your phone'}</span>.
          Please enter it below.
        </p>

        <label className="block text-sm font-medium text-gray-700 mb-3">
          Verification Code
        </label>

        <div className="flex gap-2 mb-2" onPaste={handlePaste}>
          {code.map((digit, i) => (
            <input
              key={i}
              ref={el => { inputs.current[i] = el; }}
              type="tel"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={e => handleDigit(i, e.target.value)}
              onKeyDown={e => handleKeyDown(i, e)}
              className={`w-full h-12 border-2 rounded-lg text-center text-xl font-semibold focus:outline-none transition-colors ${
                error
                  ? 'border-red-400 focus:border-red-500'
                  : digit
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 focus:border-blue-500'
              }`}
            />
          ))}
        </div>

        {error && <p className="text-red-500 text-xs mb-4">{error}</p>}

        <button
          onClick={handleVerify}
          disabled={!allFilled}
          className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-medium py-3 rounded-lg transition-colors text-sm mt-4"
        >
          Verify
        </button>

        <div className="text-center mt-4">
          {resendActive ? (
            <button
              onClick={handleResend}
              className="text-blue-500 text-sm hover:underline"
            >
              Resend code
            </button>
          ) : (
            <span className="text-gray-400 text-sm">Resend code in {countdown}s</span>
          )}
        </div>
      </div>

      <div className="px-5 py-4 text-center space-y-1">
        <p className="text-xs text-gray-400">
          Your personal information is secure and will only be used for identity verification.
        </p>
        <p className="text-xs text-gray-400">
          This verification is powered by Vouched and meets healthcare security standards.
        </p>
      </div>
    </div>
  );
}
