import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  template: `
    @if (open) {
      <div class="overlay" (click)="cancel.emit()">
        <div class="dialog" (click)="$event.stopPropagation()">
          <div class="dialog-icon">{{ icon }}</div>
          <h3>{{ title }}</h3>
          <p>{{ message }}</p>
          <div class="dialog-actions">
            <button class="btn btn-secondary" (click)="cancel.emit()">{{ cancelLabel }}</button>
            <button class="btn btn-danger" (click)="confirm.emit()">{{ confirmLabel }}</button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .overlay { position:fixed; inset:0; background:rgba(0,0,0,.7); z-index:1000; display:flex; align-items:center; justify-content:center; }
    .dialog { background:#111; border:1px solid #2a2a2a; border-radius:12px; padding:28px; max-width:380px; width:90%; text-align:center; }
    .dialog-icon { font-size:36px; margin-bottom:12px; }
    h3 { font-size:18px; font-weight:600; color:#fff; margin-bottom:8px; }
    p { color:#888; font-size:14px; margin-bottom:24px; line-height:1.5; }
    .dialog-actions { display:flex; gap:10px; justify-content:center; }
    .btn-danger { background:#ef4444 !important; }
    .btn-danger:hover { background:#dc2626 !important; }
  `],
})
export class ConfirmDialogComponent {
  @Input() open = false;
  @Input() title = 'Are you sure?';
  @Input() message = 'This action cannot be undone.';
  @Input() confirmLabel = 'Delete';
  @Input() cancelLabel = 'Cancel';
  @Input() icon = '🗑';
  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();
}
