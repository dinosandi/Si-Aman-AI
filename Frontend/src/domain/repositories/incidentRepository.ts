import type { Report, CreateReportInput } from "../entities/report";

export interface IncidentRepository {
  getNearby(latitude: number, longitude: number, radiusMeters?: number): Promise<Report[]>;
  create(input: CreateReportInput): Promise<Report>;
}
