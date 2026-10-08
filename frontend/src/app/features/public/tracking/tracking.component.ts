import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { DeliveryService } from '../../../core/services/delivery.service';
import { DeliveryDto, DeliveryStatus } from '../../../core/models/delivery.models';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-tracking',
  standalone: true,
  imports: [CommonModule, FormsModule, StatusBadgeComponent],
  template: `
    <div class="tracking-page container">
      <div class="tracking-hero">
        <h1>Track Your Shipment</h1>
        <p>Enter your tracking number (e.g. <code>TRK-ESHOP-998877</code>) to view live delivery status</p>

        <form (ngSubmit)="onTrack()" class="tracking-input-form">
          <input
            type="text"
            [(ngModel)]="trackingNumber"
            name="trackingNumber"
            placeholder="Enter Tracking Number..."
            class="track-input"
            required
          />
          <button type="submit" class="btn btn-accent btn-lg" [disabled]="isLoading">
            {{ isLoading ? 'Searching...' : 'Track Package' }}
          </button>
        </form>
      </div>

      <!-- Result Card -->
      <div class="tracking-result-card card animate-fade-in" *ngIf="delivery()">
        <div class="result-header">
          <div>
            <span class="tracking-code">Tracking: <strong>{{ delivery()?.trackingNumber }}</strong></span>
            <h2>Order #{{ delivery()?.orderId }}</h2>
          </div>
          <app-status-badge [status]="delivery()?.status || ''"></app-status-badge>
        </div>

        <!-- Visual Delivery Stepper -->
        <div class="stepper-wrap">
          <div class="stepper-step" [class.completed]="isStepCompleted('PENDING')" [class.active]="delivery()?.status === 'PENDING'">
            <div class="step-circle"><i class="bi bi-bag-check"></i></div>
            <span class="step-label">Order Placed</span>
          </div>
          <div class="step-line" [class.filled]="isStepCompleted('ASSIGNED')"></div>

          <div class="stepper-step" [class.completed]="isStepCompleted('ASSIGNED')" [class.active]="delivery()?.status === 'ASSIGNED'">
            <div class="step-circle"><i class="bi bi-clipboard-check"></i></div>
            <span class="step-label">Assigned</span>
          </div>
          <div class="step-line" [class.filled]="isStepCompleted('ACCEPTED')"></div>

          <div class="stepper-step" [class.completed]="isStepCompleted('ACCEPTED')" [class.active]="delivery()?.status === 'ACCEPTED'">
            <div class="step-circle"><i class="bi bi-bicycle"></i></div>
            <span class="step-label">Accepted</span>
          </div>
          <div class="step-line" [class.filled]="isStepCompleted('PICKED_UP')"></div>

          <div class="stepper-step" [class.completed]="isStepCompleted('PICKED_UP')" [class.active]="delivery()?.status === 'PICKED_UP'">
            <div class="step-circle"><i class="bi bi-building"></i></div>
            <span class="step-label">Picked Up</span>
          </div>
          <div class="step-line" [class.filled]="isStepCompleted('OUT_FOR_DELIVERY')"></div>

          <div class="stepper-step" [class.completed]="isStepCompleted('OUT_FOR_DELIVERY')" [class.active]="delivery()?.status === 'OUT_FOR_DELIVERY'">
            <div class="step-circle"><i class="bi bi-truck"></i></div>
            <span class="step-label">Out for Delivery</span>
          </div>
          <div class="step-line" [class.filled]="isStepCompleted('DELIVERED')"></div>

          <div class="stepper-step" [class.completed]="delivery()?.status === 'DELIVERED'" [class.active]="delivery()?.status === 'DELIVERED'">
            <div class="step-circle"><i class="bi bi-check2-circle"></i></div>
            <span class="step-label">Delivered</span>
          </div>
        </div>

        <!-- Delivery Metadata -->
        <div class="details-grid">
          <div class="detail-box">
            <span class="detail-label">Recipient</span>
            <strong>{{ delivery()?.recipientName }}</strong>
            <small>{{ delivery()?.recipientPhone }}</small>
          </div>

          <div class="detail-box">
            <span class="detail-label">Destination Address</span>
            <p>{{ delivery()?.deliveryAddress }}</p>
          </div>

          <div class="detail-box" *ngIf="delivery()?.deliveryAgentUsername">
            <span class="detail-label">Assigned Courier Partner</span>
            <strong><i class="bi bi-person-badge me-1"></i> {{ delivery()?.deliveryAgentUsername }}</strong>
          </div>

          <div class="detail-box" *ngIf="delivery()?.deliveredAt">
            <span class="detail-label">Delivery Timestamp</span>
            <strong>{{ delivery()?.deliveredAt | date:'medium' }}</strong>
          </div>
        </div>
      </div>

      <div class="not-found-card card animate-fade-in" *ngIf="hasSearched && !delivery() && !isLoading">
        <div class="not-found-icon"><i class="bi bi-question-circle"></i></div>
        <h3>No Tracking Record Found</h3>
        <p>We couldn't locate any package associated with <strong>{{ trackingNumber }}</strong>. Please verify the code and try again.</p>
      </div>
    </div>
  `,
  styles: [`
    .tracking-page {
      padding: 3rem 1.25rem 5rem;
      max-width: 900px;
    }
    .tracking-hero {
      text-align: center;
      margin-bottom: 3rem;
    }
    .tracking-hero h1 { font-size: 2.4rem; font-weight: 800; margin-bottom: 0.5rem; }
    .tracking-hero p { color: var(--text-secondary); font-size: 1rem; margin-bottom: 2rem; }
    .tracking-hero code { background: #e0e7ff; color: #3730a3; padding: 0.2rem 0.4rem; border-radius: 4px; }

    .tracking-input-form {
      display: flex;
      gap: 0.75rem;
      max-width: 600px;
      margin: 0 auto;
    }
    .track-input {
      flex: 1;
      padding: 0.85rem 1.25rem;
      font-size: 1rem;
      border: 2px solid var(--primary-500);
      border-radius: var(--radius-lg);
      outline: none;
    }
    .track-input:focus {
      box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.2);
    }

    .tracking-result-card {
      padding: 2.5rem;
      background: #ffffff;
      border: 1px solid var(--border-subtle);
    }
    .result-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 2.5rem;
      padding-bottom: 1.5rem;
      border-bottom: 1px solid var(--border-subtle);
    }
    .tracking-code { font-size: 0.85rem; color: var(--text-secondary); text-transform: uppercase; }
    .result-header h2 { font-size: 1.6rem; margin-top: 0.25rem; }

    /* Stepper */
    .stepper-wrap {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 3rem;
      overflow-x: auto;
      padding: 1rem 0;
    }
    .stepper-step {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      text-align: center;
      min-width: 80px;
    }
    .step-circle {
      width: 44px;
      height: 44px;
      border-radius: var(--radius-full);
      background: var(--bg-subtle);
      border: 2px solid var(--border-subtle);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
      transition: all var(--transition-fast);
    }
    .stepper-step.completed .step-circle {
      background: var(--success-bg);
      border-color: var(--success-solid);
    }
    .stepper-step.active .step-circle {
      background: var(--primary-100);
      border-color: var(--primary-600);
      box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.2);
    }
    .step-label {
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--text-secondary);
    }
    .stepper-step.active .step-label { color: var(--primary-700); }
    .step-line {
      flex: 1;
      height: 4px;
      background: var(--border-subtle);
      margin: 0 0.5rem;
      margin-bottom: 1.5rem;
      border-radius: var(--radius-full);
    }
    .step-line.filled { background: var(--success-solid); }

    /* Details Grid */
    .details-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1.5rem;
      background: var(--bg-subtle);
      padding: 1.5rem;
      border-radius: var(--radius-lg);
    }
    .detail-box { display: flex; flex-direction: column; gap: 0.25rem; }
    .detail-label { font-size: 0.75rem; font-weight: 700; text-transform: uppercase; color: var(--text-muted); }
    .detail-box strong { font-size: 0.95rem; color: var(--text-primary); }
    .detail-box p { font-size: 0.875rem; color: var(--text-secondary); margin: 0; }

    .not-found-card {
      text-align: center;
      padding: 3rem;
      background: #ffffff;
    }
    .not-found-icon { font-size: 3rem; margin-bottom: 1rem; }
  `]
})
export class TrackingComponent implements OnInit {
  trackingNumber: string = '';
  delivery = signal<DeliveryDto | null>(null);
  isLoading: boolean = false;
  hasSearched: boolean = false;

