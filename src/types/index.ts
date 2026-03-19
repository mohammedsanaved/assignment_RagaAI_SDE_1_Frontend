export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  status: 'Stable' | 'Critical' | 'Recovering';
  lastVisit: string;
  condition: string;
  email?: string;
  phone?: string;
  address?: string;
  bloodGroup?: string;
  createdBy?: string;
  organizationId: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface MedicalHistory {
  id: string;
  date: string;
  title: string;
  doctor: string;
  status: string;
  description?: string;
}

export interface ClinicalNote {
  id: string;
  date: string;
  doctor: string;
  content: string;
  timestamp: string;
}

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: string;
  organizationId: string;
}

export interface Activity {
  id: string;
  type: string;
  name: string;
  time: string;
  userId: string;
}
