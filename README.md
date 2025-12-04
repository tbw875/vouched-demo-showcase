# Vouched Demo Showcase

An interactive demo application showcasing Vouched's AI-powered identity verification solutions. Built with Next.js 15, this application demonstrates configurable identity verification workflows for healthcare, financial services, and general use cases.

## Features

### Identity Verification Products

- **Visual ID Verification (IDV)** – AI-powered verification of government-issued IDs with advanced fraud and deepfake detection
- **CrossCheck** – Know Your Customer (KYC) verification with PII risk assessment
- **DOB Verification** – User-provided date of birth comparison against ID data
- **SSN Collection & Verification** – Collect and verify Social Security Numbers (Last 4 or Full 9 digits)
- **Driver's License Verification** – Verify driver's license information and authenticity
- **AML Check** – Anti-Money Laundering checks against OFAC, PEP, and watchlists *(coming soon)*

### Use Case Contexts

- **Healthcare** – Patient identity verification and PHI protection
- **Financial Services** – Customer onboarding and compliance verification
- **Generic** – Digital onboarding and remote IDV workflows

### Additional Features

- **Reverification Flow** – Re-authenticate previously verified users
- **Google OAuth Authentication** – Restrict demo access to authorized company emails
- **Vercel Analytics** – Real user performance monitoring and Core Web Vitals tracking
- **KYA Detection** – Know Your Agent detection for identifying AI agent access

---

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm, yarn, pnpm, or bun

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd vouched-demo-showcase

# Install dependencies
npm install
```

### Environment Configuration

Create a `.env.local` file in the project root:

```bash
cp env.template .env.local
```

Configure the following environment variables:

```env
# ==============================================
# NextAuth.js OAuth Configuration
# ==============================================

# Generate with: openssl rand -base64 32
NEXTAUTH_SECRET=your-nextauth-secret-here

# Your app's URL (http://localhost:3000 for local dev)
NEXTAUTH_URL=http://localhost:3000

# Google OAuth Credentials
# Get from: https://console.cloud.google.com/apis/credentials
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Email Domain Restriction (e.g., yourcompany.com)
ALLOWED_EMAIL_DOMAIN=your-company-domain.com

# ==============================================
# Vouched Configuration
# ==============================================

# Public App ID (safe for client-side)
NEXT_PUBLIC_VOUCHED_APP_ID=your-vouched-app-id

# Private API Key (server-side only)
VOUCHED_PRIVATE_KEY=your-vouched-private-key

# ==============================================
# KYA (Know Your Agent) Detection (Optional)
# ==============================================

# Project ID for KYA detection pixel
NEXT_PUBLIC_KYA_PROJECT_ID=your-kya-project-id
```

### Running the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/    # NextAuth.js API routes
│   │   ├── healthcare/            # Healthcare-specific API routes
│   │   └── routes/                # SSN verify and webhook endpoints
│   ├── components/
│   │   ├── AuthHeader.tsx
│   │   ├── PageHeader.tsx
│   │   └── SessionProvider.tsx
│   ├── dashboard/                 # User dashboard
│   ├── form-fill/                 # Data collection form
│   ├── healthcare/                # Healthcare-specific pages
│   │   ├── crosscheck-page/
│   │   ├── dob-page/
│   │   └── idv-page/
│   ├── login/                     # OAuth login page
│   ├── results/                   # Verification results display
│   ├── reverification/            # Reverification flow
│   ├── verification/              # Main verification page
│   └── webhook-response/          # Webhook result viewer
├── middleware.ts                  # Route protection
├── services/                      # Backend services
│   ├── crosscheck-verification.ts
│   ├── dob-verification.ts
│   └── ssn-verification.ts
└── types/                         # TypeScript type definitions
```

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with Turbopack |
| `npm run build` | Create production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run test:unit` | Run unit tests |
| `npm run test:integration` | Run integration tests |
| `npm run test:products` | Test all product configurations |
| `npm run test:all` | Run all tests |

---

## Authentication Setup

This application uses Google OAuth to restrict access to authorized users.

### Local Development

1. **Create OAuth credentials** in [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Add `http://localhost:3000/api/auth/callback/google` as an authorized redirect URI
3. Set your environment variables as shown above
4. Run the development server and sign in with an authorized email

### Production Deployment

See [OAUTH_SETUP.md](./OAUTH_SETUP.md) for detailed deployment instructions including:
- Vercel environment configuration
- Google Cloud Console production setup
- Adding test users

---

## Healthcare Workflows

The healthcare pages demonstrate specialized identity verification for patient identification:

- **IDV Page** (`/healthcare/idv-page`) – Identity document verification
- **DOB Page** (`/healthcare/dob-page`) – Date of birth verification
- **CrossCheck Page** (`/healthcare/crosscheck-page`) – KYC verification with address collection

---

## SSN Verification

SSN verification uses Vouched's private API for secure Social Security Number validation.

### Configuration

Add your private API key to `.env.local`:

```env
VOUCHED_PRIVATE_KEY=your-vouched-private-key
```

### Collection Modes

- **Off** – No SSN collection
- **Last 4** – Collect last 4 digits only
- **Full 9** – Collect complete SSN

See [SSN_SETUP.md](./SSN_SETUP.md) for detailed setup and API documentation.

---

## Testing

The application includes a comprehensive testing framework to ensure all product configurations work correctly.

### Running Tests

```bash
# Run all tests
npm run test:all

# Run specific test suites
npm run test:unit
npm run test:integration
npm run test:products
```

### Manual Testing

1. Start the development server
2. Navigate to `http://localhost:3000`
3. Select different product combinations
4. Complete the verification flow
5. Verify results are displayed correctly

See [TESTING.md](./TESTING.md) for detailed testing documentation.

---

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import the project in [Vercel](https://vercel.com)
3. Configure environment variables in Vercel dashboard
4. Deploy

### Environment Variables for Production

Ensure all environment variables from your `.env.local` are configured in your hosting provider:

- `NEXTAUTH_SECRET` – Generate a new secret for production
- `NEXTAUTH_URL` – Your production URL
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`
- `ALLOWED_EMAIL_DOMAIN`
- `NEXT_PUBLIC_VOUCHED_APP_ID`
- `VOUCHED_PRIVATE_KEY`
- `NEXT_PUBLIC_KYA_PROJECT_ID` *(optional)*

---

## Documentation

| Document | Description |
|----------|-------------|
| [OAUTH_SETUP.md](./OAUTH_SETUP.md) | Google OAuth setup and deployment guide |
| [SSN_SETUP.md](./SSN_SETUP.md) | SSN verification configuration |
| [TESTING.md](./TESTING.md) | Testing framework documentation |
| [docs/features/](./docs/features/) | Feature-specific documentation |

---

## Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) with App Router
- **React**: React 19
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Authentication**: [NextAuth.js](https://next-auth.js.org/)
- **Analytics**: [Vercel Analytics](https://vercel.com/analytics)
- **Icons**: [Heroicons](https://heroicons.com/)
- **Testing**: Jest

---

## Learn More

- [Vouched Documentation](https://docs.vouched.id/)
- [Next.js Documentation](https://nextjs.org/docs)
- [NextAuth.js Documentation](https://next-auth.js.org/getting-started/introduction)

---

## License

Private – Vouched Demo Application
