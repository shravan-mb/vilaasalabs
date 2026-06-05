import { HttpClient } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ToastService } from '../../../core/services/toast.service';
import { SkeletonComponent } from '../../../shared/components/skeleton/skeleton';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-parent-notices',
  standalone: true,
  imports: [SkeletonComponent],
  template: `
    <div class="page-header"><div><h1>Notices</h1><p>School announcements</p></div></div>
    @if (loading()) { <div class="card"><app-skeleton [lines]="4"/></div> }
    @else if (!items().length) { <div class="card"><div class="empty-state">No announcements.</div></div> }
    @else {
      @for (item of items(); track item.id) {
        <div class="card" style="margin-bottom:12px">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
            <h3 style="font-size:15px;font-weight:600;color:#fff">{{ item.title }}</h3>
            <span class="badge badge-info" style="font-size:11px">{{ dateStr(item.created_at) }}</span>
          </div>
          <p style="color:#ccc;font-size:14px;line-height:1.6">{{ item.body }}</p>
        </div>
      }
    }
  `,
})
export class ParentNoticesPage implements OnInit {
  private http = inject(HttpClient);
  private toast = inject(ToastService);
  items = signal<any[]>([]);
  loading = signal(true);
  dateStr(val: string) { return val ? val.substring(0, 10) : ''; }
  ngOnInit() {
    this.http.get<any[]>(`${environment.apiUrl}/announcements`).subscribe({
      next: (res) => { this.items.set(res); this.loading.set(false); },
      error: () => { this.toast.error('Failed to load'); this.loading.set(false); },
    });
  }
}
