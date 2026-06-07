export type ReportCategory = 
  | 'crime' 
  | 'accident' 
  | 'natural_disaster' 
  | 'hazard' 
  | 'road_block' 
  | 'other';

export type ReportStatus = 
  | 'pending' 
  | 'verified' 
  | 'resolved' 
  | 'rejected';

export interface Location {
  latitude: number;
  longitude: number;
  address?: string;
  district?: string; // e.g. Mejayan, Caruban, Geger, etc. (Kab. Madiun)
}

export interface Report {
  id: string;
  category: ReportCategory;
  title: string;
  description: string;
  location: Location;
  status: ReportStatus;
  upvotes: number;
  downvotes: number;
  votedUserIds?: string[];
  reporterId: string;
  reporterName?: string;
  imageUrl?: string;
  createdAt: string;
  verifiedAt?: string;
  resolvedAt?: string;
}

export interface CreateReportInput {
  category: ReportCategory;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  address?: string;
  district?: string;
  image?: File | Blob;
}
