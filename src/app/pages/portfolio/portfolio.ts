import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-portfolio',
  imports: [RouterLink],
  templateUrl: './portfolio.html',
  styleUrl: './portfolio.scss',
})
export class Portfolio {
  activeFilter = signal('All');

  filters = ['All', 'Web', 'Mobile', 'AI', 'ERP', 'Design'];

  projects = [
    {
      title: 'NeuroDesk AI',
      category: 'AI',
      tags: ['Python', 'LangChain', 'Angular'],
      desc: 'An AI-powered productivity suite with a built-in LLM assistant, smart notes, and workflow automation.',
      color: '#7C3AED',
      icon: 'fas fa-brain',
      highlight: true,
    },
    {
      title: 'SwiftCart E-Commerce',
      category: 'Web',
      tags: ['Angular', 'Node.js', 'MongoDB'],
      desc: 'High-performance e-commerce platform with real-time inventory, AI recommendations, and payment integration.',
      color: '#2563EB',
      icon: 'fas fa-shopping-cart',
      highlight: false,
    },
    {
      title: 'HealthBridge Mobile',
      category: 'Mobile',
      tags: ['Flutter', 'Firebase', 'HL7'],
      desc: 'Telemedicine app connecting patients with doctors via video, chat, and AI symptom checker. 4.9★ on stores.',
      color: '#059669',
      icon: 'fas fa-heartbeat',
      highlight: false,
    },
    {
      title: 'FinEdge ERP',
      category: 'ERP',
      tags: ['React', 'Node.js', 'PostgreSQL'],
      desc: 'Full-suite ERP for a fintech firm covering HR, payroll, compliance, reporting, and treasury management.',
      color: '#0891B2',
      icon: 'fas fa-layer-group',
      highlight: false,
    },
    {
      title: 'AgroVision App',
      category: 'Mobile',
      tags: ['Flutter', 'TensorFlow', 'AWS'],
      desc: 'AI-powered crop disease detection app for farmers with offline ML models and multilingual support.',
      color: '#65A30D',
      icon: 'fas fa-seedling',
      highlight: false,
    },
    {
      title: 'Lumina Design System',
      category: 'Design',
      tags: ['Figma', 'Angular', 'Storybook'],
      desc: 'A comprehensive design system with 200+ components, dark/light themes, and accessibility compliance.',
      color: '#DC2626',
      icon: 'fas fa-palette',
      highlight: false,
    },
    {
      title: 'TalentFlow HR Platform',
      category: 'Web',
      tags: ['Angular', 'NestJS', 'MySQL'],
      desc: 'End-to-end HR SaaS platform covering recruitment, onboarding, performance reviews, and payroll.',
      color: '#9D5CF6',
      icon: 'fas fa-users',
      highlight: false,
    },
    {
      title: 'ChatSense AI',
      category: 'AI',
      tags: ['Python', 'FastAPI', 'React'],
      desc: 'Enterprise chatbot platform with multi-LLM support, RAG pipeline, analytics dashboard, and white-labelling.',
      color: '#F59E0B',
      icon: 'fas fa-comments',
      highlight: false,
    },
    {
      title: 'CloudOps Dashboard',
      category: 'Web',
      tags: ['Angular', 'AWS SDK', 'Grafana'],
      desc: 'Unified cloud monitoring dashboard with real-time alerts, cost analytics, and auto-scaling controls.',
      color: '#06B6D4',
      icon: 'fas fa-cloud',
      highlight: false,
    },
  ];

  get filtered() {
    const f = this.activeFilter();
    return f === 'All' ? this.projects : this.projects.filter(p => p.category === f);
  }

  setFilter(f: string) { this.activeFilter.set(f); }
}
