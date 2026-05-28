import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { httpClient } from '../../infrastructure/api/httpClient';

export interface SOSAlertResponse {
  id: string;
  citizenId: string;
  latitude: number;
  longitude: number;
  status: 'active' | 'resolved';
  createdAt: string;
}

export const useEmergencySOS = () => {
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);

  const getGPSLocation = (): Promise<{ lat: number; lng: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation tidak didukung oleh browser Anda.'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setCurrentLocation(coords);
          resolve(coords);
        },
        (error) => {
          let errorMsg = 'Gagal mengakses GPS. Pastikan izin lokasi aktif.';
          if (error.code === error.PERMISSION_DENIED) {
            errorMsg = 'Izin lokasi ditolak oleh pengguna.';
          }
          reject(new Error(errorMsg));
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    });
  };

  const sosMutation = useMutation({
    mutationFn: async () => {
      // 1. Get exact GPS coordinates first
      const coords = await getGPSLocation();

      // 2. Post to API endpoint
      const response = await httpClient.post<any, SOSAlertResponse>('/sos/trigger', {
        latitude: coords.lat,
        longitude: coords.lng,
      });

      return response;
    },
  });

  return {
    triggerSOS: sosMutation.mutateAsync,
    isLoading: sosMutation.isPending,
    error: sosMutation.error,
    isSuccess: sosMutation.isSuccess,
    data: sosMutation.data,
    currentLocation,
  };
};
