
export type ComparisonStatus = 'NOWA' | 'ZAMKNIĘTA' | 'W TOKU - ZMIANA' | 'STAGNACJA';
export type RecommendationStatus = 'TODO' | 'DONE' | 'SKIPPED';

export interface Claim {
  id: string;
  claimNumber: string;
  openDate: Date | string;
  lastActionDate: Date | string;
  status: string;
  advisor: string;
  age: number; 
  inactivityDays: number;
  priority: number;
  comparisonStatus?: ComparisonStatus;
  recommendationStatus?: RecommendationStatus; // Nowe pole
  importDate: string;
  lastComment?: string;
  blockingReason?: string; 
}

export interface AdvisorKPI {
  name: string;
  openCount: number;
  newCount: number;
  stagnantCount: number;
  closedCount: number;
  avgAge: number;
  overduePercent: number;
}

export interface HistoryPoint {
  date: string;
  count: number;
}

export type UserRole = 'ADMIN' | 'USER';
export type UserStatus = 'ACTIVE' | 'BLOCKED';

export interface User {
  id: string;
  username: string;
  fullName: string;
  password?: string;
  role: UserRole;
  status: UserStatus;
  allowedApps: string[];
}

export interface NfmServiceReport {
  id: string;
  name: string;
  email: string;
  count: number;
  fileName: string;
  excelBlob: Blob;
  excelBase64: string;
  subject: string;
  body: string;
}

export interface HertzFleetRecord {
  id: string;
  location: string;
  locationCode: string;
  managerName: string;
  email: string;
  vehicleModel: string;
  licensePlate: string;
  actionType: string;
  serviceCenterName: string;
  daysPending: number;
  originalRow: any[];
  originalHeader: any[];
}
