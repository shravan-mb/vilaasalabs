import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AdminApiService, Institution, PaginatedInstitutions } from '../../../core/services/admin-api.service';

@Component({
  selector: 'app-schools-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './schools-list.html',
  styleUrl: './schools-list.scss'
})
export class SchoolsList implements OnInit {
  schools = signal<Institution[]>([]);
  loading = signal(true);
  error = signal('');
  search = '';
  page = signal(1);
  totalPages = signal(1);
  total = signal(0);
  readonly limit = 20;

  constructor(private api: AdminApiService) {}

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.api.listInstitutions(this.page(), this.limit, this.search || undefined).subscribe({
      next: (res: PaginatedInstitutions) => {
        this.schools.set(res.data);
        this.total.set(res.total);
        this.totalPages.set(res.totalPages);
        this.loading.set(false);
      },
      error: () => { this.error.set('Failed to load schools'); this.loading.set(false); }
    });
  }

  onSearch() { this.page.set(1); this.load(); }

  prevPage() { if (this.page() > 1) { this.page.update(p => p - 1); this.load(); } }
  nextPage() { if (this.page() < this.totalPages()) { this.page.update(p => p + 1); this.load(); } }

  statusClass(status: string): string {
    const map: Record<string, string> = { active: 'badge-success', trial: 'badge-info', expired: 'badge-error', suspended: 'badge-warning' };
    return map[status] ?? 'badge-neutral';
  }
}
