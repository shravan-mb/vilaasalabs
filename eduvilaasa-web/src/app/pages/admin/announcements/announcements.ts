import { HttpClient } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { UpperCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog';
import { SkeletonComponent } from '../../../shared/components/skeleton/skeleton';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-announcements',
  standalone: true,
  imports: [FormsModule, UpperCasePipe, SkeletonComponent, ConfirmDialogComponent],
  templateUrl: './announcements.html',
  styleUrl: './announcements.scss',
})
export class AnnouncementsPage implements OnInit {
  private http  = inject(HttpClient);
  private auth  = inject(AuthService);
  private toast = inject(ToastService);

  items       = signal<any[]>([]);
  loading     = signal(true);
  showForm    = signal(false);
  deleteTarget = signal<any>(null);
  saving      = signal(false);

  form = { title: '', body: '', target_role: 'all' };

  // Image upload state
  imageFile    : File | null = null;
  imagePreview = signal('');
  imageUploading = signal(false);

  dateStr(val: string) { return val ? val.substring(0, 10) : ''; }

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.http.get<any[]>(`${environment.apiUrl}/announcements`).subscribe({
      next: (res) => { this.items.set(res ?? []); this.loading.set(false); },
      error: () => { this.toast.error('Failed to load'); this.loading.set(false); },
    });
  }

  openForm() {
    this.form        = { title: '', body: '', target_role: 'all' };
    this.imageFile   = null;
    this.imagePreview.set('');
    this.showForm.set(true);
  }

  closeForm() {
    this.showForm.set(false);
    this.imageFile = null;
    this.imagePreview.set('');
  }

  onFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const file  = input.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { this.toast.error('Only image files are allowed'); return; }
    if (file.size > 5 * 1024 * 1024)    { this.toast.error('Image must be under 5 MB'); return; }
    this.imageFile = file;
    const reader   = new FileReader();
    reader.onload  = (e) => this.imagePreview.set(e.target?.result as string);
    reader.readAsDataURL(file);
    // reset so same file can be re-selected
    input.value = '';
  }

  removeImage() { this.imageFile = null; this.imagePreview.set(''); }

  save() {
    if (!this.form.title.trim() || !this.form.body.trim()) {
      this.toast.error('Title and message are required');
      return;
    }
    this.saving.set(true);

    if (this.imageFile) {
      this.imageUploading.set(true);
      const fd = new FormData();
      fd.append('file', this.imageFile);
      this.http.post<{ url: string }>(`${environment.apiUrl}/announcements/upload-image`, fd).subscribe({
        next: (res) => { this.imageUploading.set(false); this.postAnnouncement(res.url); },
        error: ()    => { this.toast.error('Image upload failed'); this.saving.set(false); this.imageUploading.set(false); },
      });
    } else {
      this.postAnnouncement();
    }
  }

  private postAnnouncement(imageUrl?: string) {
    const body: any = { ...this.form };
    if (imageUrl) body['image_url'] = imageUrl;
    this.http.post(`${environment.apiUrl}/announcements`, body).subscribe({
      next: () => {
        this.toast.success('Announcement posted');
        this.closeForm();
        this.load();
        this.saving.set(false);
      },
      error: () => { this.toast.error('Failed to post'); this.saving.set(false); },
    });
  }

  openImage(url: string) { window.open(url, '_blank'); }

  doDelete() {
    this.http.delete(`${environment.apiUrl}/announcements/${this.deleteTarget()!.id}`).subscribe({
      next: () => { this.toast.success('Deleted'); this.deleteTarget.set(null); this.load(); },
      error: () => { this.toast.error('Failed'); this.deleteTarget.set(null); },
    });
  }
}
