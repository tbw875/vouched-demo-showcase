import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

// Protect all routes except public ones
export default withAuth(
  function middleware() {
    // This function runs after the user is authenticated
    return NextResponse.next();
  },
  {
    callbacks: {
      // Return true to allow access, false to redirect to login
      authorized: ({ token }) => {
        // If there's a valid token, user is authenticated
        return !!token;
      },
    },
    pages: {
      signIn: "/login", // Redirect to login page if unauthorized
    },
  }
);

// Configure which routes to protect
export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - /login (login page - must be public)
     * - /api/auth (NextAuth API routes - must be public for OAuth flow)
     * - /_next/static (static files)
     * - /_next/image (image optimization)
     * - /favicon.ico, /file.svg, /globe.svg, etc (public files)
     */
    "/((?!login|api/auth|api/vouched-webhook|api/debug-webhook|_next/static|_next/image|.*\\.svg|.*\\.png|.*\\.ico).*)",
  ],
};

