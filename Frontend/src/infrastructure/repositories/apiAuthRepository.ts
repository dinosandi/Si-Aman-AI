import { httpClient } from "../api/httpClient";
import type { AuthRepository, RegisterInput } from "../../domain/repositories/authRepository";
import type { User, AuthSession } from "../../domain/entities/user";

interface BackendAuthResponse {
  userId: string;
  name: string;
  email: string;
  role: string;
  isProfileCompleted: boolean;
  accessToken: string;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: string[];
}

export class ApiAuthRepository implements AuthRepository {
  async login(email: string, password: string): Promise<AuthSession> {
    const response = await httpClient.post<any, ApiResponse<BackendAuthResponse>>("/auth/login", {
      email,
      password,
    });

    if (!response.success || !response.data) {
      throw new Error(response.message || "Gagal melakukan masuk log.");
    }

    const { userId, name, role, accessToken } = response.data;
    
    // Map backend role to frontend UserRole
    const userRole = role.toLowerCase() === "admin" ? "admin" : "citizen";

    const user: User = {
      id: userId,
      name: name,
      email: email,
      role: userRole,
      createdAt: new Date().toISOString(),
    };

    return {
      user,
      token: accessToken,
    };
  }

  async register(input: RegisterInput): Promise<AuthSession> {
    const payload = {
      name: input.name,
      address: input.address,
      email: input.email,
      password: input.password,
      phoneNumber: input.phone,
      emergencyContacts: [
        {
          contactName: input.emergencyName || "Kontak Utama",
          contactPhone: input.emergencyPhone,
          relationship: input.emergencyRelationship || "Keluarga",
          isPrimary: true,
        },
      ],
      latitude: input.latitude ?? -7.6167,
      longitude: input.longitude ?? 111.65,
      role: 0, // 0 for User (Citizen)
    };

    const response = await httpClient.post<any, ApiResponse<BackendAuthResponse>>("/auth/register", payload);

    if (!response.success || !response.data) {
      throw new Error(response.message || "Gagal melakukan pendaftaran.");
    }

    const { userId, name, role, accessToken } = response.data;
    const userRole = role.toLowerCase() === "admin" ? "admin" : "citizen";

    const user: User = {
      id: userId,
      name: name,
      email: input.email,
      phone: input.phone,
      role: userRole,
      createdAt: new Date().toISOString(),
    };

    return {
      user,
      token: accessToken,
    };
  }

  async getCurrentUser(): Promise<User> {
    const response = await httpClient.get<any, ApiResponse<any>>("/auth/me");

    if (!response.success || !response.data) {
      throw new Error(response.message || "Gagal mengambil data profil.");
    }

    const data = response.data;
    const userRole = data.role?.toLowerCase() === "admin" ? "admin" : "citizen";

    return {
      id: data.id || data.userId,
      name: data.name,
      email: data.email,
      phone: data.phoneNumber,
      role: userRole,
      createdAt: data.createdAt || new Date().toISOString(),
    };
  }

  async logout(): Promise<void> {
    await httpClient.post<any, ApiResponse<string>>("/auth/logout");
  }
}
