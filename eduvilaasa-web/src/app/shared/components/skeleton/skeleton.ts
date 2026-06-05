import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-skeleton',
  standalone: true,
  template: `
    <div class="skeleton-wrap">
      @for (r of rows; track $index) {
        <div class="skeleton-line" [style.width]="widths[$index % widths.length]"></div>
      }
    </div>
  `,
  styles: [`
    .skeleton-wrap { display:flex; flex-direction:column; gap:10px; }
    .skeleton-line { height:16px; border-radius:4px; background:linear-gradient(90deg,#1a1a1a 25%,#2a2a2a 50%,#1a1a1a 75%); background-size:200% 100%; animation:shimmer 1.4s infinite; }
    @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
  `],
})
export class SkeletonComponent {
  @Input() lines = 4;
  get rows() { return Array(this.lines); }
  widths = ['100%', '85%', '90%', '70%', '80%', '60%'];
}
