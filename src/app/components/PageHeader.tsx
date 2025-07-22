"use client";

import { ChevronLeftIcon } from '@heroicons/react/24/outline';

interface PageHeaderProps {
  pageTitle: string;
  showBackButton?: boolean;
  backButtonText?: string;
  onBackClick?: () => void;
}

export default function PageHeader({ 
  pageTitle, 
  showBackButton = true, 
  backButtonText = "Back to Configuration",
  onBackClick 
}: PageHeaderProps) {
  const handleBackClick = () => {
    if (onBackClick) {
      onBackClick();
    } else {
      window.location.href = '/';
    }
  };

  return (
    <div className="flex items-center justify-between mb-8">
      {showBackButton ? (
        <button
          onClick={handleBackClick}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
        >
          <ChevronLeftIcon className="h-5 w-5" />
          {backButtonText}
        </button>
      ) : (
        <div></div> // Spacer for layout
      )}
      
      <div className="flex items-center gap-3">
        <div className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold text-xl">
          Vouched
        </div>
        <div className="text-gray-600 dark:text-gray-300">
          {pageTitle}
        </div>
      </div>
    </div>
  );
} 