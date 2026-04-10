import { Suspense } from 'react';

export default function EpicPhoneLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-100 flex items-start justify-center py-8 px-4">
      <div className="flex flex-col items-center w-full max-w-[390px]">
        <div className="w-full h-[calc(100dvh-4rem)] bg-white rounded-3xl shadow-2xl overflow-x-hidden overflow-y-auto [color-scheme:light]">
          <Suspense fallback={
            <div className="flex items-center justify-center min-h-[600px]">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          }>
            {children}
          </Suspense>
        </div>
        {/* Portal target for below-card content (e.g. dev fill button) */}
        <div id="epic-phone-below" className="w-full" />
      </div>
    </div>
  );
}
