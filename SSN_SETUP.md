# SSN Verification Setup

This document explains how to set up and use the SSN Private API integration in the Vouched Demo Showcase.

## Overview

The SSN verification functionality uses Vouched's private `ssnPrivate` API endpoint to verify Social Security Numbers alongside the existing IDV flow. This is a **separate API endpoint** from the regular Vouched JS plugin and requires a **private API key**.

## Setup Instructions

### 1. Environment Configuration

Create a `.env.local` file in the project root with the following variables:

```bash
# Your private API key from Vouched (used for SSN and other private APIs)
VOUCHED_PRIVATE_API_KEY=your_private_api_key_here

# Vouched SSN Private API Base URL (default is correct)
VOUCHED_SSN_API_BASE_URL=https://verify.vouched.id
```

### 2. API Key Configuration

Contact Vouched to obtain your private SSN API key and add it to the environment variable above.

## How It Works

### Architecture

1. **Client-Side Form**: Collects SSN data along with other form fields
2. **Parallel Processing**: When the verification page loads:
   - Vouched JS Plugin initializes for IDV flow
   - SSN API call is made in parallel via `/api/ssn-verify`
3. **Backend API Route**: `/api/ssn-verify` handles the SSN verification request
4. **Results Display**: Both IDV and SSN results are shown on the results page

### Flow Diagram

```
Form Fill Page
     ↓
Verification Page
     ├── Vouched JS Plugin (IDV)
     └── SSN API Call (/api/ssn-verify)
     ↓
Results Page (shows both results)
```

## Usage

### 1. Enable SSN Verification

Add `ssnPrivate` to the products list when configuring your verification flow:

```javascript
const products = ['id-verification', 'ssnPrivate'];
```

### 2. Form Data Requirements

The SSN verification requires:
- `firstName` (required) - First name associated with the phone number
- `lastName` (required) - Last name associated with the phone number  
- `phone` (required) - Phone number (will be auto-formatted to E.164 format like +1XXXXXXXXXX)
- `ssn` (required) - Can be full 9 digits (XXX-XX-XXXX) or last 4 digits (XXXX)
- `dateOfBirth` (optional) - Will be formatted to ISO 8601 format (YYYY-MM-DD)

### 3. API Response

The SSN verification returns:

```json
{
  "id": "ssn_verification_id",
  "status": "completed",
  "result": {
    "success": true,
    "ssnValid": true,
    "nameMatch": true,
    "dobMatch": true,
    "details": {
      "ssnTrace": {
        "found": true,
        "issued": "2000-01-01",
        "state": "CA"
      },
      "identity": {
        "firstNameMatch": true,
        "lastNameMatch": true,
        "dobMatch": true
      }
    }
  },
  "timestamp": "2024-01-01T00:00:00Z"
}
```

## Files Created/Modified

### New Files
- `src/types/ssn-api.ts` - TypeScript types for SSN API
- `src/services/ssn-verification.ts` - SSN verification service
- `src/app/api/ssn-verify/route.ts` - API route for SSN verification

### Modified Files
- `src/app/verification/page.tsx` - Added SSN verification integration
- `src/app/results/page.tsx` - Added SSN results display
- `src/app/form-fill/page.tsx` - Already had SSN form fields

## Testing

To test the SSN verification:

1. Set up your environment variables
2. Navigate to the form fill page
3. Enable the `ssnPrivate` product
4. Fill in the required SSN data
5. Complete the verification flow
6. Check the results page for both IDV and SSN verification results

## Error Handling

The implementation includes comprehensive error handling:

- **Configuration Errors**: Missing API key
- **Validation Errors**: Invalid SSN format or missing required fields  
- **API Errors**: Network issues or API failures
- **Display Errors**: Graceful fallbacks in the UI

## Security Notes

- SSN data is masked in logs (shows as `***masked***`)
- API key is stored in environment variables
- SSN data is transmitted over HTTPS
- Results are stored temporarily in localStorage for display purposes

## API Documentation Reference

For detailed API documentation, refer to Vouched's SSN Private API documentation or contact Vouched support for specific endpoint details and authentication requirements.
