import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'info' | 'warning';
export interface Toast { id: number; message: string; type: ToastType; }

@Injectable({ providedIn: 'root' })
export class ToastService {
  toasts = signal<Toast[]>([]);

  success(message: string) { this.add(message, 'success'); }
  error(message: string)   { this.add(message, 'error'); }
  info(message: string)    { this.add(message, 'info'); }
  warning(message: string) { this.add(message, 'warning'); }

  private add(message: string, type: ToastType) {
    const id = Date.now() + Math.random();
    this.toasts.update((t) => [...t, { id, message, type }]);
    setTimeout(() => this.remove(id), 4000);
  }

  remove(id: number) {
    this.toasts.update((t) => t.filter((x) => x.id !== id));
  }
}
