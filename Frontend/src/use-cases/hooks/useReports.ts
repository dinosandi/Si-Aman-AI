import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { incidentRepository } from "../../infrastructure/repositories";
import { OfflineStorage } from "../../infrastructure/storage/indexedDb";
import type { Report, CreateReportInput } from "../../domain/entities/report";
import { compressImage } from "../../infrastructure/utils/imageCompressor";

const REPORTS_CACHE_KEY = "reports";

// Fetch reports using Repository (with spatial coordinates for Mejayan/Madiun as default)
const fetchReports = async (lat: number = -7.6167, lng: number = 111.65, radius: number = 50000): Promise<Report[]> => {
  const cacheKey = `reports_list_${lat}_${lng}_${radius}`;
  try {
    const response = await incidentRepository.getNearby(lat, lng, radius);
    // Cache the list in IndexedDB for offline fallback
    await OfflineStorage.cacheSpatialData(cacheKey, response);
    return response;
  } catch (error: any) {
    if (error.code === "NETWORK_OFFLINE" || !navigator.onLine) {
      const cached = await OfflineStorage.getCachedSpatialData<Report[]>(cacheKey);
      if (cached) return cached;
    }
    throw error;
  }
};

export const useReports = (lat: number = -7.6167, lng: number = 111.65, radius: number = 50000) => {
  return useQuery({
    queryKey: [REPORTS_CACHE_KEY, lat, lng, radius],
    queryFn: () => fetchReports(lat, lng, radius),
    staleTime: 2 * 60 * 1000,
  });
};

export const useCreateReport = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newReport: CreateReportInput) => {
      // Compress image if provided (whether online or offline)
      let compressedImage = newReport.image;
      if (newReport.image instanceof File) {
        try {
          compressedImage = await compressImage(newReport.image);
        } catch (err) {
          console.error("Failed to compress image, using original:", err);
        }
      }

      // 1. Check if device is online
      if (!navigator.onLine) {
        // Save to IndexedDB offline queue
        const tempId = await OfflineStorage.saveOfflineReport({
          ...newReport,
          image: compressedImage,
        });
        return {
          isOfflineSaved: true,
          tempId,
          message: "Laporan Anda disimpan secara lokal (Offline) dan akan disinkronkan saat terhubung kembali.",
        };
      }

      // 2. Device is online, post to server via repository
      const response = await incidentRepository.create({
        ...newReport,
        image: compressedImage,
      });

      return {
        isOfflineSaved: false,
        data: response,
        message: "Laporan berhasil terkirim dan dipublikasikan.",
      };
    },
    onSuccess: (result) => {
      if (!result.isOfflineSaved) {
        queryClient.invalidateQueries({ queryKey: [REPORTS_CACHE_KEY] });
      }
    },
  });
};

// Sync hook to push offline data to API when citizen goes back online
export const useSyncOfflineReports = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const offlineReports = await OfflineStorage.getOfflineReports();
      if (offlineReports.length === 0) return { syncedCount: 0 };

      let syncedCount = 0;
      for (const report of offlineReports) {
        try {
          await incidentRepository.create(report);
          await OfflineStorage.deleteOfflineReport(report.tempId);
          syncedCount++;
        } catch (err) {
          console.error(`Failed to sync offline report: ${report.tempId}`, err);
          // Keep it in DB to retry later
        }
      }

      return { syncedCount };
    },
    onSuccess: (result) => {
      if (result.syncedCount > 0) {
        queryClient.invalidateQueries({ queryKey: [REPORTS_CACHE_KEY] });
      }
    },
  });
};
