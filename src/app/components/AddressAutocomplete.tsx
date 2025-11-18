'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { setOptions, importLibrary } from '@googlemaps/js-api-loader';
import { MapPinIcon } from '@heroicons/react/24/outline';

interface AddressComponents {
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

interface AddressAutocompleteProps {
  onAddressSelect: (address: AddressComponents) => void;
  value?: string;
  error?: string;
  required?: boolean;
}

// Global flags to prevent multiple initializations
let googleMapsInitialized = false;
let initializationStarted = false;

export default function AddressAutocomplete({ 
  onAddressSelect, 
  error, 
  required = false 
}: AddressAutocompleteProps) {
  const autocompleteRef = useRef<HTMLElement | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Use a ref to store the latest callback without causing re-renders
  const onAddressSelectRef = useRef(onAddressSelect);
  
  // Update the ref when the callback changes, but don't trigger re-initialization
  useEffect(() => {
    onAddressSelectRef.current = onAddressSelect;
  }, [onAddressSelect]);

  // Memoize fillInAddress - it doesn't depend on onAddressSelect directly anymore
  const fillInAddress = useCallback(async (placePrediction: google.maps.places.PlacePrediction) => {
    try {
      const place = placePrediction.toPlace();
      await place.fetchFields({ fields: ['addressComponents'] });

      if (!place.addressComponents) {
        return;
      }

      let street = '';
      let city = '';
      let state = '';
      let postalCode = '';
      let country = '';

      // Parse address components using Google's recommended pattern
      for (const component of place.addressComponents) {
        const types = component.types || [];

        if (types.includes('street_number') && component.longText) {
          street = `${component.longText} ${street}`;
        }

        if (types.includes('route') && component.shortText) {
          street += component.shortText;
        }

        if (types.includes('postal_code') && component.longText) {
          postalCode = component.longText;
        }

        if (types.includes('locality') && component.longText) {
          city = component.longText;
        }

        if (types.includes('administrative_area_level_1') && component.shortText) {
          state = component.shortText;
        }

        if (types.includes('country') && component.longText) {
          country = component.longText;
        }
      }

      const parsedAddress: AddressComponents = {
        street: street.trim(),
        city,
        state,
        postalCode,
        country
      };
      
      onAddressSelectRef.current(parsedAddress);
    } catch {
      // Silent error handling
    }
  }, []); // No dependencies - this function is stable

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    let mounted = true;

    async function initAutocomplete() {
      try {
        if (!googleMapsInitialized) {
          setOptions({
            key: apiKey,
            v: 'weekly',
          });
          googleMapsInitialized = true;
        }

        if (!initializationStarted) {
          await importLibrary('places');
          initializationStarted = true;
        }
        
        if (!mounted || !autocompleteRef.current) {
          return;
        }

        const placeAutocomplete = autocompleteRef.current as HTMLElement;

        const handler = async (event: Event & { placePrediction?: google.maps.places.PlacePrediction }) => {
          const { placePrediction } = event;
          
          if (!placePrediction) {
            return;
          }
          
          await fillInAddress(placePrediction);
        };
        
        placeAutocomplete.addEventListener('gmp-select', handler);
        setIsLoading(false);

        return () => {
          placeAutocomplete.removeEventListener('gmp-select', handler);
        };

      } catch {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    const cleanup = initAutocomplete();

    return () => {
      mounted = false;
      // Wait for async initialization to complete, then cleanup
      if (cleanup instanceof Promise) {
        cleanup.then(cleanupFn => {
          if (cleanupFn) cleanupFn();
        });
      }
    };
  }, [fillInAddress]); // Only depends on fillInAddress which is now stable

  return (
    <div className="space-y-2">
      <label className="flex items-center gap-3 text-lg font-semibold text-gray-900 dark:text-white">
        <MapPinIcon className="h-5 w-5 text-indigo-600" />
        Address
        {required && <span className="text-red-500">*</span>}
      </label>

      <div className="relative">
        {React.createElement('gmp-place-autocomplete', {
          ref: autocompleteRef,
          className: error ? 'error' : '',
        })}
        <MapPinIcon className="absolute left-3 top-3.5 h-5 w-5 text-gray-400 pointer-events-none z-10" />
      </div>

      {error && (
        <p className="text-red-500 text-sm ml-8">{error}</p>
      )}

      {isLoading && (
        <p className="text-gray-500 text-sm ml-8">Loading address autocomplete...</p>
      )}

      <style jsx global>{`
        /* Style the PlaceAutocompleteElement to match the form */
        gmp-place-autocomplete {
          display: block;
          width: 100%;
        }
        
        /* Target the internal input field - these styles pierce Shadow DOM */
        gmp-place-autocomplete::part(input) {
          width: 100%;
          padding: 0.75rem 1rem 0.75rem 3rem;
          border-radius: 0.5rem;
          border: 1px solid;
          font-size: 1rem;
          min-height: 3rem;
          transition: border-color 0.2s, box-shadow 0.2s;
          background-color: white;
          color: rgb(17, 24, 39);
          border-color: rgb(209, 213, 219);
        }
        
        /* Dark mode styles */
        .dark gmp-place-autocomplete::part(input) {
          background-color: rgb(55, 65, 81);
          color: rgb(243, 244, 246);
          border-color: rgb(75, 85, 99);
        }
        
        /* Focus state */
        gmp-place-autocomplete::part(input):focus {
          outline: none;
          border-color: rgb(99, 102, 241);
          box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.5);
        }
        
        /* Error state */
        gmp-place-autocomplete.error::part(input) {
          border-color: #ef4444;
        }
        
        gmp-place-autocomplete.error::part(input):focus {
          border-color: #ef4444;
          box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.5);
        }
        
        /* Dropdown list styling */
        gmp-place-autocomplete::part(listbox) {
          background-color: white;
          border: 1px solid rgb(209, 213, 219);
          border-radius: 0.5rem;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        
        .dark gmp-place-autocomplete::part(listbox) {
          background-color: rgb(55, 65, 81);
          border-color: rgb(75, 85, 99);
        }
        
        /* Dropdown item styling */
        gmp-place-autocomplete::part(option) {
          color: rgb(17, 24, 39);
          padding: 0.75rem 1rem;
        }
        
        .dark gmp-place-autocomplete::part(option) {
          color: rgb(243, 244, 246);
        }
        
        gmp-place-autocomplete::part(option):hover {
          background-color: rgb(243, 244, 246);
        }
        
        .dark gmp-place-autocomplete::part(option):hover {
          background-color: rgb(75, 85, 99);
        }
        
        gmp-place-autocomplete::part(option-active) {
          background-color: rgb(99, 102, 241);
          color: white;
        }
      `}</style>
    </div>
  );
}
