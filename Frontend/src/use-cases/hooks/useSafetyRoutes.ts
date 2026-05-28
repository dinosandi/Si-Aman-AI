import { useQuery } from '@tanstack/react-query';
import { httpClient } from '../../infrastructure/api/httpClient';
import { OfflineStorage } from '../../infrastructure/storage/indexedDb';
import type { SafetyRoute, RouteRequestInput } from '../../domain/entities/route';

const ROUTE_CACHE_KEY = 'safety-routes';

// Fetch function that handles online API call and offline IndexedDB cache fallback
const fetchSafetyRoutes = async (params: RouteRequestInput): Promise<SafetyRoute[]> => {
  const cacheKey = `${ROUTE_CACHE_KEY}_${params.startLat}_${params.startLng}_${params.endLat}_${params.endLng}`;

  try {
    const response = await httpClient.get<any, SafetyRoute[]>('/routes/safe', {
      params,
    });
    
    // Cache the fresh result locally in IndexedDB for offline usage
    if (response && response.length > 0) {
      await OfflineStorage.cacheSpatialData(cacheKey, response);
    }
    return response;
  } catch (error: any) {
    // If offline, check if we have cached spatial recommendations
    if (error.code === 'NETWORK_OFFLINE') {
      const cached = await OfflineStorage.getCachedSpatialData<SafetyRoute[]>(cacheKey);
      if (cached) {
        console.warn('Running in offline mode: serving cached safety routes.');
        return cached;
      }
    }
    throw error;
  }
};

export const useSafetyRoutes = (params: RouteRequestInput | null) => {
  return useQuery({
    queryKey: [ROUTE_CACHE_KEY, params],
    queryFn: () => fetchSafetyRoutes(params!),
    enabled: !!params && !!params.startLat && !!params.startLng && !!params.endLat && !!params.endLng,
    staleTime: 5 * 60 * 1000, // 5 minutes fresh time
    refetchOnWindowFocus: false,
  });
};
