import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../../core/services/notification.service';
import { AuthService } from '../../../core/auth/auth.service';
import { NotificationDto } from '../../../core/models/notification.models';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, PaginationComponent, EmptyStateComponent],
  template: `
    <div class="notif-page container">
      <div class="notif-header">
        <div>
          <h1>Notifications & Email Inbox</h1>
          <p>Real-time notifications, event dispatch alerts, and copies of emails sent to your registered address</p>
        </div>
        <div class="notif-actions" *ngIf="notifications().length > 0">
          <button class="btn btn-secondary btn-sm" (click)="markAllAsRead()">
            <i class="bi bi-check2-all me-1"></i> Mark All as Read
          </button>
        </div>
      </div>

      <!-- Filter Pills -->
      <div class="filter-pills" *ngIf="notifications().length > 0">
        <button
          type="button"
          class="filter-pill"
          [class.active]="activeFilter() === 'ALL'"
          (click)="setFilter('ALL')"
        >
          All ({{ notifications().length }})
        </button>
        <button
          type="button"
          class="filter-pill"
          [class.active]="activeFilter() === 'EMAIL'"
          (click)="setFilter('EMAIL')"
        >
          <i class="bi bi-envelope me-1"></i> Emails
        </button>
        <button
          type="button"
          class="filter-pill"
          [class.active]="activeFilter() === 'ORDER'"
          (click)="setFilter('ORDER')"
        >
          <i class="bi bi-box-seam me-1"></i> Orders
        </button>
        <button
          type="button"
          class="filter-pill"
          [class.active]="activeFilter() === 'WALLET'"
          (click)="setFilter('WALLET')"
        >
          <i class="bi bi-wallet2 me-1"></i> Wallet & Finance
        </button>
      </div>

      <div class="notif-list" *ngIf="filteredNotifications().length > 0; else noNotifs">
        <div
          class="notif-card card"
          *ngFor="let n of filteredNotifications()"
          [class.unread]="!n.read"
          (click)="openEmailPreview(n)"
        >
          <div class="notif-icon-col" [ngClass]="getIconCategory(n.type)">
            <i class="bi" [ngClass]="getIcon(n.type)"></i>
          </div>

          <div class="notif-content">
            <div class="notif-top">
              <div class="subject-row">
                <span class="unread-dot" *ngIf="!n.read"></span>
                <h4 class="notif-title">{{ cleanText(n.subject) }}</h4>
                <span class="badge badge-primary email-badge" *ngIf="n.channel === 'EMAIL' || !n.channel">
                  <i class="bi bi-envelope-check me-1"></i> Email Delivered
                </span>
              </div>
              <span class="notif-date">{{ n.createdAt | date:'medium' }}</span>
            </div>

            <p class="notif-preview-text">{{ cleanSnippet(n.message) }}</p>

            <div class="notif-footer">
              <span class="recipient-tag">Delivered to: <strong>{{ getCleanEmail(n.recipientEmail) }}</strong></span>
              <button type="button" class="view-email-btn" (click)="openEmailPreview(n); $event.stopPropagation()">
                <i class="bi bi-envelope-open me-1"></i> View Full Email →
              </button>
            </div>
          </div>
        </div>

        <app-pagination
          [currentPage]="currentPage()"
          [totalPages]="totalPages()"
          (pageChange)="loadNotifications($event)"
        ></app-pagination>
      </div>

      <ng-template #noNotifs>
        <app-empty-state
          icon="bi-bell-slash"
          title="No Notifications Yet"
          message="Your inbox is clear. Whenever you register, place orders, or top up your wallet, notifications and email copies will appear right here."
        ></app-empty-state>
      </ng-template>

      <!-- Interactive Email Preview Modal -->
      <div class="modal-backdrop animate-fade-in" *ngIf="previewEmail()" (click)="closeEmailPreview()">
        <div class="email-modal card animate-scale-up" (click)="$event.stopPropagation()">
          <div class="email-modal-header">
            <div class="email-client-badge">
              <span><i class="bi bi-envelope me-1"></i> EShopping Zone Mail Client</span>
            </div>
            <button class="modal-close" (click)="closeEmailPreview()"><i class="bi bi-x-lg"></i></button>
          </div>

          <div class="email-meta-box">
            <div class="meta-line">
              <span class="meta-label">From:</span>
              <span class="meta-val"><strong>EShopping Zone &lt;notifications&#64;eshoppingzone.com&gt;</strong></span>
            </div>
            <div class="meta-line">
              <span class="meta-label">To:</span>
              <span class="meta-val"><code>{{ getCleanEmail(previewEmail()?.recipientEmail) }}</code></span>
            </div>
            <div class="meta-line">
              <span class="meta-label">Date:</span>
              <span class="meta-val">{{ previewEmail()?.createdAt | date:'full' }}</span>
            </div>
            <div class="meta-line">
              <span class="meta-label">Subject:</span>
              <span class="meta-val subject-highlight">{{ cleanText(previewEmail()?.subject) }}</span>
            </div>
          </div>

          <div class="email-body-content">
            <div class="email-brand-banner" *ngIf="!isHtml(previewEmail()?.message)">
              <h2>EShopping Zone</h2>
              <small>Verified Microservices Notification Gateway</small>
            </div>

            <div class="email-message-card" [class.html-mode]="isHtml(previewEmail()?.message)">
              <div *ngIf="isHtml(previewEmail()?.message)" [innerHTML]="previewEmail()?.message" class="html-email-container"></div>
              <p *ngIf="!isHtml(previewEmail()?.message)" class="email-text">{{ cleanText(previewEmail()?.message) }}</p>

              <div class="email-action-row" *ngIf="!isHtml(previewEmail()?.message) && previewEmail()?.type === 'ORDER_CONFIRMED'">
                <a href="/track-delivery" class="btn btn-primary btn-sm">Track Your Shipment</a>
                <a href="/account/orders" class="btn btn-secondary btn-sm">View Order Details</a>
              </div>

              <div class="email-action-row" *ngIf="previewEmail()?.type === 'WALLET_TOPUP' || previewEmail()?.type === 'WALLET_CREDIT'">
                <a href="/account/wallet" class="btn btn-primary btn-sm">View Digital Wallet</a>
              </div>

              <div class="email-action-row" *ngIf="previewEmail()?.type === 'USER_REGISTERED'">
                <a href="/products" class="btn btn-primary btn-sm">Start Shopping Now</a>
              </div>
            </div>

            <div class="email-footer-note">
              <p>This automated message was dispatched by the EShopping Zone Distributed Notification Microservice.</p>
              <small>© 2026 EShopping Zone Inc. All rights reserved.</small>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .notif-page { padding: 2.5rem 1.25rem 5rem; max-width: 920px; }
    .notif-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1.5rem;
      gap: 1rem;
    }
    .notif-header h1 { font-size: 2.2rem; font-weight: 800; margin-bottom: 0.35rem; }
    .notif-header p { color: var(--text-secondary); margin: 0; }

    .filter-pills {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 1.5rem;
      overflow-x: auto;
      padding-bottom: 0.5rem;
    }
    .filter-pill {
      background: #f1f5f9;
      border: 1px solid var(--border-subtle);
      padding: 0.4rem 0.9rem;
      border-radius: var(--radius-full);
      font-size: 0.8125rem;
      font-weight: 700;
      color: var(--text-secondary);
      cursor: pointer;
      transition: all var(--transition-fast);
      white-space: nowrap;
    }
    .filter-pill:hover { background: #e2e8f0; color: var(--text-primary); }
    .filter-pill.active {
      background: var(--primary-600);
      color: #ffffff;
      border-color: var(--primary-600);
    }

    .notif-list { display: flex; flex-direction: column; gap: 0.875rem; }
    .notif-card {
      padding: 1.1rem 1.35rem;
      display: flex;
      gap: 1.1rem;
      align-items: flex-start;
      background: #ffffff;
      border-radius: var(--radius-lg);
      border: 1px solid var(--border-subtle);
      cursor: pointer;
      transition: all var(--transition-fast);
      position: relative;
    }
    .notif-card:hover {
      border-color: var(--primary-300);
      box-shadow: var(--shadow-sm);
      transform: translateY(-1px);
    }
    .notif-card.unread {
      background: #f8fafc;
      border-left: 4px solid var(--primary-600);
    }

    .notif-icon-col {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      background: #f1f5f9;
      color: #475569;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      font-size: 1.2rem;
      border: 1px solid var(--border-subtle);
    }
    .notif-icon-col.cat-wallet { background: #f0fdf4; color: #16a34a; border-color: #bbf7d0; }
    .notif-icon-col.cat-order { background: #eff6ff; color: #2563eb; border-color: #bfdbfe; }
    .notif-icon-col.cat-user { background: #faf5ff; color: #7c3aed; border-color: #ddd6fe; }
    .notif-icon-col.cat-general { background: #f8fafc; color: #64748b; border-color: #e2e8f0; }

    .notif-content { flex: 1; min-width: 0; }
    .notif-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.35rem;
      gap: 1rem;
    }
    .subject-row {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex-wrap: wrap;
    }
    .unread-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--primary-600);
      display: inline-block;
      flex-shrink: 0;
    }
    .subject-row h4, .notif-title {
      font-size: 0.95rem;
      font-weight: 700;
      color: var(--text-primary);
      margin: 0;
      line-height: 1.3;
    }
    .email-badge {
      font-size: 0.7rem;
      padding: 0.15rem 0.5rem;
      font-weight: 700;
      display: inline-flex;
      align-items: center;
      letter-spacing: 0.03em;
    }
    .notif-date { font-size: 0.78rem; color: var(--text-muted); white-space: nowrap; }

    .notif-preview-text {
      font-size: 0.84rem;
      color: var(--text-secondary);
      line-height: 1.5;
      margin: 0.35rem 0 0.6rem;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      text-overflow: ellipsis;
      word-break: break-word;
    }

    .notif-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.78rem;
      color: var(--text-muted);
      border-top: 1px dashed var(--border-subtle);
      padding-top: 0.5rem;
      margin-top: 0.35rem;
    }
    .view-email-btn {
      background: none;
      border: none;
      color: var(--primary-600);
      font-weight: 700;
      font-size: 0.8rem;
      cursor: pointer;
      padding: 0.2rem 0.5rem;
      border-radius: var(--radius-sm);
    }
    .view-email-btn:hover {
      background: var(--primary-50);
      text-decoration: underline;
    }

    /* Modal Styling */
    .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(15, 23, 42, 0.65);
      backdrop-filter: blur(6px);
      z-index: 2000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
    }
    .email-modal {
      max-width: 680px;
      width: 100%;
      max-height: 90vh;
      overflow-y: auto;
      background: #ffffff;
      border-radius: var(--radius-xl);
      box-shadow: var(--shadow-xl);
      padding: 0;
      display: flex;
      flex-direction: column;
    }
    .email-modal-header {
      background: #0f172a;
      color: #ffffff;
      padding: 1rem 1.5rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top-left-radius: var(--radius-xl);
      border-top-right-radius: var(--radius-xl);
    }
    .email-client-badge { font-size: 0.85rem; font-weight: 700; letter-spacing: 0.05em; }
    .modal-close {
      background: rgba(255, 255, 255, 0.15);
      color: #ffffff;
      border: none;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      cursor: pointer;
      font-weight: 700;
    }
    .modal-close:hover { background: rgba(255, 255, 255, 0.3); }

    .email-meta-box {
      background: #f8fafc;
      padding: 1rem 1.5rem;
      border-bottom: 1px solid var(--border-subtle);
      font-size: 0.85rem;
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }
    .meta-line { display: flex; gap: 0.5rem; align-items: baseline; }
    .meta-label { width: 65px; color: var(--text-muted); font-weight: 700; flex-shrink: 0; }
    .meta-val { color: var(--text-primary); }
    .subject-highlight { font-weight: 800; color: var(--primary-700); }

    .email-body-content {
      padding: 2rem 1.5rem;
      background: #ffffff;
    }
    .email-brand-banner {
      text-align: center;
      padding-bottom: 1.5rem;
      border-bottom: 2px solid var(--primary-100);
      margin-bottom: 1.5rem;
    }
    .email-brand-banner h2 {
      font-size: 1.5rem;
      font-weight: 800;
      color: var(--primary-700);
      margin-bottom: 0.2rem;
    }
    .email-brand-banner small { color: var(--text-muted); }

    .email-message-card {
      background: #fdfdfd;
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      padding: 1.5rem;
      margin-bottom: 1.5rem;
    }
    .email-text {
      font-size: 0.95rem;
      line-height: 1.6;
      color: var(--text-primary);
      margin-bottom: 1.5rem;
    }
    .email-action-row {
      display: flex;
      gap: 0.75rem;
      flex-wrap: wrap;
    }

    .email-footer-note {
      text-align: center;
      font-size: 0.75rem;
      color: var(--text-muted);
      border-top: 1px solid var(--border-subtle);
      padding-top: 1.25rem;
    }
  `]
})
export class NotificationsComponent implements OnInit {
  notifications = signal<NotificationDto[]>([]);
  activeFilter = signal<'ALL' | 'EMAIL' | 'ORDER' | 'WALLET'>('ALL');
  previewEmail = signal<NotificationDto | null>(null);

