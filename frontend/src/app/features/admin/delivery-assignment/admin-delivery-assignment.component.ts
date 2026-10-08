import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DeliveryService } from '../../../core/services/delivery.service';
import { AuthService } from '../../../core/auth/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { DeliveryDto, DeliveryStatus } from '../../../core/models/delivery.models';
import { UserDto } from '../../../core/models/auth.models';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';

@Component({
  selector: 'app-admin-delivery-assignment',
  standalone: true,
  imports: [CommonModule, FormsModule, StatusBadgeComponent, PaginationComponent],
  template: `
    <div class="admin-delivery-page">
      <div class="page-top">
        <div>
          <h2>Courier Partner Dispatch Console</h2>
          <p>Assign pending shipment orders to verified delivery couriers registered in the platform</p>
        </div>
      </div>

      <div class="card table-card">
        <div class="table-responsive">
          <table class="table" *ngIf="deliveries().length > 0; else noDeliv">
            <thead>
              <tr>
                <th>Order #</th>
                <th>Tracking Code</th>
                <th>Recipient & Phone</th>
                <th>Destination Address</th>
                <th>Current Status</th>
                <th>Assigned Courier</th>
                <th>Dispatch Action</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let del of deliveries()">
                <td><strong>#{{ del.orderId }}</strong></td>
                <td><code class="trk-code">{{ del.trackingNumber }}</code></td>
                <td>
                  <strong>{{ del.recipientName }}</strong>
                  <small class="d-block text-muted">{{ del.recipientPhone }}</small>
                </td>
                <td><span class="addr-text">{{ del.deliveryAddress }}</span></td>
                <td>
                  <app-status-badge [status]="del.status" [label]="del.status === 'CREATED' ? 'Merchant Packing' : (del.status === 'AVAILABLE' ? 'Ready for Pickup' : del.status)"></app-status-badge>
                </td>
                <td>
                  <span *ngIf="del.deliveryAgentUsername" class="agent-badge">
                    <i class="bi bi-bicycle me-1"></i> {{ del.deliveryAgentUsername }}
                  </span>
                  <span *ngIf="!del.deliveryAgentUsername" class="unassigned-badge">
                    <span class="text-warning"><i class="bi bi-exclamation-circle me-1"></i> Unassigned</span>
                  </span>
                </td>
                <td>
                  <button
                    class="btn btn-primary btn-sm"
                    (click)="openAssignModal(del)"
                    [disabled]="del.status === 'DELIVERED' || del.status === 'OUT_FOR_DELIVERY'"
                  >
                    {{ del.deliveryAgentId ? 'Reassign Agent' : 'Assign Agent' }}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>

          <ng-template #noDeliv>
            <p style="text-align: center; padding: 3rem; color: var(--text-muted);">No delivery records found.</p>
          </ng-template>
        </div>

        <div style="padding: 1rem; display: flex; justify-content: center;">
          <app-pagination
            [currentPage]="currentPage()"
            [totalPages]="totalPages()"
            (pageChange)="loadDeliveries($event)"
          ></app-pagination>
        </div>
      </div>

      <!-- Assign Delivery Agent Modal -->
      <div class="modal-overlay" *ngIf="selectedDelivery" (click)="selectedDelivery = null">
        <div class="modal-box animate-fade-in" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>Assign Courier to Order #{{ selectedDelivery.orderId }}</h3>
          </div>
          <div class="modal-body">
            <p class="deliv-summary">
              <strong>Recipient:</strong> {{ selectedDelivery.recipientName }} ({{ selectedDelivery.recipientPhone }})<br>
              <strong>Address:</strong> {{ selectedDelivery.deliveryAddress }}
            </p>

            <div class="form-group">
              <label class="form-label">Select Verified Courier Partner (from Database)</label>
              <select [(ngModel)]="selectedAgentId" class="form-select">
                <option [ngValue]="null">Select a Delivery Agent</option>
                <option *ngFor="let agent of availableAgents()" [ngValue]="agent.id">
                  <i class="bi bi-person-badge me-1"></i> {{ agent.username }} ({{ agent.email }}) — {{ getActiveDeliveriesCount(agent.id) }} active deliveries
                </option>
              </select>
              <small class="form-hint" *ngIf="availableAgents().length === 0" style="color: var(--warning-text); display: block; margin-top: 0.35rem;">
                No delivery agents found in system. Register a user with role "Delivery Agent" to add couriers.
              </small>
            </div>

            <div class="form-group">
              <label class="form-label">Dispatch Notes (Optional)</label>
              <input
                type="text"
                [(ngModel)]="dispatchNotes"
                placeholder="e.g. Ring doorbell / Call customer upon arrival"
                class="form-control"
              />
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="selectedDelivery = null">Cancel</button>
            <button class="btn btn-accent" (click)="assignAgent()" [disabled]="!selectedAgentId || isAssigning">
              {{ isAssigning ? 'Assigning...' : 'Confirm Assignment' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .admin-delivery-page { display: flex; flex-direction: column; gap: 1.5rem; }
    .page-top h2 { font-size: 1.85rem; font-weight: 800; }
    .table-card { background: #ffffff; }
    .trk-code { font-family: var(--font-mono); color: var(--primary-700); font-weight: 700; }
    .addr-text { font-size: 0.85rem; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    .agent-badge { font-size: 0.85rem; font-weight: 700; color: var(--info-text); background: var(--info-bg); padding: 0.2rem 0.5rem; border-radius: 4px; }
    .unassigned-badge { font-size: 0.8rem; color: var(--warning-text); background: var(--warning-bg); padding: 0.2rem 0.5rem; border-radius: 4px; font-weight: 700; }

    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.6);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      padding: 1rem;
    }
    .modal-box {
      background: #ffffff;
      border-radius: var(--radius-xl);
      max-width: 480px;
      width: 100%;
      box-shadow: var(--shadow-xl);
      overflow: hidden;
    }
    .modal-header { padding: 1.5rem 1.5rem 1rem; }
    .modal-body { padding: 0 1.5rem 1.5rem; }
    .deliv-summary { font-size: 0.875rem; background: var(--bg-subtle); padding: 0.75rem; border-radius: var(--radius-md); margin-bottom: 1rem; line-height: 1.5; }
    .modal-footer {
      padding: 1rem 1.5rem;
      background: var(--bg-subtle);
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem;
    }
  `]
})
export class AdminDeliveryAssignmentComponent implements OnInit {
  deliveries = signal<DeliveryDto[]>([]);
  availableAgents = signal<UserDto[]>([]);
  currentPage = signal<number>(0);
  totalPages = signal<number>(1);

