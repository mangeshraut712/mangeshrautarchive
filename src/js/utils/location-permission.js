/**
 * ═══════════════════════════════════════════════════════════
 * LOCATION PERMISSION HANDLER
 * Requests location for time, weather, and location queries
 * ═══════════════════════════════════════════════════════════
 */

let locationPermissionGranted = false;
let userLocation = null;

/**
 * Check if query needs location
 */
export function needsLocation(message) {
  const lower = message.toLowerCase();
  return lower.includes('time') || 
         lower.includes('weather') || 
         lower.includes('where am i') ||
         lower.includes('my location') ||
         lower.includes('near me');
}

/**
 * Request location permission
 */
export async function requestLocationPermission() {
  return new Promise((resolve) => {
    if (locationPermissionGranted && userLocation) {
      resolve(userLocation);
      return;
    }

    if (!navigator.geolocation) {
      console.log('⚠️ Geolocation not supported');
      resolve(null);
      return;
    }

    // Show user-friendly message
    const shouldRequest = confirm(
      '📍 Location Access Request\n\n' +
      'This chatbot would like to access your location to provide:\n' +
      '• Accurate local time\n' +
      '• Weather for your area\n' +
      '• Location-based information\n\n' +
      'Allow location access?'
    );

    if (!shouldRequest) {
      console.log('📍 Location permission denied by user');
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        userLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp
        };
        locationPermissionGranted = true;
        console.log('✅ Location permission granted:', {
          lat: userLocation.latitude.toFixed(2),
          lon: userLocation.longitude.toFixed(2)
        });
        resolve(userLocation);
      },
      (error) => {
        console.error('❌ Location error:', error.message);
        resolve(null);
      },
      {
        enableHighAccuracy: false,
        timeout: 5000,
        maximumAge: 300000 // 5 minutes
      }
    );
  });
}

/**
 * Get user's timezone from location
 */
export async function getUserTimezone() {
  if (locationPermissionGranted && userLocation) {
    // In production, use timezone API with coordinates
    // For now, use browser timezone
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  }
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/**
 * Get location name from coordinates
 */
export async function getLocationName(lat, lon) {
  try {
    // In production, use reverse geocoding API
    // For now, return coordinates
    return `${lat.toFixed(2)}°, ${lon.toFixed(2)}°`;
  } catch (error) {
    return 'Unknown location';
  }
}

export default {
  needsLocation,
  requestLocationPermission,
  getUserTimezone,
  getLocationName
};
