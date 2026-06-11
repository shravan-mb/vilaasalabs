import { HttpClient } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-teacher-students',
  standalone: true,
  imports: [FormsModule, DatePipe],
  templateUrl: './students.html',
  styleUrl: './students.scss',
})
export class TeacherStudentsPage implements OnInit {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private toast = inject(ToastService);

  tab = signal<'proctored' | 'byClass'>('proctored');
  classes = signal<any[]>([]);
  classstudents = signal<any[]>([]);
  proctoredStudents = signal<any[]>([]);
  loadingProctor = signal(true);
  loadingClass = signal(false);
  classId = '';

  // Notes panel
  notesStudent = signal<any>(null);
  notes = signal<any[]>([]);
  newNote = '';
  savingNote = signal(false);
  loadingNotes = signal(false);

  private get base() { return `${environment.apiUrl}/institutions/${this.auth.institutionId}`; }

  ngOnInit() {
    this.http.get<any[]>(`${this.base}/classes`).subscribe({
      next: (res) => this.classes.set((res ?? []).sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }))),
    });
    this.loadProctoredStudents();
  }

  loadProctoredStudents() {
    const teacherId = this.auth.currentUser()?.id;
    if (!teacherId) { this.loadingProctor.set(false); return; }
    this.loadingProctor.set(true);
    this.http.get<any[]>(`${this.base}/users/proctor/${teacherId}/students`).subscribe({
      next: (res) => { this.proctoredStudents.set(res ?? []); this.loadingProctor.set(false); },
      error: () => { this.toast.error('Failed to load proctored students'); this.loadingProctor.set(false); },
    });
  }

  loadClassStudents(classId: string) {
    if (!classId) return;
    this.loadingClass.set(true);
    this.http.get<any[]>(`${this.base}/users/class/${classId}`).subscribe({
      next: (res) => { this.classstudents.set(res ?? []); this.loadingClass.set(false); },
      error: () => { this.toast.error('Failed to load students'); this.loadingClass.set(false); },
    });
  }

  openNotes(student: any) {
    this.notesStudent.set(student);
    this.newNote = '';
    this.notes.set([]);
    this.loadingNotes.set(true);
    this.http.get<any[]>(`${this.base}/users/${student.id}/proctor-notes`).subscribe({
      next: (res) => { this.notes.set(res ?? []); this.loadingNotes.set(false); },
      error: () => { this.toast.error('Failed to load notes'); this.loadingNotes.set(false); },
    });
  }

  addNote() {
    if (!this.newNote.trim()) return;
    const student = this.notesStudent();
    if (!student) return;
    this.savingNote.set(true);
    this.http.post<any>(`${this.base}/users/${student.id}/proctor-notes`, { content: this.newNote.trim() }).subscribe({
      next: (note) => {
        this.notes.update((arr) => [note, ...arr]);
        this.newNote = '';
        this.savingNote.set(false);
      },
      error: () => { this.toast.error('Failed to save note'); this.savingNote.set(false); },
    });
  }

  deleteNote(noteId: string) {
    const student = this.notesStudent();
    if (!student) return;
    this.http.delete(`${this.base}/users/${student.id}/proctor-notes/${noteId}`).subscribe({
      next: () => this.notes.update((arr) => arr.filter((n) => n.id !== noteId)),
      error: () => this.toast.error('Failed to delete note'),
    });
  }
}
