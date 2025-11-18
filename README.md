This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

### Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# Vouched API Configuration
NEXT_PUBLIC_VOUCHED_APP_ID=your_vouched_app_id_here

# Google Maps API Configuration
# Get your API key from: https://console.cloud.google.com/google/maps-apis
# Make sure to enable the "Places API (New)" and "Maps JavaScript API"
# IMPORTANT: Billing must be enabled in Google Cloud Console
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

**⚠️ Important:** If you encounter API authorization errors, see the detailed setup guide in [GOOGLE_MAPS_SETUP.md](./GOOGLE_MAPS_SETUP.md)

### Running the Development Server

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Features

### Google Places Autocomplete Integration

The form includes Google Places Autocomplete for address input in healthcare use cases using the modern **PlaceAutocompleteElement** web component. This provides:

- **Single Address Field**: Instead of multiple separate address fields, users can search and select their address from Google Places
- **Modern Web Component**: Uses `google.maps.places.PlaceAutocompleteElement` for better performance and styling options
- **Automatic Parsing**: The selected address is automatically parsed into components (street, city, state, postal code, country)
- **CrossCheck API Integration**: Parsed address components are properly formatted for the Vouched CrossCheck API
- **Customizable Styling**: Uses CSS custom properties for easy theme customization

The autocomplete feature is automatically enabled for healthcare use cases when CrossCheck verification is selected.

#### Technical Details

- Component: `src/app/components/AddressAutocomplete.tsx`
- Uses `@googlemaps/js-api-loader` with the functional API (`setOptions`, `importLibrary`)
- Listens to the `gmp-placeselect` event for place selection
- Parses address components using the new `addressComponents` format (longText/shortText)

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
