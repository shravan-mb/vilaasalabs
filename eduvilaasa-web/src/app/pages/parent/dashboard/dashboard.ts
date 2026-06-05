import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-parent-dashboard',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './dashboard.html',
})
export class ParentDashboard implements OnInit {
  auth = inject(AuthService);
  private api = inject(ApiService);
  children = signal<any[]>([]);

  ngOnInit() {
    const userId = this.auth.currentUser()?.id;
    if (!userId) return;
    this.api.get<any[]>(`users/${userId}/children` as any).subscribe({
      next: (data: any[]) => this.children.set(data ?? []),
      error: () => {},
    });
  }
}
