// Geocoding utility functions
export interface Coordinates {
  latitude: number;
  longitude: number;
}

/**
 * Geocode an address using OpenStreetMap Nominatim API (free alternative to Google Geocoding)
 */
export async function geocodeAddress(address: string): Promise<Coordinates | null> {
  try {
    // Clean and format the address
    const cleanAddress = address.trim();
    if (!cleanAddress) return null;

    // Use Nominatim API (free OpenStreetMap geocoding service)
    const encodedAddress = encodeURIComponent(cleanAddress);
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1&countrycodes=za`
    );

    if (!response.ok) {
      throw new Error(`Geocoding API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data && data.length > 0) {
      const result = data[0];
      return {
        latitude: parseFloat(result.lat),
        longitude: parseFloat(result.lon)
      };
    }

    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}

/**
 * Geocode multiple addresses with rate limiting
 */
export async function geocodeAddresses(addresses: string[]): Promise<(Coordinates | null)[]> {
  const results: (Coordinates | null)[] = [];
  
  for (const address of addresses) {
    const coords = await geocodeAddress(address);
    results.push(coords);
    
    // Rate limiting: wait 1 second between requests to be respectful to the free API
    if (addresses.indexOf(address) < addresses.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  return results;
}

/**
 * Get coordinates for South African cities (fallback for common locations)
 */
export function getCityCoordinates(city: string): Coordinates | null {
  const cityCoords: Record<string, Coordinates> = {
    'cape town': { latitude: -33.9249, longitude: 18.4241 },
    'johannesburg': { latitude: -26.2041, longitude: 28.0473 },
    'durban': { latitude: -29.8587, longitude: 31.0218 },
    'pretoria': { latitude: -25.7479, longitude: 28.2293 },
    'port elizabeth': { latitude: -33.9608, longitude: 25.6022 },
    'bloemfontein': { latitude: -29.0852, longitude: 26.1596 },
    'east london': { latitude: -33.0153, longitude: 27.9116 },
    'pietermaritzburg': { latitude: -29.6196, longitude: 30.3794 },
    'kimberley': { latitude: -28.7282, longitude: 24.7499 },
    'polokwane': { latitude: -23.9045, longitude: 29.4689 },
    'goodwood': { latitude: -33.8906, longitude: 18.5392 },
    'parow': { latitude: -33.8908, longitude: 18.5792 },
    'bellville': { latitude: -33.8803, longitude: 18.6292 },
    'mitchells plain': { latitude: -34.0364, longitude: 18.6292 },
    'khayelitsha': { latitude: -34.0364, longitude: 18.6792 }
  };

  const normalizedCity = city.toLowerCase().trim();
  return cityCoords[normalizedCity] || null;
}

/**
 * Extract city from address string
 */
export function extractCityFromAddress(address: string): string | null {
  if (!address) return null;
  
  // Common patterns for South African addresses
  const parts = address.split(',').map(part => part.trim());
  
  // Look for known cities in the address parts
  for (const part of parts) {
    const cityCoords = getCityCoordinates(part);
    if (cityCoords) {
      return part;
    }
  }
  
  // If no known city found, return the last part (often the city)
  return parts.length > 1 ? parts[parts.length - 2] || parts[parts.length - 1] : null;
}