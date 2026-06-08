import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { featureFlagGuard } from './core/guards/feature-flag.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  { path: 'login', loadComponent: () => import('./pages/login/login').then((m) => m.LoginPage) },
  { path: 'forgot-password', loadComponent: () => import('./pages/forgot-password/forgot-password').then((m) => m.ForgotPasswordPage) },
  { path: 'reset-password', loadComponent: () => import('./pages/reset-password/reset-password').then((m) => m.ResetPasswordPage) },

  // Institution Admin + Staff
  {
    path: 'admin',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['institution_admin', 'institution_staff'] },
    loadComponent: () => import('./shared/layout/layout').then((m) => m.Layout),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', loadComponent: () => import('./pages/admin/dashboard/dashboard').then((m) => m.AdminDashboard) },
      { path: 'students', loadComponent: () => import('./pages/admin/students/students').then((m) => m.StudentsPage) },
      { path: 'teachers', loadComponent: () => import('./pages/admin/teachers/teachers').then((m) => m.TeachersPage) },
      { path: 'staff', loadComponent: () => import('./pages/admin/staff/staff').then((m) => m.StaffPage) },
      { path: 'parents', loadComponent: () => import('./pages/admin/parents/parents').then((m) => m.ParentsPage) },
      { path: 'classes', loadComponent: () => import('./pages/admin/classes/classes').then((m) => m.ClassesPage) },
      { path: 'attendance', loadComponent: () => import('./pages/admin/attendance/attendance-report').then((m) => m.AttendanceReport) },
      { path: 'tests', loadComponent: () => import('./pages/admin/tests/tests').then((m) => m.TestsPage) },
      { path: 'test-results', loadComponent: () => import('./pages/admin/test-results/test-results').then((m) => m.AdminTestResultsPage) },
      { path: 'reports', loadComponent: () => import('./pages/admin/reports/reports').then((m) => m.ReportsPage) },
      { path: 'announcements', loadComponent: () => import('./pages/admin/announcements/announcements').then((m) => m.AnnouncementsPage) },
      { path: 'academic-years', loadComponent: () => import('./pages/admin/academic-years/academic-years').then((m) => m.AcademicYearsPage) },
      { path: 'subscription', canActivate: [featureFlagGuard], data: { flagKey: 'show_subscription_tab' }, loadComponent: () => import('./pages/admin/subscription/subscription').then((m) => m.SubscriptionPage) },
      { path: 'timetable', loadComponent: () => import('./pages/admin/timetable/timetable').then((m) => m.AdminTimetablePage) },
      { path: 'fees',     loadComponent: () => import('./pages/admin/fees/fees').then((m) => m.FeesPage) },
    ],
  },

  // Teacher
  {
    path: 'teacher',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['teacher'] },
    loadComponent: () => import('./shared/layout/layout').then((m) => m.Layout),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', loadComponent: () => import('./pages/teacher/dashboard/dashboard').then((m) => m.TeacherDashboard) },
      { path: 'attendance', loadComponent: () => import('./pages/teacher/attendance/mark-attendance').then((m) => m.MarkAttendance) },
      { path: 'class-attendance', loadComponent: () => import('./pages/teacher/class-attendance/class-attendance').then((m) => m.ClassAttendancePage) },
      { path: 'students', loadComponent: () => import('./pages/teacher/students/students').then((m) => m.TeacherStudentsPage) },
      { path: 'questions', loadComponent: () => import('./pages/teacher/questions/questions').then((m) => m.QuestionsPage) },
      { path: 'tests', loadComponent: () => import('./pages/teacher/tests/tests').then((m) => m.TeacherTestsPage) },
      { path: 'test-results', loadComponent: () => import('./pages/teacher/test-results/test-results').then((m) => m.TeacherTestResultsPage) },
      { path: 'gradebook', loadComponent: () => import('./pages/teacher/gradebook/gradebook').then((m) => m.GradebookPage) },
      { path: 'timetable', loadComponent: () => import('./pages/teacher/timetable/timetable').then((m) => m.TeacherTimetablePage) },
      { path: 'proctor-performance', loadComponent: () => import('./pages/teacher/proctor-performance/proctor-performance').then((m) => m.ProctorPerformancePage) },
      { path: 'meeting-requests', loadComponent: () => import('./pages/teacher/meeting-requests/meeting-requests').then((m) => m.TeacherMeetingRequestsPage) },
      { path: 'notices', loadComponent: () => import('./pages/teacher/notices/notices').then((m) => m.TeacherNoticesPage) },
    ],
  },

  // Student
  {
    path: 'student',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['student'] },
    loadComponent: () => import('./shared/layout/layout').then((m) => m.Layout),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', loadComponent: () => import('./pages/student/dashboard/dashboard').then((m) => m.StudentDashboard) },
      { path: 'attendance', loadComponent: () => import('./pages/student/attendance/my-attendance').then((m) => m.MyAttendance) },
      { path: 'tests', loadComponent: () => import('./pages/student/tests/my-tests').then((m) => m.MyTests) },
      { path: 'tests/take/:testId', loadComponent: () => import('./pages/student/tests/take-test').then((m) => m.TakeTestPage) },
      { path: 'results', loadComponent: () => import('./pages/student/results/results').then((m) => m.StudentResultsPage) },
      { path: 'notices', loadComponent: () => import('./pages/student/notices/notices').then((m) => m.StudentNoticesPage) },
      { path: 'timetable', loadComponent: () => import('./pages/student/timetable/timetable').then((m) => m.StudentTimetablePage) },
    ],
  },

  // Parent
  {
    path: 'parent',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['parent'] },
    loadComponent: () => import('./shared/layout/layout').then((m) => m.Layout),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', loadComponent: () => import('./pages/parent/dashboard/dashboard').then((m) => m.ParentDashboard) },
      { path: 'attendance', loadComponent: () => import('./pages/parent/attendance/child-attendance').then((m) => m.ChildAttendance) },
      { path: 'tests', loadComponent: () => import('./pages/parent/tests/child-tests').then((m) => m.ChildTests) },
      { path: 'results', loadComponent: () => import('./pages/parent/results/results').then((m) => m.ParentResultsPage) },
      { path: 'notices', loadComponent: () => import('./pages/parent/notices/notices').then((m) => m.ParentNoticesPage) },
      { path: 'meeting-requests', loadComponent: () => import('./pages/parent/meeting-requests/meeting-requests').then((m) => m.ParentMeetingRequestsPage) },
    ],
  },

  // Settings — all logged-in roles
  {
    path: 'settings',
    canActivate: [authGuard],
    loadComponent: () => import('./shared/layout/layout').then((m) => m.Layout),
    children: [
      { path: '', loadComponent: () => import('./pages/settings/settings').then((m) => m.SettingsPage) },
    ],
  },

  // 404
  { path: 'not-found', loadComponent: () => import('./pages/not-found/not-found').then((m) => m.NotFoundPage) },
  { path: '**', loadComponent: () => import('./pages/not-found/not-found').then((m) => m.NotFoundPage) },
];
