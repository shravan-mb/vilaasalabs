import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

const API = 'http://localhost:3000/api/v1';

export interface BusinessOverview {
  stats: { total_institutions: number; active_institutions: number; total_users: number };
  subscription_breakdown: { plan: string; count: string }[];
  status_breakdown: { status: string; count: string }[];
  recent_institutions: Institution[];
  expiring_trials: Institution[];
}

export interface Institution {
  id: string;
  name: string;
  type: string;
  subdomain: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  subscription_plan: string;
  subscription_status: string;
  subscription_expires_at: string;
  is_active: boolean;
  created_at: string;
}

export interface OnboardDto {
  name: string;
  type: string;
  subdomain: string;
  email: string;
  phone?: string;
  city?: string;
  state?: string;
  address?: string;
  pincode?: string;
  principal_name?: string;
  admin_name: string;
  admin_password: string;
}

@Injectable({ providedIn: 'root' })
export class AdminApiService {
  constructor(private http: HttpClient) {}

  getOverview() {
    return this.http.get<BusinessOverview>(`${API}/vilaasalabs-admin/overview`);
  }

  getAllInstitutions() {
    return this.http.get<Institution[]>(`${API}/institutions`);
  }

  getInstitution(id: string) {
    return this.http.get<Institution>(`${API}/vilaasalabs-admin/institutions/${id}`);
  }

  onboardInstitution(data: OnboardDto) {
    return this.http.post(`${API}/institutions/onboard`, data);
  }

  toggleInstitutionActive(id: string) {
    return this.http.patch(`${API}/institutions/${id}/toggle-active`, {});
  }
}
