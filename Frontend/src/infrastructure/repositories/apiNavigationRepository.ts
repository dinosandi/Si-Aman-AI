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

interface RouteDto {
  routeIndex: number;
  routeName: string;
  distanceKm: number;
  durationMinutes: number;
  averageSafetyScore: number;
  safetyLevel: string; // "Aman" | "Waspada" | "Berbahaya"
  safetyRank: number;
  isRecommended: boolean;
  hasIncident: boolean;
  incidentCount: number;
  routeWarning: string;
  geometry: RouteGeometryDto;
  segments: RouteSegmentDto[];
  nearbyIncidents: NearbyIncidentDto[];
}

interface SafeRouteWithAlternativesDto {
  recommendedRoute: RouteDto;
  allRoutes: RouteDto[];
  summary: string;
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
  async getSafeRoute(destLat: number, destLng: number, maxAlternatives: number = 1): Promise<SafetyRoute[]> {
    const response = await httpClient.post<any, ApiResponse<SafeRouteWithAlternativesDto>>("/navigation/safe-route", {
      destinationLatitude: destLat,
      destinationLongitude: destLng,
      maxAlternatives,
    });

    if (!response.success || !response.data) {
      throw new Error(response.message || "Gagal mendapatkan rute aman.");
    }

    const raw = response.data;
    const routesToMap = raw.allRoutes && raw.allRoutes.length > 0 ? raw.allRoutes : (raw.recommendedRoute ? [raw.recommendedRoute] : []);

    const mappedRoutes = routesToMap.map((route, idx) => {
      const coords = route.geometry?.coordinates || [];
      const startCoord = coords[0] || [0, 0];
      const endCoord = coords[coords.length - 1] || [0, 0];

      // Determine safety level
      const safetyLevel = mapBackendSafetyLevel(route.safetyLevel);

      // Build safety factors based on raw data
      const safetyFactors: SafetyFactor[] = [];
      if (route.averageSafetyScore >= 80) {
        safetyFactors.push({
          factor: "Skor Keamanan Tinggi",
          type: "positive",
          description: `Rute memiliki skor ${route.averageSafetyScore}% berdasarkan ketiadaan insiden terdekat.`,
        });
      }

      (route.nearbyIncidents || []).forEach((incident) => {
        safetyFactors.push({
          factor: incident.title || "Laporan Kerawanan",
          type: "negative",
          description: incident.description || "Terdapat aduan dari warga sekitar rute.",
        });
      });

      return {
        id: `api_route_${route.routeIndex ?? idx}`,
        name: route.isRecommended ? "Rute Aman" : "Rute Alternatif",
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
          type: "LineString" as "LineString",
          coordinates: coords,
        },
        distanceKm: route.distanceKm,
        durationMinutes: Math.ceil(route.durationMinutes),
        safetyScore: route.averageSafetyScore,
        safetyLevel: safetyLevel,
        hazardCount: route.incidentCount ?? (route.nearbyIncidents?.length || 0),
        aiRecommendation: route.routeWarning || "",
        safetyFactors,
        createdAt: new Date().toISOString(),
        isRecommended: route.isRecommended,
        routeName: route.routeName,
      };
    });

    return mappedRoutes;
  }
}
