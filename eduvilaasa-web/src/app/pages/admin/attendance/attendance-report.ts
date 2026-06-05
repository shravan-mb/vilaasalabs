import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-attendance-report',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './attendance-report.html',
  styleUrl: './attendance-report.scss',
})
export class AttendanceReport implements OnInit {
  private api = inject(ApiService);

  classes = signal<any[]>([]);
  records = signal<any[]>([]);
  loading = signal(false);

  filter = {
    class_id: '',
    from_date: this.today(),
    to_date: this.today(),
  };

  ngOnInit() {
    this.api.get<any[]>('classes').subscribe((data) => this.classes.set(data));
  }

  search() {
    if (!this.filter.class_id) return;
    this.loading.set(true);
    const params: any = {
      class_id: this.filter.class_id,
      from_date: this.filter.from_date,
      to_date: this.filter.to_date,
    };
    this.api.get<any[]>('attendance', params).subscribe({
      next: (data) => { this.records.set(data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  statusClass(status: string): string {
    return { present: 'badge-green', absent: 'badge-red', late: 'badge-yellow', holiday: 'badge-gray' }[status] ?? 'badge-gray';
  }

  private today(): string {
    return new Date().toISOString().split('T')[0];
  }
}
