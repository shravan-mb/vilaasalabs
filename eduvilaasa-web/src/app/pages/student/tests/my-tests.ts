import { Component, inject, OnInit, signal } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-my-tests',
  standalone: true,
  templateUrl: './my-tests.html',
})
export class MyTests implements OnInit {
  private api = inject(ApiService);
  tests = signal<any[]>([]);
  loading = signal(true);

  ngOnInit() {
    this.api.get<any[]>('my-tests').subscribe({
      next: (data) => { this.tests.set(data ?? []); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }
}
