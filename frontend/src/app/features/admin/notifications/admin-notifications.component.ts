import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NotificationService } from '../../../core/services/notification.service';
import { ToastService } from '../../../core/services/toast.service';
import { NotificationDto } from '../../../core/models/notification.models';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';

@Component({
  selector: 'app-admin-notifications',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, StatusBadgeComponent, PaginationComponent],
  template: `
    <div class="admin-notifs-page">
      <div class="page-top">
        <div>
          <h2>System Broadcast & Alerts</h2>
          <p>Dispatch broadcast notifications and review microservice event alert logs</p>
        </div>
      </div>

      <div class="notifs-layout">
        <!-- Send Notification Form -->
        <div class="card form-card">
          <div class="card-header">
            <h3>Dispatch Targeted Notification</h3>
          </div>
          <div class="card-body">
            <form [formGroup]="sendForm" (ngSubmit)="onSend()">
              <div class="form-group">
                <label class="form-label" for="recipientEmail">Recipient Email *</label>
                <input
                  id="recipientEmail"
                  type="email"
                  formControlName="recipientEmail"
                  placeholder="e.g. customer@example.com"
                  class="form-control"
                />
              </div>

              <div class="form-group">
                <label class="form-label" for="subject">Subject *</label>
                <input
                  id="subject"
                  type="text"
                  formControlName="subject"
                  placeholder="e.g. Account Security Update"
                  class="form-control"
                />
              </div>

              <div class="form-group">
                <label class="form-label" for="notifType">Type</label>
                <select id="notifType" formControlName="type" class="form-select">
                  <option value="SYSTEM_ALERT">System Alert</option>
                  <option value="MARKETING">Marketing Promotion</option>
                  <option value="ORDER_UPDATE">Order Notification</option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label" for="message">Message Content *</label>
                <textarea
                  id="message"
                  rows="4"
                  formControlName="message"
                  placeholder="Write message details..."
                  class="form-control"
                ></textarea>
              </div>

              <button type="submit" class="btn btn-primary" [disabled]="sendForm.invalid || isSending">
                {{ isSending ? 'Sending...' : 'Dispatch Alert' }}
              </button>
            </form>
          </div>
        </div>

        <!-- System Notification Logs Table -->
        <div class="card list-card">
          <div class="card-header">
            <h3>Event Alert Logs</h3>
          </div>
          <div class="table-responsive">
            <table class="table" *ngIf="notifications().length > 0; else noLogs">
              <thead>
                <tr>
                  <th>Recipient</th>
                  <th>Subject</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let n of notifications()">
                  <td>{{ n.recipientEmail }}</td>
                  <td><strong>{{ n.subject }}</strong></td>
                  <td><code>{{ n.type }}</code></td>
                  <td>
                    <app-status-badge [status]="n.status"></app-status-badge>
                  </td>
                  <td>{{ n.createdAt | date:'medium' }}</td>
                </tr>
              </tbody>
            </table>

            <ng-template #noLogs>
              <p style="text-align: center; padding: 3rem; color: var(--text-muted);">No notification logs found.</p>
            </ng-template>
          </div>

          <div style="padding: 1rem; display: flex; justify-content: center;">
            <app-pagination
              [currentPage]="currentPage()"
              [totalPages]="totalPages()"
              (pageChange)="loadNotifications($event)"
            ></app-pagination>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .admin-notifs-page { display: flex; flex-direction: column; gap: 1.5rem; }
    .page-top h2 { font-size: 1.85rem; font-weight: 800; }
    .notifs-layout { display: grid; grid-template-columns: 360px 1fr; gap: 2rem; align-items: flex-start; }
    .form-card, .list-card { background: #ffffff; }

    @media (max-width: 900px) {
      .notifs-layout { grid-template-columns: 1fr; }
    }
  `]
})
export class AdminNotificationsComponent implements OnInit {
  notifications = signal<NotificationDto[]>([]);
  sendForm!: FormGroup;
  isSending: boolean = false;
  currentPage = signal<number>(0);
  totalPages = signal<number>(1);

  constructor(
    private notificationService: NotificationService,
    private toast: ToastService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.sendForm = this.fb.group({
      recipientEmail: ['', [Validators.required, Validators.email]],
      subject: ['', [Validators.required]],
      message: ['', [Validators.required]],
      type: ['SYSTEM_ALERT']
    });

    this.loadNotifications(0);
  }

  loadNotifications(page: number): void {
    this.notificationService.getAllNotifications(undefined, page, 10).subscribe({
      next: (res) => {
        this.notifications.set(res.content);
        this.currentPage.set(res.number);
        this.totalPages.set(res.totalPages);
      },
      error: () => {}
    });
  }

  onSend(): void {
    if (this.sendForm.invalid) return;

    this.isSending = true;
    this.notificationService.sendNotification(this.sendForm.value).subscribe({
      next: (created) => {
        this.isSending = false;
        this.toast.success('Notification dispatched successfully!');
        this.notifications.update(l => [created, ...l]);
        this.sendForm.reset({ type: 'SYSTEM_ALERT' });
      },
      error: () => {
        this.isSending = false;
      }
    });
  }
}
