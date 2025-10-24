# OAuth Authentication Setup Guide

## ✅ Implementation Complete

OAuth authentication with Google has been successfully implemented in the feature branch `feature/oauth-authentication`.

---

## 📋 What Was Implemented

### 1. **NextAuth.js Integration**
- Installed `next-auth` package
- Created API route handler at `/api/auth/[...nextauth]`
- Configured Google OAuth provider
- Email domain restriction to only allow company emails

### 2. **Route Protection**
- Middleware to protect all routes (except login and public assets)
- Automatic redirect to login page for unauthenticated users

### 3. **User Interface**
- Beautiful login page with "Sign in with Google" button
- Error handling for unauthorized access attempts
- Header component showing logged-in user email
- Sign out button in header

### 4. **Session Management**
- SessionProvider wrapping entire app
- 30-day session duration
- JWT-based authentication

---

## 🔧 Local Setup Instructions

### Step 1: Configure Environment Variables

1. **Create your `.env.local` file** by copying the template:
   ```bash
   cp env.template .env.local
   ```

2. **Generate a NextAuth Secret**:
   ```bash
   openssl rand -base64 32
   ```
   Copy the output and paste it as `NEXTAUTH_SECRET` in your `.env.local`

3. **Add your Google OAuth credentials** from Google Cloud Console:
   - Copy your `Client ID` → paste as `GOOGLE_CLIENT_ID`
   - Copy your `Client Secret` → paste as `GOOGLE_CLIENT_SECRET`

4. **Set your company email domain**:
   - If your work email is `john@acme.com`, set `ALLOWED_EMAIL_DOMAIN=acme.com`

5. **Verify `NEXTAUTH_URL`**:
   - For local dev, it should be: `NEXTAUTH_URL=http://localhost:3000`

### Example `.env.local` file:
```env
NEXTAUTH_SECRET=abc123xyz789generatedSecret==
NEXTAUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=123456789-abc.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abc123def456
ALLOWED_EMAIL_DOMAIN=yourcompany.com
```

### Step 2: Test Locally

1. **Start the development server**:
   ```bash
   npm run dev
   ```

2. **Open your browser** to `http://localhost:3000`

3. **You should be redirected** to the login page

4. **Click "Sign in with Google"**

5. **Test the following scenarios**:
   - ✅ Sign in with your company email (should work)
   - ❌ Try signing in with personal Gmail (should be rejected)
   - ✅ Verify you can access all pages after login
   - ✅ Test the sign-out button

---

## 🚀 Deploying to Vercel

### Step 1: Update Google Cloud Console

1. Go to [Google Cloud Console - Credentials](https://console.cloud.google.com/apis/credentials)
2. Click on your OAuth 2.0 Client ID
3. Under **Authorized redirect URIs**, ensure you have:
   ```
   https://your-actual-vercel-domain.vercel.app/api/auth/callback/google
   ```
4. Click **SAVE**

### Step 2: Push to GitHub

```bash
# Ensure you're on the feature branch
git status

# Add all changes
git add .

# Commit changes
git commit -m "Add OAuth authentication with Google"

# Push to GitHub
git push origin feature/oauth-authentication
```

### Step 3: Configure Vercel Environment Variables

1. **Go to your Vercel Dashboard**
2. **Select your project**
3. **Go to Settings → Environment Variables**
4. **Add the following variables** (for Production, Preview, and Development):

   | Variable Name | Value | Example |
   |--------------|-------|---------|
   | `NEXTAUTH_SECRET` | Your generated secret | `abc123...` |
   | `NEXTAUTH_URL` | Your Vercel URL | `https://your-app.vercel.app` |
   | `GOOGLE_CLIENT_ID` | From Google Cloud | `123...apps.googleusercontent.com` |
   | `GOOGLE_CLIENT_SECRET` | From Google Cloud | `GOCSPX-...` |
   | `ALLOWED_EMAIL_DOMAIN` | Your company domain | `yourcompany.com` |

5. **Important**: Also add any **existing environment variables** you had before (API keys, etc.)

### Step 4: Test on Vercel Preview

1. **Vercel will automatically create a preview deployment** for your branch
2. **Find the preview URL** in your GitHub PR or Vercel dashboard
3. **Test the authentication flow** on the preview deployment:
   - Try logging in with company email
   - Try logging in with personal email (should fail)
   - Test all existing functionality

### Step 5: Merge to Production

Once testing is successful on the preview:

```bash
# Switch to main branch
git checkout main

# Merge the feature branch
git merge feature/oauth-authentication

# Push to production
git push origin main
```

Vercel will automatically deploy to production.

### Step 6: Remove Vercel Protection

1. **Go to Vercel Dashboard**
2. **Settings → Deployment Protection**
3. **Disable Vercel Authentication**
4. **Save changes**

Now your app is publicly accessible but protected by your OAuth implementation!

---

## 🧪 Testing Checklist

### Local Testing
- [ ] Can access login page
- [ ] "Sign in with Google" button works
- [ ] Company email authentication succeeds
- [ ] Personal email authentication is rejected
- [ ] Can access all protected pages after login
- [ ] User email displays in header
- [ ] Sign out button works
- [ ] After sign out, redirected to login
- [ ] Cannot access protected pages when logged out

### Production Testing
- [ ] Same tests as local, but on Vercel URL
- [ ] Test with multiple team members
- [ ] Verify existing Vouched functionality still works
- [ ] Check that API keys are not exposed in browser DevTools

---

## 🔐 Security Notes

### What's Protected:
- ✅ All routes require authentication (except login page)
- ✅ Only company email addresses can authenticate
- ✅ Sessions expire after 30 days
- ✅ Environment variables stored securely in Vercel

### What to Monitor:
- 🔍 Check Vercel logs for unauthorized access attempts
- 🔍 Monitor Google Cloud Console for OAuth usage
- 🔍 Regularly review who has access (Test Users in GCP)

---

## 🆘 Troubleshooting

### "Access Denied" Error
- **Cause**: Email domain doesn't match `ALLOWED_EMAIL_DOMAIN`
- **Solution**: Verify the domain is set correctly (without `@` symbol)

### "Configuration" Error
- **Cause**: Missing environment variables
- **Solution**: Check all variables are set in `.env.local` or Vercel

### Redirect URI Mismatch
- **Cause**: Google Cloud redirect URI doesn't match your URL
- **Solution**: Update authorized redirect URIs in Google Cloud Console

### Session Not Persisting
- **Cause**: `NEXTAUTH_SECRET` not set or changing
- **Solution**: Ensure secret is consistent across deployments

---

## 📞 Adding More Test Users

To add more users who can test the application:

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to **APIs & Services → OAuth consent screen**
3. Scroll to **Test users**
4. Click **ADD USERS**
5. Add their email addresses
6. Click **SAVE**

Note: You can add up to 100 test users in Testing mode.

---

## 🎉 Success!

Your Vouched Demo Portal now has professional OAuth authentication that:
- Restricts access to company emails only
- Provides a seamless Google sign-in experience
- Protects all demo pages and API endpoints
- Works in both local development and production
- Costs $0 (completely free!)

Your salespeople can now access the demo portal without Vercel accounts, but unauthorized users cannot access it.

