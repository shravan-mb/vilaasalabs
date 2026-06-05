import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-student-dashboard',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './dashboard.html',
})
export class StudentDashboard implements OnInit {
  auth = inject(AuthService);
  private api = inject(ApiService);

  summary = signal<any>(null);
  proctor = signal<any>(null);

  ngOnInit() {
    const userId = this.auth.currentUser()?.id;
    if (!userId) return;
    const today = new Date().toISOString().split('T')[0];
    const monthStart = today.substring(0, 8) + '01';
    this.api.get<any>(`attendance/student/${userId}/summary`, { from: monthStart, to: today })
      .subscribe({ next: (data) => this.summary.set(data), error: () => {} });
    // load own profile to get proctor info
    this.api.get<any>(`users/${userId}`).subscribe({
      next: (user) => { if (user.proctor) this.proctor.set(user.proctor); },
      error: () => {},
    });
  }
}