  selectedDelivery: DeliveryDto | null = null;
  selectedAgentId: number | null = null;
  dispatchNotes: string = '';
  isAssigning: boolean = false;

  constructor(
    private deliveryService: DeliveryService,
    private authService: AuthService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.loadDeliveries(0);
    this.loadAgents();
  }

  loadAgents(): void {
    this.authService.getDeliveryAgents().subscribe({
      next: (agents) => {
        this.availableAgents.set(agents);
      },
      error: () => {}
    });
  }

  getActiveDeliveriesCount(agentId: number): number {
    return this.deliveries().filter(
      d => d.deliveryAgentId === agentId && d.status !== 'DELIVERED' && d.status !== 'FAILED' && d.status !== 'RETURNED'
    ).length;
  }

  loadDeliveries(page: number): void {
    this.deliveryService.getAllDeliveries(undefined, page, 10).subscribe({
      next: (res) => {
        this.deliveries.set(res.content);
        this.currentPage.set(res.number);
        this.totalPages.set(res.totalPages);
      },
      error: () => {}
    });
  }

  openAssignModal(del: DeliveryDto): void {
    this.selectedDelivery = del;
    const currentAgents = this.availableAgents();
    this.selectedAgentId = del.deliveryAgentId || (currentAgents.length > 0 ? currentAgents[0].id : null);
    this.dispatchNotes = del.notes || '';
  }

  assignAgent(): void {
    if (!this.selectedDelivery || !this.selectedAgentId) return;

    this.isAssigning = true;
    const agent = this.availableAgents().find(a => a.id === this.selectedAgentId);
    const notes = this.dispatchNotes;

    this.deliveryService.assignDelivery(this.selectedDelivery.id, this.selectedAgentId, notes).subscribe({
      next: (updated) => {
        this.isAssigning = false;
        const agentName = agent ? agent.username : `Agent #${this.selectedAgentId}`;
        this.toast.success(`Delivery assigned to courier agent ${agentName}.`);
        this.deliveries.update(list => list.map(d => d.id === updated.id ? { ...updated, deliveryAgentUsername: updated.deliveryAgentUsername || agentName } : d));
        this.selectedDelivery = null;
      },
      error: () => {
        this.isAssigning = false;
      }
    });
  }
}
