'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface FormData {
  firstName: string;
  lastName: string;
  phone: string;
  dateOfBirth: string; // ISO: YYYY-MM-DD
  email: string;
  consent: boolean;
}

// Calendar date picker component
function DatePicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (iso: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(() => {
    if (value) return new Date(value + 'T00:00:00').getFullYear();
    return new Date().getFullYear() - 30;
  });
  const [viewMonth, setViewMonth] = useState(() => {
    if (value) return new Date(value + 'T00:00:00').getMonth();
    return 0;
  });
  const ref = useRef<HTMLDivElement>(null);

  const selectedDate = value ? new Date(value + 'T00:00:00') : null;

  const displayValue = selectedDate
    ? selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : '';

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  }

  function selectDay(day: number) {
    const mm = String(viewMonth + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    onChange(`${viewYear}-${mm}-${dd}`);
    setOpen(false);
  }

  function isSelected(day: number) {
    if (!selectedDate) return false;
    return selectedDate.getFullYear() === viewYear &&
      selectedDate.getMonth() === viewMonth &&
      selectedDate.getDate() === day;
  }

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div ref={ref} className="relative">
      <input
        type="text"
        readOnly
        value={displayValue}
        placeholder="Date of Birth"
        onClick={() => setOpen(o => !o)}
        className="border border-gray-200 rounded-lg px-4 py-3 w-full focus:outline-none focus:ring-2 focus:ring-blue-400 cursor-pointer bg-white text-gray-900 text-sm shadow-sm"
      />
      {open && (
        <div className="absolute z-50 top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <button onClick={prevMonth} className="p-1 hover:bg-gray-100 rounded-full text-gray-600">
              ‹
            </button>
            <span className="font-semibold text-gray-900 text-sm">
              {MONTHS[viewMonth]} {viewYear}
            </span>
            <button onClick={nextMonth} className="p-1 hover:bg-gray-100 rounded-full text-gray-600">
              ›
            </button>
          </div>
          <div className="grid grid-cols-7 mb-1">
            {DAYS.map(d => (
              <div key={d} className="text-center text-xs text-gray-400 font-medium py-1">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {cells.map((day, i) =>
              day === null ? (
                <div key={`empty-${i}`} />
              ) : (
                <button
                  key={day}
                  onClick={() => selectDay(day)}
                  className={`w-8 h-8 mx-auto flex items-center justify-center rounded-full text-sm transition-colors ${
                    isSelected(day)
                      ? 'bg-blue-500 text-white font-semibold'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {day}
                </button>
              )
            )}
          </div>
          <div className="flex justify-between mt-3 pt-3 border-t border-gray-100">
            <button
              onClick={() => { onChange(''); setOpen(false); }}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Reset
            </button>
            <button
              onClick={() => setOpen(false)}
              className="flex items-center justify-center w-7 h-7 bg-blue-500 rounded-full text-white"
            >
              ✓
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function EpicFormPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormData>({
    firstName: '',
    lastName: '',
    phone: '',
    dateOfBirth: '',
    email: '',
    consent: false,
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showDev, setShowDev] = useState(false);

  useEffect(() => {
    localStorage.removeItem('epicFormData');
    localStorage.removeItem('epicJobData');
  }, []);

  const isValid =
    form.firstName.trim() &&
    form.lastName.trim() &&
    form.phone.trim() &&
    form.dateOfBirth &&
    form.email.trim() &&
    form.consent;

  function handleChange(field: keyof FormData, value: string | boolean) {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
  }

  function validate(): boolean {
    const newErrors: Partial<Record<keyof FormData, string>> = {};
    if (!form.firstName.trim()) newErrors.firstName = 'Required';
    if (!form.lastName.trim()) newErrors.lastName = 'Required';
    if (!form.phone.trim()) newErrors.phone = 'Required';
    else if (form.phone.replace(/\D/g, '').length !== 10) newErrors.phone = 'Enter a valid 10-digit US number';
    if (!form.dateOfBirth) newErrors.dateOfBirth = 'Required';
    if (!form.email.trim()) newErrors.email = 'Required';
    if (!form.consent) newErrors.consent = 'You must consent to continue';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setIsLoading(true);
    localStorage.setItem('epicFormData', JSON.stringify({
      firstName: form.firstName,
      lastName: form.lastName,
      phone: form.phone,
      dateOfBirth: form.dateOfBirth,
      email: form.email,
    }));
    router.push('/epic/verify-phone');
  }

  function devFill() {
    setForm({
      firstName: 'Tom',
      lastName: 'Walsh',
      phone: '2067195992',
      dateOfBirth: '1990-07-15',
      email: 'charger875@gmail.com',
      consent: true,
    });
    setErrors({});
  }

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <div className="bg-gray-50 border-b border-gray-200 px-4 py-2 text-center text-xs text-gray-400 tracking-wide">
        epic.stage.vouched.id
      </div>

      <div className="flex-1 px-5 py-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Personal Information</h1>
        <p className="text-sm text-gray-500 mb-6">
          Please provide your personal details before proceeding with identity verification.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
            <input
              type="text"
              value={form.firstName}
              onChange={e => handleChange('firstName', e.target.value)}
              className={`border rounded-lg px-4 py-3 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-sm ${errors.firstName ? 'border-red-400' : 'border-gray-200'}`}
            />
            {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
            <input
              type="text"
              value={form.lastName}
              onChange={e => handleChange('lastName', e.target.value)}
              className={`border rounded-lg px-4 py-3 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-sm ${errors.lastName ? 'border-red-400' : 'border-gray-200'}`}
            />
            {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
            <div className={`flex items-center border rounded-lg overflow-hidden shadow-sm ${errors.phone ? 'border-red-400' : 'border-gray-200'} focus-within:ring-2 focus-within:ring-blue-400`}>
              <div className="flex items-center gap-1 px-3 py-3 bg-white border-r border-gray-200 text-sm text-gray-600 shrink-0">
                <span>🇺🇸</span>
                <span className="text-gray-400">▾</span>
              </div>
              <input
                type="tel"
                value={form.phone}
                onChange={e => handleChange('phone', e.target.value.replace(/\D/g, ''))}
                placeholder="(555) 555-5555"
                className="flex-1 px-3 py-3 text-sm focus:outline-none bg-white"
              />
            </div>
            {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
            <DatePicker
              value={form.dateOfBirth}
              onChange={val => handleChange('dateOfBirth', val)}
            />
            {errors.dateOfBirth && <p className="text-red-500 text-xs mt-1">{errors.dateOfBirth}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <input
              type="email"
              value={form.email}
              onChange={e => handleChange('email', e.target.value)}
              className={`border rounded-lg px-4 py-3 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-sm ${errors.email ? 'border-red-400' : 'border-gray-200'}`}
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
          </div>

          <div className="flex items-start gap-3 pt-1">
            <input
              type="checkbox"
              id="consent"
              checked={form.consent}
              onChange={e => handleChange('consent', e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-blue-500 shrink-0 cursor-pointer"
            />
            <label htmlFor="consent" className="text-xs text-gray-600 leading-relaxed cursor-pointer">
              By continuing, you (or, if under 18, your parent/guardian) consent to the collection, use,
              and storage of your information, including biometric data, as described in our{' '}
              <a href="#" className="text-blue-500 underline">End User Privacy Statement</a>,{' '}
              <a href="#" className="text-blue-500 underline">Biometric Privacy Notice</a>{' '}
              and{' '}
              <a href="#" className="text-blue-500 underline">End User Terms</a>.{' '}
              If under 18, consent must come from your parent/guardian. Children 13 and under may not
              directly use the service to capture facial images; a parent/guardian must do so on their behalf.
            </label>
          </div>
          {errors.consent && <p className="text-red-500 text-xs -mt-2">{errors.consent}</p>}

          <div className="pt-2">
            <button
              type="submit"
              disabled={!isValid || isLoading}
              className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-medium py-3 rounded-lg transition-colors text-sm"
            >
              {isLoading ? 'Continuing...' : 'Continue'}
            </button>
          </div>
        </form>

        <div className="mt-6 bg-gray-50 rounded-xl p-4 border border-gray-100">
          <h2 className="font-bold text-gray-900 text-sm mb-3">What you&apos;ll need next:</h2>
          <ul className="space-y-2">
            {[
              'A valid government-issued photo ID (driver\u2019s license, passport, or state ID)',
              'Access to your device\u2019s camera for selfie verification',
              'A few minutes to complete the verification process',
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-green-500 font-bold shrink-0 mt-0.5">✓</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
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

      <div className="text-center pb-4">
        <button
          onClick={() => setShowDev(d => !d)}
          className="text-gray-300 text-xs hover:text-gray-400 transition-colors"
        >
          {showDev ? '↑ hide dev' : '↓ dev'}
        </button>
        {showDev && (
          <div className="mt-2">
            <button
              onClick={devFill}
              className="text-xs text-gray-400 hover:text-gray-600 underline"
            >
              → Fill with Tom&apos;s Info
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
