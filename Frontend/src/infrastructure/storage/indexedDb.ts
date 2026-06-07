import type { CreateReportInput } from '../../domain/entities/report';

const DB_NAME = 'si_aman_db';
const DB_VERSION = 1;
const STORE_OFFLINE_REPORTS = 'offline_reports';
const STORE_SPATIAL_CACHE = 'spatial_cache';

export interface OfflineReport extends CreateReportInput {
  id: string;
  tempId: string;
  createdAt: string;
}

export class OfflineStorage {
  private static db: IDBDatabase | null = null;

  public static async init(): Promise<IDBDatabase> {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(request.result);
      };

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_OFFLINE_REPORTS)) {
          db.createObjectStore(STORE_OFFLINE_REPORTS, { keyPath: 'tempId' });
        }
        if (!db.objectStoreNames.contains(STORE_SPATIAL_CACHE)) {
          db.createObjectStore(STORE_SPATIAL_CACHE, { keyPath: 'url' });
        }
      };
    });
  }

  // --- Offline Reports Methods ---
  
  public static async saveOfflineReport(report: CreateReportInput): Promise<string> {
    const db = await this.init();
    const tempId = `temp_${Date.now()}`;
    const offlineData: OfflineReport = {
      ...report,
      id: tempId,
      tempId,
      createdAt: new Date().toISOString(),
    };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_OFFLINE_REPORTS], 'readwrite');
      const store = transaction.objectStore(STORE_OFFLINE_REPORTS);
      const request = store.add(offlineData);

      request.onsuccess = () => resolve(tempId);
      request.onerror = () => reject(request.error);
    });
  }

  public static async getOfflineReports(): Promise<OfflineReport[]> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_OFFLINE_REPORTS], 'readonly');
      const store = transaction.objectStore(STORE_OFFLINE_REPORTS);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  public static async deleteOfflineReport(tempId: string): Promise<void> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_OFFLINE_REPORTS], 'readwrite');
      const store = transaction.objectStore(STORE_OFFLINE_REPORTS);
      const request = store.delete(tempId);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // --- Spatial Cache Methods (Map Tiles / Routes) ---

  public static async cacheSpatialData(url: string, data: any): Promise<void> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_SPATIAL_CACHE], 'readwrite');
      const store = transaction.objectStore(STORE_SPATIAL_CACHE);
      const cacheItem = {
        url,
        data,
        cachedAt: Date.now(),
      };
      const request = store.put(cacheItem);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  public static async getCachedSpatialData<T>(url: string): Promise<T | null> {
    const db = await this.init();
    return new Promise((resolve) => {
      const transaction = db.transaction([STORE_SPATIAL_CACHE], 'readonly');
      const store = transaction.objectStore(STORE_SPATIAL_CACHE);
      const request = store.get(url);

      request.onsuccess = () => {
        if (request.result) {
          // Check expiration (optional, e.g. 7 days for route suggestions, 30 days for tiles)
          const age = Date.now() - request.result.cachedAt;
          const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days in ms
          if (age > maxAge) {
            this.deleteCachedSpatialData(url);
            resolve(null);
          } else {
            resolve(request.result.data as T);
          }
        } else {
          resolve(null);
        }
      };
      request.onerror = () => resolve(null);
    });
  }

  public static async deleteCachedSpatialData(url: string): Promise<void> {
    const db = await this.init();
    return new Promise((resolve) => {
      const transaction = db.transaction([STORE_SPATIAL_CACHE], 'readwrite');
      const store = transaction.objectStore(STORE_SPATIAL_CACHE);
      store.delete(url);
      resolve();
    });
  }
}
