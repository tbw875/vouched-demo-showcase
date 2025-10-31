'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ChevronRightIcon, UserIcon, PhoneIcon, EnvelopeIcon, CalendarIcon, IdentificationIcon, HomeIcon, MapPinIcon } from '@heroicons/react/24/outline';
import PageHeader from '../components/PageHeader';

interface VouchedConfig {
  flowType: 'desktop' | 'phone';
  workflowType: 'simultaneous' | 'step-up';
  enabledProducts: string[];
  disabledProducts: string[];
  ssnMode: 'off' | 'last4' | 'full9';
}

interface FormData {
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  dateOfBirth?: string;
  ssn?: string;
  ipAddress?: string;
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

interface FormField {
  id: keyof FormData;
  label: string;
  type: string;
  required: boolean;
  placeholder: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  pattern?: string;
  maxLength?: number;
}

function FormFillPageContent() {
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState<FormData>({});
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [isLoading, setIsLoading] = useState(false);
  
  // Parse configuration from URL params
  const config: VouchedConfig = {
    flowType: (searchParams.get('flow') as 'desktop' | 'phone') || 'desktop',
    workflowType: (searchParams.get('workflow') as 'simultaneous' | 'step-up') || 'simultaneous',
    enabledProducts: searchParams.get('products')?.split(',').filter(p => p) || ['id-verification'],
    disabledProducts: searchParams.get('disabledProducts')?.split(',').filter(p => p) || [],
    ssnMode: (searchParams.get('ssnMode') as 'off' | 'last4' | 'full9') || 'off'
  };
  
  const reverificationEnabled = searchParams.get('reverification') === 'true';
  const useCaseContext = searchParams.get('useCase') || 'financial';

  // Get user's IP address
  useEffect(() => {
    const fetchIpAddress = async () => {
      try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        setFormData(prev => ({ ...prev, ipAddress: data.ip }));
      } catch (error) {
        console.error('Failed to fetch IP address:', error);
        // Fallback to a placeholder
        setFormData(prev => ({ ...prev, ipAddress: 'Unable to detect' }));
      }
    };

    if (config.enabledProducts.includes('crosscheck')) {
      fetchIpAddress();
    }
  }, [config.enabledProducts]);

  // Generate form fields based on configuration
  const generateFormFields = (): FormField[] => {
    const fields: FormField[] = [];

    // Name fields - show for Visual IDV or CrossCheck
    if (config.enabledProducts.includes('id-verification') || config.enabledProducts.includes('crosscheck')) {
      fields.push(
        {
          id: 'firstName',
          label: 'First Name',
          type: 'text',
          required: true,
          placeholder: 'Enter your first name',
          icon: UserIcon
        },
        {
          id: 'lastName',
          label: 'Last Name',
          type: 'text',
          required: true,
          placeholder: 'Enter your last name',
          icon: UserIcon
        }
      );
    }

    // Additional CrossCheck fields (phone, email)
    if (config.enabledProducts.includes('crosscheck')) {
      fields.push(
        {
          id: 'phone',
          label: 'Phone Number',
          type: 'tel',
          required: true,
          placeholder: '(123) 456-7890',
          icon: PhoneIcon,
          pattern: '^[+]?[1-9]\\d{1,14}$'
        },
        {
          id: 'email',
          label: 'Email Address',
          type: 'email',
          required: true,
          placeholder: 'Enter your email address',
          icon: EnvelopeIcon
        }
      );

      // Add address fields for Healthcare use case
      if (useCaseContext === 'healthcare') {
        fields.push(
          {
            id: 'street',
            label: 'Street Address',
            type: 'text',
            required: true,
            placeholder: 'Enter your street address',
            icon: HomeIcon
          },
          {
            id: 'city',
            label: 'City',
            type: 'text',
            required: true,
            placeholder: 'Enter your city',
            icon: MapPinIcon
          },
          {
            id: 'state',
            label: 'State',
            type: 'text',
            required: true,
            placeholder: 'Enter your state',
            icon: MapPinIcon
          },
          {
            id: 'postalCode',
            label: 'Postal Code',
            type: 'text',
            required: true,
            placeholder: 'Enter your postal code',
            icon: MapPinIcon
          },
          {
            id: 'country',
            label: 'Country',
            type: 'text',
            required: false,
            placeholder: 'Enter your country (optional)',
            icon: MapPinIcon
          }
        );
      }
    }

    // DOB field - show for Visual IDV or DOB Verification
    if (config.enabledProducts.includes('id-verification') || config.enabledProducts.includes('dob-verification')) {
      fields.push({
        id: 'dateOfBirth',
        label: 'Date of Birth',
        type: 'date',
        required: true,
        placeholder: 'YYYY-MM-DD',
        icon: CalendarIcon
      });
    }

    // SSN field (show when ssnPrivate product is enabled)
    if (config.enabledProducts.includes('ssnPrivate')) {
      fields.push({
        id: 'ssn',
        label: `Social Security Number (${config.ssnMode === 'full9' ? 'Full 9 digits' : 'Last 4 digits'})`,
        type: 'text',
        required: false,
        placeholder: config.ssnMode === 'full9' ? '123-45-6789' : '6789',
        icon: IdentificationIcon,
        pattern: config.ssnMode === 'full9' ? '^\\d{3}-\\d{2}-\\d{4}$' : '^\\d{4}$',
        maxLength: config.ssnMode === 'full9' ? 11 : 4
      });
    }

    return fields;
  };

