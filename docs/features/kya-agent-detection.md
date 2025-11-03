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
- **Project ID**: `vouched-demo-app-a5p626`
- **Loading Strategy**: `afterInteractive` (loads after interactive content)

### How It Works
The KYA pixel is implemented as a Next.js Script component in the root layout (`src/app/layout.tsx`). It loads asynchronously after the page becomes interactive, ensuring it doesn't block initial page rendering.

### Integration Location
The script is placed in the body of the root layout, after all application content, to ensure it loads without impacting user experience or application functionality.

## Technical Implementation

### Files Modified
- `src/app/layout.tsx` - Added KYA Script component with project configuration

### Code
```tsx
<Script
  src="https://kya.vouched.id/pixel.js"
  data-project-id="vouched-demo-app-a5p626"
  strategy="afterInteractive"
/>
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
November 3, 2025 - Initial implementation
