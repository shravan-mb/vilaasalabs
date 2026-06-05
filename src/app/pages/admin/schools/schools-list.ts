import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AdminApiService, Institution } from '../../../core/services/admin-api.service';

@Component({
  selector: 'app-schools-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './schools-list.html',
  styleUrl: './schools-list.scss'
})
export class SchoolsList implements OnInit {
  schools = signal<Institution[]>([]);
  loading = signal(true);
  error = signal('');

  constructor(private api: AdminApiService) {}

  ngOnInit() {
    this.load();
  }

  load() {
    this.api.getAllInstitutions().subscribe({
      next: (data) => { this.schools.set(data); this.loading.set(false); },
      error: () => { this.error.set('Failed to load schools'); this.loading.set(false); }
    });
  }

  toggleActive(id: string) {
    this.api.toggleInstitutionActive(id).subscribe({ next: () => this.load() });
  }
}