  private statusRank: Record<DeliveryStatus, number> = {
    CREATED: 1,
    AVAILABLE: 2,
    PENDING: 2,
    ASSIGNED: 3,
    ACCEPTED: 3,
    PICKED_UP: 4,
    OUT_FOR_DELIVERY: 5,
    DELIVERED: 6,
    FAILED: 0,
    CANCELLED: 0,
    RETURNED: 0
  };

  constructor(
    private route: ActivatedRoute,
    private deliveryService: DeliveryService
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['trackingNumber']) {
        this.trackingNumber = params['trackingNumber'];
        this.onTrack();
      }
    });
  }

  onTrack(): void {
    if (!this.trackingNumber.trim()) return;

    this.isLoading = true;
    this.hasSearched = true;

    this.deliveryService.getDeliveryByTrackingNumber(this.trackingNumber.trim()).subscribe({
      next: (res) => {
        this.delivery.set(res);
        this.isLoading = false;
      },
      error: () => {
        this.delivery.set(null);
        this.isLoading = false;
      }
    });
  }

  isStepCompleted(targetStatus: DeliveryStatus): boolean {
    const current = this.delivery()?.status;
    if (!current) return false;
    const currentRank = this.statusRank[current] || 0;
    const targetRank = this.statusRank[targetStatus] || 0;
    return currentRank >= targetRank;
  }
}
