import type { User, AuthSession } from "../entities/user";

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  phone: string;
  emergencyPhone: string;
  emergencyName?: string;
  emergencyRelationship?: string;
  address: string;
  latitude?: number;
  longitude?: number;
}

export interface AuthRepository {
  login(email: string, password: string): Promise<AuthSession>;
  register(input: RegisterInput): Promise<AuthSession>;
  getCurrentUser(): Promise<User>;
  logout(): Promise<void>;
}
