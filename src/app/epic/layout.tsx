import { Suspense } from 'react';

export default function EpicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-100 flex items-start justify-center py-8 px-4">
      <div className="w-full max-w-[430px] bg-white rounded-3xl shadow-2xl overflow-hidden">
        <Suspense fallback={
          <div className="flex items-center justify-center min-h-[600px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        }>
          {children}
        </Suspense>
      </div>
    </div>
  );
}
