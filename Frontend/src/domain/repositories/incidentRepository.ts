import type { Report, CreateReportInput } from "../entities/report";

export interface IncidentRepository {
  getNearby(latitude: number, longitude: number, radiusMeters?: number): Promise<Report[]>;
  create(input: CreateReportInput): Promise<Report>;
  verify(id: string): Promise<void>;
  reject(id: string): Promise<void>;
  resolve(id: string): Promise<void>;
  delete(id: string): Promise<void>;
  vote(id: string, type: number): Promise<any>;
}
