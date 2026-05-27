import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  imports: [RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  services = [
    { icon: 'fas fa-code',         title: 'Website Development',  desc: 'Blazing-fast, SEO-optimised websites built with the latest web technologies.' },
    { icon: 'fas fa-mobile-alt',   title: 'Android / iOS Apps',   desc: 'Cross-platform mobile apps that deliver native-level performance and UX.' },
    { icon: 'fas fa-brain',        title: 'AI Solutions',         desc: 'Custom ML models, chatbots, and automation tools that make your business smarter.' },
    { icon: 'fas fa-layer-group',  title: 'ERP Systems',          desc: 'Scalable enterprise resource planning platforms tailored to your workflows.' },
    { icon: 'fas fa-cloud',        title: 'Cloud & Maintenance',  desc: 'DevOps, cloud infrastructure, CI/CD pipelines, and 24/7 support.' },
    { icon: 'fas fa-palette',      title: 'UI/UX Design',         desc: 'Research-driven, pixel-perfect designs that delight users and drive conversion.' },
  ];

  stats = [
    { value: '50+',  label: 'Projects Delivered' },
    { value: '30+',  label: 'Happy Clients' },
    { value: '5+',   label: 'Years Experience' },
    { value: '99%',  label: 'Client Satisfaction' },
  ];

  testimonials = [
    {
      name: 'Arjun Sharma',
      role: 'CEO, TechVentures',
      text: 'Vilaasa Labs transformed our legacy system into a modern AI-powered platform. Outstanding quality and delivery!',
      avatar: 'AS',
    },
    {
      name: 'Priya Nair',
      role: 'Founder, HealthBridge',
      text: 'The mobile app they built for us has 4.9 stars on both stores. Incredible attention to detail and great communication throughout.',
      avatar: 'PN',
    },
    {
      name: 'Ravi Kumar',
      role: 'CTO, FinEdge',
      text: 'Their AI integration boosted our analytics efficiency by 60%. Vilaasa Labs truly understands enterprise needs.',
      avatar: 'RK',
    },
  ];

  techStack = [
    { name: 'Angular',    icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/angularjs/angularjs-original.svg' },
    { name: 'React',      icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg' },
    { name: 'Node.js',    icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg' },
    { name: 'Python',     icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg' },
    { name: 'Flutter',    icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/flutter/flutter-original.svg' },
    { name: 'MongoDB',    icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mongodb/mongodb-original.svg' },
    { name: 'PostgreSQL', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/postgresql/postgresql-original.svg' },
    { name: 'AWS',        icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/amazonwebservices/amazonwebservices-original-wordmark.svg' },
  ];
}
