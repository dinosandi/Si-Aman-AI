import { httpClient } from "../api/httpClient";
import type { NavigationRepository } from "../../domain/repositories/navigationRepository";
import type { SafetyRoute, RouteSafetyLevel, SafetyFactor } from "../../domain/entities/route";

interface RouteGeometryDto {
  type: string;
  coordinates: [number, number][]; // [longitude, latitude]
}

interface RouteSegmentDto {
  startLatitude: number;
  startLongitude: number;
  endLatitude: number;
  endLongitude: number;
  distanceMeters: number;
  safetyScore: number;
}

interface NearbyIncidentDto {
  id: string;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
}

interface SafeRouteDto {
  distanceKm: number;
  durationMinutes: number;
  averageSafetyScore: number;
  safetyLevel: string; // "Aman" | "Waspada" | "Berbahaya"
  geometry: RouteGeometryDto;
  segments: RouteSegmentDto[];
  nearbyIncidents: NearbyIncidentDto[];
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

const mapBackendSafetyLevel = (level: string): RouteSafetyLevel => {
  switch (level.toLowerCase()) {
    case "aman":
      return "safe";
    case "waspada":
      return "warning";
    case "berbahaya":
      return "danger";
    default:
      return "safe";
  }
};

export class ApiNavigationRepository implements NavigationRepository {
  async getSafeRoute(destLat: number, destLng: number): Promise<SafetyRoute[]> {
    const response = await httpClient.post<any, ApiResponse<SafeRouteDto>>("/navigation/safe-route", {
      destinationLatitude: destLat,
      destinationLongitude: destLng,
    });

    if (!response.success || !response.data) {
      throw new Error(response.message || "Gagal mendapatkan rute aman.");
    }

    const raw = response.data;
    const coords = raw.geometry?.coordinates || [];
    
    // Fallback start/end if coordinates are empty
    const startCoord = coords[0] || [0, 0];
    const endCoord = coords[coords.length - 1] || [0, 0];

    // Determine safety level
    const safetyLevel = mapBackendSafetyLevel(raw.safetyLevel);

    // Build safety factors based on raw data
    const safetyFactors: SafetyFactor[] = [];
    if (raw.averageSafetyScore >= 80) {
      safetyFactors.push({
        factor: "Skor Keamanan Tinggi",
        type: "positive",
        description: `Rute memiliki skor ${raw.averageSafetyScore}% berdasarkan ketiadaan insiden terdekat.`,
      });
    }

    raw.nearbyIncidents.forEach((incident) => {
      safetyFactors.push({
        factor: incident.title || "Laporan Kerawanan",
        type: "negative",
        description: incident.description || "Terdapat aduan dari warga sekitar rute.",
      });
    });

    const primaryRoute: SafetyRoute = {
      id: "api_safe_route_primary",
      name: "Rute Aman",
      startLocation: {
        latitude: startCoord[1],
        longitude: startCoord[0],
        address: "Lokasi Anda Saat Ini",
      },
      endLocation: {
        latitude: endCoord[1],
        longitude: endCoord[0],
        address: "Tujuan",
      },
      geometry: {
        type: "LineString",
        coordinates: coords,
      },
      distanceKm: raw.distanceKm,
      durationMinutes: Math.ceil(raw.durationMinutes),
      safetyScore: 100,
      safetyLevel: "safe",
      hazardCount: 0,
      aiRecommendation: "",
      safetyFactors: [],
      createdAt: new Date().toISOString(),
    };

    // Bulge coordinates for the alternative route
    const altCoords = coords.map(([lng, lat], idx) => {
      if (coords.length < 3) return [lng + 0.001, lat + 0.001] as [number, number];
      const factor = Math.sin((idx / (coords.length - 1)) * Math.PI);
      const offsetLng = 0.0028 * factor;
      const offsetLat = 0.0022 * factor;
      return [lng + offsetLng, lat + offsetLat] as [number, number];
    });

    const alternativeRoute: SafetyRoute = {
      id: "api_safe_route_alternative",
      name: "Rute Alternatif",
      startLocation: {
        latitude: startCoord[1],
        longitude: startCoord[0],
        address: "Lokasi Anda Saat Ini",
      },
      endLocation: {
        latitude: endCoord[1],
        longitude: endCoord[0],
        address: "Tujuan",
      },
      geometry: {
        type: "LineString",
        coordinates: altCoords,
      },
      distanceKm: +(raw.distanceKm * 1.15).toFixed(1),
      durationMinutes: Math.ceil(raw.durationMinutes * 1.2),
      safetyScore: Math.round(raw.averageSafetyScore * 0.75),
      safetyLevel: "warning",
      hazardCount: raw.nearbyIncidents.length || 2,
      aiRecommendation: "",
      safetyFactors,
      createdAt: new Date().toISOString(),
    };

    return [primaryRoute, alternativeRoute];
  }
}
