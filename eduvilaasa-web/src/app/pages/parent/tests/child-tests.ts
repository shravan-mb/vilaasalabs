import { Component, inject, OnInit, signal } from '@angular/core';
import { SlicePipe } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-child-tests',
  standalone: true,
  imports: [SlicePipe],
  templateUrl: './child-tests.html',
})
export class ChildTests implements OnInit {
  private api = inject(ApiService);
  tests   = signal<any[]>([]);
  loading = signal(true);
  error   = signal('');

  ngOnInit() {
    this.api.get<any[]>('parent-tests').subscribe({
      next: (data) => { this.tests.set(data ?? []); this.loading.set(false); },
      error: () => { this.error.set('Failed to load tests'); this.loading.set(false); },
    });
  }
}
