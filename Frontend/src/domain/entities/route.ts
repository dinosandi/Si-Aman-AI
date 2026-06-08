import type { Location } from './report';

export type RouteSafetyLevel = 'safe' | 'warning' | 'danger';

export interface RouteGeometry {
  type: 'LineString';
  coordinates: [number, number][]; // Array of [longitude, latitude]
}

export interface SafetyFactor {
  factor: string;
  type: 'positive' | 'negative';
  description: string;
}

export interface SafetyRoute {
  id: string;
  name: string;
  startLocation: Location;
  endLocation: Location;
  geometry: RouteGeometry;
  distanceKm: number;
  durationMinutes: number;
  safetyScore: number; // 0 to 100
  safetyLevel: RouteSafetyLevel;
  hazardCount: number;
  aiRecommendation: string;
  safetyFactors: SafetyFactor[];
  createdAt: string;
  isRecommended?: boolean;
  routeName?: string;
}

export interface RouteRequestInput {
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  avoidCategories?: string[];
}
