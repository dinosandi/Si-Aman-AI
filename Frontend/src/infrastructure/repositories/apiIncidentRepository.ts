import { httpClient } from "../api/httpClient";
import type { IncidentRepository } from "../../domain/repositories/incidentRepository";
import type { Report, CreateReportInput, ReportCategory, ReportStatus } from "../../domain/entities/report";

interface IncidentResponseDto {
  id: string;
  reporterName: string;
  type: number | string;
  other: string;
  description: string;
  locationDescription: string;
  latitude: number;
  longitude: number;
  imageUrl?: string;
  status: number | string;
  reportedAt: string;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// Helpers for Category Mapping
const mapBackendTypeToCategory = (type: number | string): ReportCategory => {
  const t = typeof type === "string" ? type.toLowerCase() : type;
  switch (t) {
    case 0:
    case "kecelakaan":
      return "accident";
    case 1:
    case "kriminal":
      return "crime";
    case 2:
    case "bencanaalam":
      return "natural_disaster";
    case 3:
    case "jalanrusak":
      return "hazard";
    default:
      return "other";
  }
};

const mapCategoryToBackendType = (category: ReportCategory): number => {
  switch (category) {
    case "accident":
      return 0; // Kecelakaan
    case "crime":
      return 1; // Kriminal
    case "natural_disaster":
      return 2; // BencanaAlam
    case "hazard":
    case "road_block":
      return 3; // JalanRusak
    default:
      return 4; // Other
  }
};

// Helpers for Status Mapping
const mapBackendStatusToStatus = (status: number | string): ReportStatus => {
  const s = typeof status === "string" ? status.toLowerCase() : status;
  switch (s) {
    case 0:
    case "menungguverifikasi":
      return "pending";
    case 1:
    case "terverifikasi":
      return "verified";
    case 2:
    case "ditolak":
      return "rejected";
    case 3:
    case "berhasil":
      return "resolved";
    default:
      return "pending";
  }
};

const getAbsoluteImageUrl = (url?: string): string | undefined => {
  if (!url) return undefined;
  if (url.startsWith("http")) return url;
  
  // Extract host from VITE_API_URL or use localhost default
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5105/api";
  const baseUrl = apiUrl.replace(/\/api$/, ""); // Remove /api suffix to get base host
  
  return `${baseUrl}${url.startsWith("/") ? "" : "/"}${url}`;
};

export class ApiIncidentRepository implements IncidentRepository {
  async getNearby(latitude: number, longitude: number, radiusMeters: number = 50000): Promise<Report[]> {
    const response = await httpClient.get<any, ApiResponse<IncidentResponseDto[]>>("/incidents/nearby", {
      params: {
        lat: latitude,
        lon: longitude,
        radius: radiusMeters,
      },
    });

    if (!response.success || !response.data) {
      throw new Error(response.message || "Gagal mengambil data laporan insiden terdekat.");
    }

    return response.data.map((item) => ({
      id: item.id,
      category: mapBackendTypeToCategory(item.type),
      title: item.locationDescription || `Laporan ${item.type}`,
      description: item.description,
      location: {
        latitude: item.latitude,
        longitude: item.longitude,
        address: item.locationDescription,
        district: item.other || "",
      },
      status: mapBackendStatusToStatus(item.status),
      upvotes: 0,
      downvotes: 0,
      reporterId: "",
      reporterName: item.reporterName,
      imageUrl: getAbsoluteImageUrl(item.imageUrl),
      createdAt: item.reportedAt,
    }));
  }

  async create(input: CreateReportInput): Promise<Report> {
    const formData = new FormData();
    formData.append("Type", mapCategoryToBackendType(input.category).toString());
    formData.append("Other", input.district || "");
    formData.append("Description", input.description);
    formData.append("LocationDescription", input.address || input.title);
    formData.append("Latitude", input.latitude.toString());
    formData.append("Longitude", input.longitude.toString());
    
    if (input.image) {
      formData.append("Image", input.image);
    }

    const response = await httpClient.post<any, ApiResponse<IncidentResponseDto>>("/incidents", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    if (!response.success || !response.data) {
      throw new Error(response.message || "Gagal membuat laporan aduan.");
    }

    const item = response.data;
    return {
      id: item.id,
      category: mapBackendTypeToCategory(item.type),
      title: item.locationDescription,
      description: item.description,
      location: {
        latitude: item.latitude,
        longitude: item.longitude,
        address: item.locationDescription,
        district: item.other || "",
      },
      status: mapBackendStatusToStatus(item.status),
      upvotes: 0,
      downvotes: 0,
      reporterId: "",
      reporterName: item.reporterName,
      imageUrl: getAbsoluteImageUrl(item.imageUrl),
      createdAt: item.reportedAt,
    };
  }
}
