import { Component, HostListener, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
})
export class Navbar {
  scrolled = signal(false);
  menuOpen = signal(false);

  navLinks = [
    { label: 'Home',      path: '/' },
    { label: 'Services',  path: '/services' },
    { label: 'Products',  path: '/products/eduvilaasa' },
    { label: 'About',     path: '/about' },
    { label: 'Portfolio', path: '/portfolio' },
    { label: 'Contact',   path: '/contact' },
  ];

  @HostListener('window:scroll')
  onScroll() {
    this.scrolled.set(window.scrollY > 40);
  }

  toggleMenu() {
    this.menuOpen.update(v => !v);
  }

  closeMenu() {
    this.menuOpen.set(false);
  }
}
