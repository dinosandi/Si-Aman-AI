import type { SafetyRoute } from "../entities/route";

export interface NavigationRepository {
  getSafeRoute(destLat: number, destLng: number, maxAlternatives?: number): Promise<SafetyRoute[]>;
}
