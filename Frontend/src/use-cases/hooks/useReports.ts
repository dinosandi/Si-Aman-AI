import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { httpClient } from '../../infrastructure/api/httpClient';
import { OfflineStorage } from '../../infrastructure/storage/indexedDb';
import type { Report, CreateReportInput } from '../../domain/entities/report';
import { compressImage } from '../../infrastructure/utils/imageCompressor';

const REPORTS_CACHE_KEY = 'reports';

// Fetch reports with offline fallback
const fetchReports = async (district?: string): Promise<Report[]> => {
  const cacheKey = `reports_list_${district || 'all'}`;
  try {
    const response = await httpClient.get<any, Report[]>('/reports', {
      params: { district },
    });
    // Cache list in IndexedDB
    await OfflineStorage.cacheSpatialData(cacheKey, response);
    return response;
  } catch (error: any) {
    if (error.code === 'NETWORK_OFFLINE') {
      const cached = await OfflineStorage.getCachedSpatialData<Report[]>(cacheKey);
      if (cached) return cached;
    }
    throw error;
  }
};

export const useReports = (district?: string) => {
  return useQuery({
    queryKey: [REPORTS_CACHE_KEY, district],
    queryFn: () => fetchReports(district),
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
          console.error('Failed to compress image, using original:', err);
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
          message: 'Laporan Anda disimpan secara lokal (Offline) dan akan disinkronkan saat terhubung kembali.',
        };
      }

      // 2. Device is online, post to server
      const formData = new FormData();
      formData.append('category', newReport.category);
      formData.append('title', newReport.title);
      formData.append('description', newReport.description);
      formData.append('latitude', newReport.latitude.toString());
      formData.append('longitude', newReport.longitude.toString());
      if (newReport.address) formData.append('address', newReport.address);
      if (newReport.district) formData.append('district', newReport.district);
      if (compressedImage) {
        // Append compressed image
        formData.append('image', compressedImage, 'report_image.jpg');
      }

      const response = await httpClient.post<any, Report>('/reports', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return {
        isOfflineSaved: false,
        data: response,
        message: 'Laporan berhasil terkirim dan dipublikasikan.',
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
          const formData = new FormData();
          formData.append('category', report.category);
          formData.append('title', report.title);
          formData.append('description', report.description);
          formData.append('latitude', report.latitude.toString());
          formData.append('longitude', report.longitude.toString());
          if (report.address) formData.append('address', report.address);
          if (report.district) formData.append('district', report.district);
          if (report.image) {
            formData.append('image', report.image, 'report_image.jpg');
          }
          
          await httpClient.post('/reports', formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });
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
