import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-footer',
  imports: [RouterLink],
  templateUrl: './footer.html',
  styleUrl: './footer.scss',
})
export class Footer {
  currentYear = new Date().getFullYear();

  services = [
    'Website Development',
    'Android / iOS Apps',
    'AI Solutions',
    'ERP Systems',
    'Cloud & Maintenance',
    'UI/UX Design',
  ];

  links = [
    { label: 'Home',      path: '/' },
    { label: 'Services',  path: '/services' },
    { label: 'About',     path: '/about' },
    { label: 'Portfolio', path: '/portfolio' },
    { label: 'Contact',   path: '/contact' },
  ];

  socials = [
    { icon: 'fab fa-linkedin-in', url: 'https://linkedin.com',   label: 'LinkedIn' },
    { icon: 'fab fa-twitter',     url: 'https://twitter.com',    label: 'Twitter' },
    { icon: 'fab fa-github',      url: 'https://github.com',     label: 'GitHub' },
    { icon: 'fab fa-instagram',   url: 'https://instagram.com',  label: 'Instagram' },
  ];
}
