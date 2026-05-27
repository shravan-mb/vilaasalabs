import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-services',
  imports: [RouterLink],
  templateUrl: './services.html',
  styleUrl: './services.scss',
})
export class Services {
  services = [
    {
      icon: 'fas fa-code',
      title: 'Website Development',
      tagline: 'Fast. Beautiful. Scalable.',
      color: '#7C3AED',
      desc: 'We design and develop high-performance websites using Angular, React, Next.js and more. From marketing sites to complex web apps — we craft pixel-perfect, SEO-optimised experiences that convert visitors into customers.',
      features: ['SPA & SSR Architectures', 'SEO Optimisation', 'CMS Integration', 'Performance Audits', 'Responsive Design', 'Progressive Web Apps'],
    },
    {
      icon: 'fas fa-mobile-alt',
      title: 'Android / iOS Apps',
      tagline: 'Native Feel. Cross-Platform Power.',
      color: '#2563EB',
      desc: 'We build cross-platform mobile applications using Flutter and React Native that deliver native-level performance on both iOS and Android with a single codebase, cutting time-to-market in half.',
      features: ['Flutter & React Native', 'App Store Deployment', 'Push Notifications', 'Offline Capability', 'Native APIs Integration', 'In-App Purchases'],
    },
    {
      icon: 'fas fa-brain',
      title: 'AI Solutions',
      tagline: 'Smarter Products. Better Decisions.',
      color: '#9D5CF6',
      desc: 'From intelligent chatbots to custom machine learning models — we embed AI into your products to automate workflows, generate insights, and deliver personalised user experiences at scale.',
      features: ['LLM Integration', 'Custom ML Models', 'AI Chatbots', 'Computer Vision', 'NLP & Sentiment Analysis', 'Recommendation Engines'],
    },
    {
      icon: 'fas fa-layer-group',
      title: 'ERP Systems',
      tagline: 'One Platform. Total Control.',
      color: '#0891B2',
      desc: 'Custom-built enterprise resource planning solutions that unify your HR, Finance, Inventory, CRM, and operations into a single, powerful platform tailored to your exact business processes.',
      features: ['HR & Payroll Management', 'Financial Accounting', 'Inventory & Supply Chain', 'CRM Module', 'Custom Reporting', 'Role-Based Access Control'],
    },
    {
      icon: 'fas fa-cloud',
      title: 'Cloud & Maintenance',
      tagline: '99.9% Uptime. Zero Headaches.',
      color: '#059669',
      desc: 'We architect and manage your cloud infrastructure on AWS, Azure, or GCP. From CI/CD pipelines to container orchestration and 24/7 monitoring — we keep your systems always on and always fast.',
      features: ['AWS / Azure / GCP', 'Docker & Kubernetes', 'CI/CD Pipelines', '24/7 Monitoring', 'Auto-Scaling', 'Backup & Disaster Recovery'],
    },
    {
      icon: 'fas fa-palette',
      title: 'UI/UX Design',
      tagline: 'Design That Converts.',
      color: '#DC2626',
      desc: 'Our design team creates user interfaces that are not just visually stunning but strategically crafted to drive engagement and conversions. Every pixel is purposeful, every flow is intuitive.',
      features: ['User Research', 'Wireframing & Prototyping', 'Design Systems', 'Usability Testing', 'Motion Design', 'Brand Identity'],
    },
  ];

  process = [
    { step: '01', title: 'Discovery',   icon: 'fas fa-search',       desc: 'We deeply understand your goals, audience, and technical requirements.' },
    { step: '02', title: 'Strategy',    icon: 'fas fa-map',          desc: 'We define the roadmap, tech stack, and project milestones.' },
    { step: '03', title: 'Design',      icon: 'fas fa-pencil-ruler',  desc: 'Wireframes and prototypes are crafted and approved before a line of code is written.' },
    { step: '04', title: 'Build',       icon: 'fas fa-code',          desc: 'Agile sprints deliver working software, continuously tested and reviewed.' },
    { step: '05', title: 'Launch',      icon: 'fas fa-rocket',        desc: 'We deploy, monitor, and ensure a smooth go-live experience.' },
    { step: '06', title: 'Grow',        icon: 'fas fa-chart-line',    desc: 'Post-launch support, analytics, and iterative improvements keep you ahead.' },
  ];

  hexToRgb(hex: string): string {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
      : '124, 58, 237';
  }
}
