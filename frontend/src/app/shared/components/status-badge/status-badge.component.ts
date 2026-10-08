import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="badge" [ngClass]="badgeClass">
      <span class="badge-dot">●</span>
      {{ label || status }}
    </span>
  `,
  styles: [`
    .badge-dot {
      font-size: 0.65rem;
      margin-right: 0.15rem;
    }
  `]
})
export class StatusBadgeComponent {
  @Input({ required: true }) status: string = '';
  @Input() label?: string;

  get badgeClass(): string {
    const s = this.status?.toUpperCase();
    switch (s) {
      case 'ACTIVE':
      case 'SUCCESS':
      case 'DELIVERED':
      case 'CONFIRMED':
      case 'AVAILABLE':
      case 'CREDIT':
        return 'badge-success';

      case 'CREATED':
      case 'PENDING':
      case 'PROCESSING':
      case 'ASSIGNED':
      case 'ACCEPTED':
      case 'PICKED_UP':
      case 'OUT_FOR_DELIVERY':
      case 'REFUND_PENDING':
      case 'SHIPPED':
        return 'badge-warning';

      case 'INACTIVE':
      case 'CANCELLED':
      case 'FAILED':
      case 'RETURNED':
      case 'FROZEN':
      case 'LOCKED':
        return 'badge-danger';

      case 'DEBIT':
      case 'TOP_UP':
      case 'CUSTOMER':
      case 'MERCHANT':
      case 'ADMIN':
      case 'DELIVERY_AGENT':
        return 'badge-primary';

      case 'REFUNDED':
      case 'REFUND':
        return 'badge-info';

      default:
        return 'badge-primary';
    }
  }
}
