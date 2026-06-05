import { Component, inject } from '@angular/core';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  template: `
    <div class="toast-container">
      @for (t of toast.toasts(); track t.id) {
        <div class="toast toast-{{ t.type }}" (click)="toast.remove(t.id)">
          <span class="toast-icon">{{ icons[t.type] }}</span>
          <span>{{ t.message }}</span>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-container { position:fixed; top:20px; right:20px; z-index:9999; display:flex; flex-direction:column; gap:10px; max-width:340px; }
    .toast { display:flex; align-items:center; gap:10px; padding:12px 16px; border-radius:8px; cursor:pointer; font-size:14px; animation:slideIn .2s ease; box-shadow:0 4px 12px rgba(0,0,0,.4); }
    .toast-success { background:#14532d; color:#86efac; border-left:3px solid #22c55e; }
    .toast-error   { background:#450a0a; color:#fca5a5; border-left:3px solid #ef4444; }
    .toast-info    { background:#0c1a3a; color:#93c5fd; border-left:3px solid #3b82f6; }
    .toast-warning { background:#422006; color:#fcd34d; border-left:3px solid #f59e0b; }
    .toast-icon    { font-size:16px; flex-shrink:0; }
    @keyframes slideIn { from { transform:translateX(100%); opacity:0; } to { transform:translateX(0); opacity:1; } }
  `],
})
export class ToastComponent {
  toast = inject(ToastService);
  icons: Record<string, string> = { success: '✓', error: '✕', info: 'ℹ', warning: '⚠' };
}
