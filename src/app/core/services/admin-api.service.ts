import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';

const API = environment.apiUrl;

export interface BusinessOverview {
  stats: { total_institutions: number; active_institutions: number; total_users: number };
  subscription_breakdown: { plan: string; count: string }[];
  status_breakdown: { status: string; count: string }[];
  recent_institutions: Institution[];
  expiring_trials: Institution[];
}

export interface Institution {
  id: string; name: string; type: string; subdomain: string;
  email: string; phone: string; city: string; state: string;
  address: string; principal_name: string;
  subscription_plan: string; subscription_status: string;
  subscription_expires_at: string; is_active: boolean; created_at: string;
  user_counts?: Record<string, number>;
  subscriptions?: any[];
}

export interface PaginatedInstitutions {
  data: Institution[]; total: number; page: number; limit: number; totalPages: number;
}

export interface OnboardDto {
  name: string; type: string; subdomain: string; email: string;
  phone?: string; city?: string; state?: string; address?: string;
  pincode?: string; principal_name?: string;
  admin_name: string; admin_password: string;
}

@Injectable({ providedIn: 'root' })
export class AdminApiService {
  constructor(private http: HttpClient) {}

  getOverview() { return this.http.get<BusinessOverview>(`${API}/vilaasalabs-admin/overview`); }

  getRevenue() { return this.http.get<any>(`${API}/vilaasalabs-admin/revenue`); }

  listInstitutions(page = 1, limit = 20, search?: string) {
    const p = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (search) p.set('search', search);
    return this.http.get<PaginatedInstitutions>(`${API}/vilaasalabs-admin/institutions?${p}`);
  }

  getAllInstitutions() {
    return this.http.get<Institution[]>(`${API}/institutions`);
  }

  getInstitution(id: string) {
    return this.http.get<Institution>(`${API}/vilaasalabs-admin/institutions/${id}`);
  }

  updateInstitution(id: string, dto: Partial<Institution>) {
    return this.http.patch(`${API}/vilaasalabs-admin/institutions/${id}`, dto);
  }

  changeSubscription(id: string, dto: { plan: string; billing_cycle: string; duration_months: number; amount?: number }) {
    return this.http.post(`${API}/vilaasalabs-admin/institutions/${id}/subscription`, dto);
  }

  suspendInstitution(id: string) { return this.http.post(`${API}/vilaasalabs-admin/institutions/${id}/suspend`, {}); }

  reactivateInstitution(id: string) { return this.http.post(`${API}/vilaasalabs-admin/institutions/${id}/reactivate`, {}); }

  broadcast(dto: { subject: string; body: string; institution_ids?: string[] }) {
    return this.http.post(`${API}/vilaasalabs-admin/broadcast`, dto);
  }

  onboardInstitution(data: OnboardDto) { return this.http.post(`${API}/institutions/onboard`, data); }

  toggleInstitutionActive(id: string) { return this.http.patch(`${API}/institutions/${id}/toggle-active`, {}); }
}
