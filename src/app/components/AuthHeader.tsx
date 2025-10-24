"use client";

import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";

export default function AuthHeader() {
  const { data: session } = useSession();
  const pathname = usePathname();

  // Don't show header on login page
  if (pathname === "/login") {
    return null;
  }

  // Don't show header if not authenticated
  if (!session) {
    return null;
  }

  return (
    <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-end items-center h-14">
          {/* Right side - User info and logout */}
          <div className="flex items-center gap-3">
            {/* User email */}
            <div className="hidden sm:flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
              <svg
                className="w-4 h-4 text-indigo-500 dark:text-indigo-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              <span className="font-medium">{session.user?.email}</span>
            </div>

            {/* Logout button */}
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

