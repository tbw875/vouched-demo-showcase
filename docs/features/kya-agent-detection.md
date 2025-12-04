# KYA (Know-Your-Agent) Implementation

## Overview
KYA is a detection pixel from Vouched that identifies if an AI Agent is accessing the site. It provides visibility into automated access patterns by tracking agent behavior.

## Purpose
- Detect AI Agent access to the application
- Monitor for automated bot activity
- Track agent-based interactions for security and analytics

## Implementation Details

### Configuration
- **Pixel Source**: `https://kya.vouched.id/pixel.js`
- **Project ID**: Set via `NEXT_PUBLIC_KYA_PROJECT_ID` environment variable
- **Loading Strategy**: `afterInteractive` (loads after interactive content)

### Environment Variable
Add the following to your `.env.local`:

```env
NEXT_PUBLIC_KYA_PROJECT_ID=your-kya-project-id-here
```

Get your project ID from the Vouched dashboard. The KYA pixel will only load if this environment variable is set.

### How It Works
The KYA pixel is implemented as a Next.js Script component in the root layout (`src/app/layout.tsx`). It loads asynchronously after the page becomes interactive, ensuring it doesn't block initial page rendering.

### Integration Location
The script is placed in the body of the root layout, after all application content, to ensure it loads without impacting user experience or application functionality.

## Technical Implementation

### Files Modified
- `src/app/layout.tsx` - Added KYA Script component with project configuration

### Code
```tsx
{process.env.NEXT_PUBLIC_KYA_PROJECT_ID && (
  <Script
    src="https://kya.vouched.id/pixel.js"
    data-project-id={process.env.NEXT_PUBLIC_KYA_PROJECT_ID}
    strategy="afterInteractive"
  />
)}
```

## Dependencies
- Next.js Script component (built-in)
- No additional npm packages required

## Monitoring and Analytics
The KYA pixel automatically:
- Detects agent access patterns
- Reports detection data to the KYA service
- Provides visibility without user-facing changes

## Last Updated
December 4, 2025 - Moved project ID to environment variable
