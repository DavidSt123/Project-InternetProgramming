// src/app/shared/cities.ts
export type City = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
};

// Central place for all supported cities.
// You can keep adding here without touching components.
export const CITIES: City[] = [
  // Existing ones
  { id: 'skopje',  name: 'Skopje',         latitude: 41.9981, longitude: 21.4254 },
  { id: 'london',  name: 'London',         latitude: 51.5072, longitude: -0.1276 },
  { id: 'newyork', name: 'New York',       latitude: 40.7128, longitude: -74.0060 },
  { id: 'tokyo',   name: 'Tokyo',          latitude: 35.6762, longitude: 139.6503 },
  { id: 'paris',   name: 'Paris',          latitude: 48.8566, longitude: 2.3522 },

  // Extra European cities
  { id: 'berlin',  name: 'Berlin',         latitude: 52.5200, longitude: 13.4050 },
  { id: 'madrid',  name: 'Madrid',         latitude: 40.4168, longitude: -3.7038 },
  { id: 'rome',    name: 'Rome',           latitude: 41.9028, longitude: 12.4964 },
  { id: 'vienna',  name: 'Vienna',         latitude: 48.2082, longitude: 16.3738 },
  { id: 'zurich',  name: 'Zürich',         latitude: 47.3769, longitude: 8.5417 },

  // Americas
  { id: 'la',      name: 'Los Angeles',    latitude: 34.0522, longitude: -118.2437 },
  { id: 'chicago', name: 'Chicago',        latitude: 41.8781, longitude: -87.6298 },
  { id: 'toronto', name: 'Toronto',        latitude: 43.6532, longitude: -79.3832 },
  { id: 'mexico',  name: 'Mexico City',    latitude: 19.4326, longitude: -99.1332 },
  { id: 'santiago',name: 'Santiago',       latitude: -33.4489, longitude: -70.6693 },

  // Asia / Oceania
  { id: 'seoul',   name: 'Seoul',          latitude: 37.5665, longitude: 126.9780 },
  { id: 'beijing', name: 'Beijing',        latitude: 39.9042, longitude: 116.4074 },
  { id: 'delhi',   name: 'Delhi',          latitude: 28.7041, longitude: 77.1025 },
  { id: 'sydney',  name: 'Sydney',         latitude: -33.8688, longitude: 151.2093 },
  { id: 'melbourne', name: 'Melbourne',    latitude: -37.8136, longitude: 144.9631 },

  // Africa / Middle East
  { id: 'cairo',   name: 'Cairo',          latitude: 30.0444, longitude: 31.2357 },
  { id: 'johannesburg', name: 'Johannesburg', latitude: -26.2041, longitude: 28.0473 },
  { id: 'dubai',   name: 'Dubai',          latitude: 25.2048, longitude: 55.2708 },
];
