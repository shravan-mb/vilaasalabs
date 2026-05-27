import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-about',
  imports: [RouterLink],
  templateUrl: './about.html',
  styleUrl: './about.scss',
})
export class About {
  values = [
    { icon: 'fas fa-lightbulb',  title: 'Innovation First',   desc: 'We stay ahead of the curve, integrating the latest technologies to future-proof your products.' },
    { icon: 'fas fa-handshake',  title: 'Client Partnership',  desc: 'We treat every project as a long-term partnership, not just a transaction.' },
    { icon: 'fas fa-gem',        title: 'Quality Obsession',   desc: 'From code quality to UI polish — we never compromise on craftsmanship.' },
    { icon: 'fas fa-bolt',       title: 'Agile Delivery',      desc: 'Sprint-based workflows with transparent communication ensure on-time, on-budget delivery.' },
  ];

  team = [
    { name: 'Founder & CEO',       initials: 'VL', role: 'Strategy & Vision',         desc: 'Leads product vision and business strategy across all verticals.' },
    { name: 'Head of Engineering',  initials: 'HE', role: 'Full-Stack & Architecture', desc: 'Architects scalable systems and leads the technical team.' },
    { name: 'AI & ML Lead',         initials: 'AI', role: 'Artificial Intelligence',   desc: 'Designs and trains ML models powering intelligent features.' },
    { name: 'Design Lead',          initials: 'DL', role: 'UI/UX & Brand Design',      desc: 'Creates research-backed, visually compelling user experiences.' },
    { name: 'Mobile Lead',          initials: 'ML', role: 'iOS & Android',             desc: 'Builds cross-platform mobile apps with native-level performance.' },
    { name: 'DevOps Engineer',      initials: 'DO', role: 'Cloud & Infrastructure',    desc: 'Ensures 99.9% uptime through robust cloud architecture.' },
  ];

  milestones = [
    { year: '2019', title: 'Founded',              desc: 'Vilaasa Labs was born with a vision to democratise enterprise-grade software.' },
    { year: '2020', title: 'First 10 Clients',     desc: 'Delivered our first batch of websites and mobile apps to happy clients.' },
    { year: '2021', title: 'AI Division Launched', desc: 'Formed a dedicated AI & ML team to build intelligent solutions.' },
    { year: '2022', title: 'ERP Platform',         desc: 'Released our flagship ERP product serving 15+ enterprises.' },
    { year: '2023', title: '30+ Projects Done',    desc: 'Hit 30 successful project deliveries across 8 countries.' },
    { year: '2024', title: 'Global Expansion',     desc: 'Opened service offerings to international markets and remote clients worldwide.' },
  ];
}
