import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-eduvilaasa',
  standalone: true,
  imports: [RouterLink, DecimalPipe],
  templateUrl: './eduvilaasa.html',
  styleUrl: './eduvilaasa.scss',
})
export class EduVilaasaPage {
  features = [
    { icon: 'fas fa-calendar-check', title: 'Attendance Tracking',   desc: 'Mark daily attendance class-wise, generate reports, and alert parents instantly.' },
    { icon: 'fas fa-graduation-cap', title: 'Student Management',    desc: 'Enroll students, assign classes, manage profiles, track academic progress.' },
    { icon: 'fas fa-chalkboard-teacher', title: 'Teacher Tools',     desc: 'Question banks, test creation, gradebooks, timetable and proctor assignments.' },
    { icon: 'fas fa-file-invoice-dollar', title: 'Fee Management',   desc: 'Configure fee heads per class, collect payments, track dues and issue receipts.' },
    { icon: 'fas fa-chart-bar', title: 'Reports & Analytics',        desc: 'Attendance trends, test performance, class-wise analytics — all exportable to CSV.' },
    { icon: 'fas fa-clock', title: 'Timetable Scheduler',            desc: 'Build weekly class schedules, assign teachers and subjects with ease.' },
    { icon: 'fas fa-clipboard-list', title: 'Tests & Results',       desc: 'Create tests from question banks, publish to students, auto-track scores.' },
    { icon: 'fas fa-bullhorn', title: 'Announcements',               desc: 'Send notices to specific classes or the whole school in seconds.' },
    { icon: 'fas fa-users', title: 'Parent Portal',                  desc: 'Parents track attendance, view results, pay fees, and request teacher meetings.' },
  ];

  roles = [
    {
      icon: 'fas fa-user-shield',
      role: 'School Admin',
      color: '#7c3aed',
      points: ['Full control over all modules', 'Fee structure & payment collection', 'User management for all roles', 'Reports & analytics dashboard', 'Feature flag control'],
    },
    {
      icon: 'fas fa-chalkboard-teacher',
      role: 'Teacher',
      color: '#2563eb',
      points: ['Mark & view attendance', 'Create tests from question bank', 'Gradebook & performance tracking', 'View personal timetable', 'Parent meeting management'],
    },
    {
      icon: 'fas fa-user-graduate',
      role: 'Student',
      color: '#06b6d4',
      points: ['View own attendance history', 'Access published tests', 'Check test results & grades', 'View class timetable', 'Read school notices'],
    },
    {
      icon: 'fas fa-heart',
      role: 'Parent',
      color: '#f59e0b',
      points: ["Track child's attendance", 'View test results', 'Check fee dues & payments', 'Read school announcements', 'Request teacher meetings'],
    },
  ];

  plans = [
    { name: 'Trial',   price: 0,    period: 'Free for 7 days', color: '#555', features: ['Up to 50 students', 'All core modules', 'Email support'], popular: false },
    { name: 'Starter', price: 999,  period: '/month',          color: '#2563eb', features: ['Up to 200 students', 'All core modules', 'Fee management', 'Priority support'], popular: false },
    { name: 'Growth',  price: 2499, period: '/month',          color: '#7c3aed', features: ['Up to 600 students', 'All modules', 'Advanced reports', 'Dedicated support'], popular: true },
    { name: 'Pro',     price: 4999, period: '/month',          color: '#7c3aed', features: ['Up to 1,500 students', 'All modules', 'Custom branding', 'Priority onboarding'], popular: false },
    { name: 'Pro Max', price: 9999, period: '/month',          color: '#f59e0b', features: ['Unlimited students', 'All modules', 'White-label option', 'Dedicated account manager'], popular: false },
  ];

  steps = [
    { step: '01', title: 'Contact Us',          desc: 'Fill our contact form or email us at hello@vilaasalabs.com. Tell us your school name and student count.' },
    { step: '02', title: 'We Set Up Your School', desc: 'We onboard your institution within 24 hours — create your subdomain, admin account, and initial configuration.' },
    { step: '03', title: 'Start Using',           desc: 'Your admin logs in, adds teachers and students, and EduVilaasa is live. No IT team required.' },
  ];
}
