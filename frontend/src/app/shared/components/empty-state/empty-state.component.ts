import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="empty-state-card">
      <div class="empty-icon"><i class="bi" [ngClass]="icon.startsWith('bi-') ? icon : ('bi-' + icon)"></i></div>
      <h3>{{ title }}</h3>
      <p>{{ message }}</p>
      <div class="empty-action" *ngIf="actionLabel && actionRoute">
        <a [routerLink]="actionRoute" class="btn btn-primary">
          {{ actionLabel }}
        </a>
      </div>
    </div>
  `,
  styles: [`
    .empty-state-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 4rem 2rem;
      text-align: center;
      background: #ffffff;
      border: 1px dashed var(--border-strong);
      border-radius: var(--radius-xl);
      margin: 1.5rem 0;
    }
    .empty-icon {
      font-size: 3.5rem;
      margin-bottom: 1rem;
    }
    .empty-state-card h3 {
      font-size: 1.35rem;
      font-weight: 700;
      color: var(--text-primary);
      margin-bottom: 0.5rem;
    }
    .empty-state-card p {
      font-size: 0.95rem;
      color: var(--text-secondary);
      max-width: 420px;
      margin-bottom: 1.5rem;
    }
  `]
})
export class EmptyStateComponent {
  @Input() icon: string = 'bi-search';
  @Input() title: string = 'No results found';
  @Input() message: string = 'We couldn\'t find any matching records. Try adjusting your filters.';
  @Input() actionLabel?: string;
  @Input() actionRoute?: string | any[];
}