  currentPage = signal<number>(0);
  totalPages = signal<number>(1);

  filteredNotifications = computed(() => {
    const list = this.notifications();
    const f = this.activeFilter();
    if (f === 'ALL') return list;
    if (f === 'EMAIL') return list.filter(n => n.channel === 'EMAIL' || !n.channel);
    if (f === 'ORDER') return list.filter(n => n.type.includes('ORDER'));
    if (f === 'WALLET') return list.filter(n => n.type.includes('WALLET') || n.type.includes('REFUND'));
    return list;
  });

  constructor(
    public notificationService: NotificationService,
    private authService: AuthService
  ) {}

  getCleanEmail(email?: string): string {
    if (!email) return 'your registered email';
    if (email.endsWith('@github.com') || email.endsWith('@example.com')) {
      const user = this.authService?.currentUser();
      if (user?.email && !user.email.endsWith('@example.com') && !user.email.endsWith('@github.com')) {
        return user.email;
      }
      return user?.username ? `${user.username}@eshoppingzone.com` : 'your registered email';
    }
    return email;
  }

  ngOnInit(): void {
    this.loadNotifications(0);
  }

  loadNotifications(page: number): void {
    this.notificationService.getMyNotifications(page, 10).subscribe({
      next: (res) => {
        this.notifications.set(res.content);
        this.currentPage.set(res.number);
        this.totalPages.set(res.totalPages);
      },
      error: () => {}
    });
  }

