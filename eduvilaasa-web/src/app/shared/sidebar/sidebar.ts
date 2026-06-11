import { Component, computed, inject, Input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { InstitutionSettingsService } from '../../core/services/institution-settings.service';

interface NavItem { label: string; icon: string; route: string; }

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
})
export class Sidebar {
  @Input() open = true;
  private auth = inject(AuthService);
  private instSettings = inject(InstitutionSettingsService);
  role = computed(() => this.auth.currentUser()?.role ?? '');

  institutionName      = computed(() => this.instSettings.institutionName());
  institutionInitials  = computed(() => {
    const name = this.instSettings.institutionName();
    if (!name) return 'EV';
    const words = name.trim().split(/\s+/);
    if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
    return (words[0][0] + words[1][0]).toUpperCase();
  });

  navItems = computed<NavItem[]>(() => {
    const r = this.role();
    const settings: NavItem = { label: 'Settings', icon: '⚙', route: '/settings' };

    if (r === 'institution_admin') {
      const items: NavItem[] = [
        { label: 'Dashboard',          icon: '⊞',  route: '/admin/dashboard' },
        { label: 'Students',           icon: '🎓', route: '/admin/students' },
        { label: 'Teachers',           icon: '👨‍🏫', route: '/admin/teachers' },
        { label: 'Staff',              icon: '👤', route: '/admin/staff' },
        { label: 'Parents',            icon: '👪', route: '/admin/parents' },
        { label: 'Classes',            icon: '🏫', route: '/admin/classes' },
        { label: 'Timetable',          icon: '🗓', route: '/admin/timetable' },
        { label: 'Attendance',         icon: '📋', route: '/admin/attendance' },
        { label: 'Teacher Attendance', icon: '🧑‍🏫', route: '/admin/teacher-attendance' },
        { label: 'Tests',              icon: '📝', route: '/admin/tests' },
        { label: 'Test Results',       icon: '📊', route: '/admin/test-results' },
        { label: 'Reports',            icon: '📈', route: '/admin/reports' },
        { label: 'Announcements',      icon: '📢', route: '/admin/announcements' },
        { label: 'Academic Years',     icon: '📅', route: '/admin/academic-years' },
        { label: 'Fees',               icon: '💰', route: '/admin/fees' },
      ];
      if (this.instSettings.showSubscriptionTab) {
        items.push({ label: 'Subscription', icon: '💳', route: '/admin/subscription' });
      }
      items.push(settings);
      return items;
    }

    // Staff (Cashier / Fee Collector) — focused view
    if (r === 'institution_staff') {
      return [
        { label: 'Dashboard',  icon: '⊞',  route: '/admin/dashboard' },
        { label: 'Fees',       icon: '💰', route: '/admin/fees' },
        { label: 'Students',   icon: '🎓', route: '/admin/students' },
        { label: 'Reports',    icon: '📈', route: '/admin/reports' },
        settings,
      ];
    }

    if (r === 'teacher') {
      return [
        { label: 'Dashboard',         icon: '⊞',  route: '/teacher/dashboard' },
        { label: 'My Students',       icon: '🎓', route: '/teacher/students' },
        { label: 'Mark Attendance',   icon: '📋', route: '/teacher/attendance' },
        { label: 'Attendance Report', icon: '📊', route: '/teacher/class-attendance' },
        { label: 'My Schedule',       icon: '🗓', route: '/teacher/timetable' },
        { label: 'Questions',         icon: '❓', route: '/teacher/questions' },
        { label: 'Tests',             icon: '📝', route: '/teacher/tests' },
        { label: 'Test Results',      icon: '✅', route: '/teacher/test-results' },
        { label: 'Gradebook',         icon: '📈', route: '/teacher/gradebook' },
        { label: 'Proctor Dashboard', icon: '📉', route: '/teacher/proctor-performance' },
        { label: 'Meeting Requests',  icon: '🤝', route: '/teacher/meeting-requests' },
        { label: 'Notices',           icon: '📢', route: '/teacher/notices' },
        { label: 'Content Library',   icon: '📚', route: '/teacher/content-library' },
        settings,
      ];
    }

    if (r === 'student') {
      return [
        { label: 'Dashboard',   icon: '⊞',  route: '/student/dashboard' },
        { label: 'Attendance',  icon: '📋', route: '/student/attendance' },
        { label: 'My Tests',    icon: '📝', route: '/student/tests' },
        { label: 'My Results',  icon: '📊', route: '/student/results' },
        { label: 'Timetable',   icon: '📅', route: '/student/timetable' },
        { label: 'Notices',     icon: '📢', route: '/student/notices' },
        settings,
      ];
    }

    if (r === 'parent') {
      return [
        { label: 'Dashboard',        icon: '⊞',  route: '/parent/dashboard' },
        { label: 'Attendance',       icon: '📋', route: '/parent/attendance' },
        { label: 'Tests',            icon: '📝', route: '/parent/tests' },
        { label: 'Results',          icon: '📊', route: '/parent/results' },
        { label: 'Notices',          icon: '📢', route: '/parent/notices' },
        { label: 'Meeting Requests', icon: '🤝', route: '/parent/meeting-requests' },
        settings,
      ];
    }

    return [];
  });
}
