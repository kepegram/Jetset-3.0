export interface GeocodingResult {
  latitude: number;
  longitude: number;
  formattedAddress?: string;
}

export interface GeocodingError {
  message: string;
  code?: string;
}

export async function geocodeLocation(
  location: string
): Promise<GeocodingResult> {
  console.warn(
    'Geocoding not implemented yet. Using mock coordinates. Please implement geocoding API.'
  );
  
  const mockLocations: Record<string, { lat: number; lng: number }> = {
    paris: { lat: 48.8566, lng: 2.3522 },
    'new york': { lat: 40.7128, lng: -74.006 },
    tokyo: { lat: 35.6762, lng: 139.6503 },
    london: { lat: 51.5074, lng: -0.1278 },
    sydney: { lat: -33.8688, lng: 151.2093 },
  };

  const locationLower = location.toLowerCase();
  const mockLocation = Object.keys(mockLocations).find((key) =>
    locationLower.includes(key)
  );

  if (mockLocation) {
    return {
      latitude: mockLocations[mockLocation].lat,
      longitude: mockLocations[mockLocation].lng,
      formattedAddress: location,
    };
  }

  throw new Error(
    `Geocoding not implemented. Please add API credentials and implement geocoding for: ${location}`
  );
}

export function validateLocationInput(location: string): boolean {
  if (!location || location.trim().length === 0) {
    return false;
  }

  if (location.trim().length < 2) {
    return false;
  }

  if (/^\d+$/.test(location.trim())) {
    return false;
  }

  return true;
}

export async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<string> {
  console.warn('Reverse geocoding not implemented yet.');
  return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
}

