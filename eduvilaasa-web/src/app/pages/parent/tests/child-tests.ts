import { Component, inject, OnInit, signal } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-child-tests',
  standalone: true,
  templateUrl: './child-tests.html',
})
export class ChildTests implements OnInit {
  private api = inject(ApiService);
  tests = signal<any[]>([]);
  loading = signal(true);

  ngOnInit() {
    this.api.get<any[]>('tests').subscribe({
      next: (data) => { this.tests.set(data.filter((t) => t.status === 'published')); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }
}
