import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-contact',
  imports: [FormsModule],
  templateUrl: './contact.html',
  styleUrl: './contact.scss',
})
export class Contact {
  submitted = signal(false);
  sending   = signal(false);

  form = {
    name:    '',
    email:   '',
    phone:   '',
    service: '',
    budget:  '',
    message: '',
  };

  services = [
    'Website Development',
    'Android / iOS Apps',
    'AI Solutions',
    'ERP Systems',
    'Cloud & Maintenance',
    'UI/UX Design',
    'Multiple Services',
    'Other / Not Sure',
  ];

  budgets = [
    'Under ₹50K',
    '₹50K – ₹2L',
    '₹2L – ₹5L',
    '₹5L – ₹10L',
    '₹10L+',
    'Let\'s Discuss',
  ];

  contactInfo = [
    { icon: 'fas fa-envelope', label: 'Email',   value: 'hello@vilaasalabs.com', href: 'mailto:hello@vilaasalabs.com' },
    { icon: 'fas fa-globe',    label: 'Website',  value: 'www.vilaasalabs.com',   href: 'https://www.vilaasalabs.com' },
    { icon: 'fas fa-map-marker-alt', label: 'Location', value: 'India (Remote-First)', href: null },
    { icon: 'fas fa-clock',    label: 'Response', value: 'Within 24 hours',       href: null },
  ];

  onSubmit() {
    this.sending.set(true);
    setTimeout(() => {
      this.sending.set(false);
      this.submitted.set(true);
      this.form = { name: '', email: '', phone: '', service: '', budget: '', message: '' };
    }, 1800);
  }

  resetForm() { this.submitted.set(false); }
}