  setFilter(filter: 'ALL' | 'EMAIL' | 'ORDER' | 'WALLET'): void {
    this.activeFilter.set(filter);
  }

  getIcon(type: string): string {
    if (type?.includes('ORDER')) return 'bi-box-seam';
    if (type?.includes('WALLET') || type?.includes('CREDIT') || type?.includes('TOPUP') || type?.includes('DEBIT')) return 'bi-wallet2';
    if (type?.includes('USER') || type?.includes('WELCOME')) return 'bi-person-check';
    return 'bi-bell';
  }

  getIconCategory(type: string): string {
    if (type?.includes('ORDER')) return 'cat-order';
    if (type?.includes('WALLET') || type?.includes('CREDIT') || type?.includes('TOPUP') || type?.includes('DEBIT')) return 'cat-wallet';
    if (type?.includes('USER') || type?.includes('WELCOME')) return 'cat-user';
    return 'cat-general';
  }

  isHtml(text?: string): boolean {
    if (!text) return false;
    return text.includes('<div') || text.includes('<table') || text.includes('<html');
  }

  cleanSnippet(text?: string): string {
    if (!text) return '';
    if (this.isHtml(text)) {
      return 'Official Computer-Generated Tax Invoice Receipt & Order Breakdown';
    }
    return this.cleanText(text);
  }

  cleanText(text?: string): string {
    if (!text) return '';
    return text.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1FA00}-\u{1FAFF}\u{FE00}-\u{FE0F}\u{1F1E6}-\u{1F1FF}]/gu, '').trim();
  }

  openEmailPreview(n: NotificationDto): void {
    this.previewEmail.set(n);
    this.notificationService.markAsRead(n.id);
  }

  closeEmailPreview(): void {
    this.previewEmail.set(null);
  }

  markAllAsRead(): void {
    this.notificationService.markAllAsRead();
    this.loadNotifications(this.currentPage());
  }
}
