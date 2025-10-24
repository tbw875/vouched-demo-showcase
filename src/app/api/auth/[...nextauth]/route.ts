import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

// Configure NextAuth options
export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
  ],
  pages: {
    signIn: "/login", // Custom login page
    error: "/login", // Error page redirects to login
  },
  callbacks: {
    // Control who can sign in based on email domain
    async signIn({ user }) {
      const allowedDomain = process.env.ALLOWED_EMAIL_DOMAIN || "";
      
      if (!allowedDomain) {
        console.error("ALLOWED_EMAIL_DOMAIN is not set in environment variables");
        return false;
      }

      const email = user.email || "";
      
      // Check if email ends with the allowed domain
      if (email.endsWith(`@${allowedDomain}`)) {
        return true;
      }
      
      // Reject sign-in for emails not matching the allowed domain
      console.log(`Sign-in rejected for email: ${email}`);
      return false;
    },
    
    // Add email to the session object
    async session({ session, token }) {
      if (session.user) {
        session.user.email = token.email as string;
      }
      return session;
    },
    
    // Add email to the JWT token
    async jwt({ token, user }) {
      if (user) {
        token.email = user.email;
      }
      return token;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
};

// Create the NextAuth handler
const handler = NextAuth(authOptions);

// Export for both GET and POST requests
export { handler as GET, handler as POST };