  const formFields = generateFormFields();

  const formatSSN = (value: string, mode: 'off' | 'last4' | 'full9') => {
    if (!value || mode === 'off') return value;
    
    // Clean the input for any non-digit values
    const ssn = value.replace(/[^\d]/g, '');
    
    if (mode === 'last4') {
      return ssn.slice(0, 4);
    } else {
      // Full 9-digit formatting
      const ssnLength = ssn.length;
      
      if (ssnLength < 4) return ssn;
      if (ssnLength < 6) {
        return `${ssn.slice(0, 3)}-${ssn.slice(3)}`;
      }
      return `${ssn.slice(0, 3)}-${ssn.slice(3, 5)}-${ssn.slice(5, 9)}`;
    }
  };

  const handleInputChange = (id: keyof FormData, value: string) => {
    let processedValue = value;
    
    // Format SSN if it's the SSN field and ssnPrivate is enabled
    if (id === 'ssn' && config.enabledProducts.includes('ssnPrivate') && config.ssnMode !== 'off') {
      processedValue = formatSSN(value, config.ssnMode);
    }
    
    setFormData(prev => ({ ...prev, [id]: processedValue }));
    
    // Clear error when user starts typing
    if (errors[id]) {
      setErrors(prev => ({ ...prev, [id]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {};

    formFields.forEach(field => {
      if (field.required && !formData[field.id]) {
        newErrors[field.id] = 'This field is required';
      } else if (formData[field.id] && field.pattern) {
        const regex = new RegExp(field.pattern);
        if (!regex.test(formData[field.id]!)) {
          newErrors[field.id] = 'Please enter a valid format';
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    // Save form data to localStorage for later display
    localStorage.setItem('vouchedFormData', JSON.stringify(formData));
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Navigate based on use case context
    const params = new URLSearchParams({
      flow: config.flowType,
      workflow: config.workflowType,
      products: config.enabledProducts.join(','),
      disabledProducts: config.disabledProducts.join(','),
      formData: JSON.stringify(formData),
      reverification: reverificationEnabled.toString(),
      useCase: useCaseContext
    });

    // Healthcare use case follows step-up workflow
    if (useCaseContext === 'healthcare') {
      window.location.href = `/healthcare/crosscheck-page?${params.toString()}`;
    } else {
      // All other use cases follow existing simultaneous workflow
      window.location.href = `/verification?${params.toString()}`;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-indigo-950 dark:via-slate-900 dark:to-purple-950">
      <div className="max-w-2xl mx-auto px-6 py-12">
        {/* Header */}
        <PageHeader/>
        
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Verify your Identity
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Please provide your personal information for verification
          </p>
        </div>

        {/* Form */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-700 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Dynamic Form Fields */}
            {formFields.map((field) => {
              const IconComponent = field.icon;
              return (
                <div key={field.id} className="space-y-2">
                  <label className="flex items-center gap-3 text-lg font-semibold text-gray-900 dark:text-white">
                    <IconComponent className="h-5 w-5 text-indigo-600" />
                    {field.label}
                    {field.required && <span className="text-red-500">*</span>}
                  </label>

                  <div className="relative">
                    <input
                      type={field.type}
                      id={field.id}
                      value={formData[field.id] || ''}
                      onChange={(e) => handleInputChange(field.id, e.target.value)}
                      placeholder={field.placeholder}
                      maxLength={field.maxLength}
                      className={`w-full px-4 py-3 pl-12 rounded-lg border transition-colors duration-200 ${
                        errors[field.id]
                          ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                          : 'border-gray-300 dark:border-gray-600 focus:border-indigo-500 focus:ring-indigo-500'
                      } bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2`}
                    />
                    <IconComponent className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                  </div>

                  {errors[field.id] && (
                    <p className="text-red-500 text-sm ml-8">{errors[field.id]}</p>
                  )}
                </div>
              );
            })}

            {/* Submit Button */}
            <div className="pt-6">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-4 px-8 rounded-2xl transition-all duration-200 transform hover:scale-105 disabled:hover:scale-100 shadow-lg hover:shadow-xl flex items-center justify-center group"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <span className="text-lg">Verify Identity</span>
                    <ChevronRightIcon className="h-6 w-6 ml-3 group-hover:translate-x-2 transition-transform duration-200" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
              </div>
      </div>
    );
  }

  export default function FormFillPage() {
    return (
      <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-indigo-950 dark:via-slate-900 dark:to-purple-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>}>
        <FormFillPageContent />
      </Suspense>
    );
  } 