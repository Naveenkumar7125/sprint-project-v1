import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WalletService } from '../../../core/services/wallet.service';
import { ToastService } from '../../../core/services/toast.service';
import { WalletTransactionDto } from '../../../core/models/wallet.models';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';

@Component({
  selector: 'app-wallet',
  standalone: true,
  imports: [CommonModule, FormsModule, StatusBadgeComponent, PaginationComponent],
  template: `
    <div class="wallet-page container">
      <div class="wallet-header">
        <h1>Digital Wallet & Finance</h1>
        <p>Manage your account funds, top-up balance, and inspect atomic transactions</p>
      </div>

      <div class="wallet-layout">
        <!-- Balance & Top-up Card -->
        <div class="card wallet-card">
          <div class="balance-badge"><i class="bi bi-wallet2 me-1"></i> EShopping Zone Pay</div>
          <span class="balance-label">Current Available Balance</span>
          <div class="balance-amount-row">
            <span class="currency-symbol">₹</span>
            <span class="balance-value">{{ walletService.wallet().balance | number:'1.2-2' }}</span>
          </div>

          <!-- Top-Up Form -->
          <div class="topup-form-box">
            <h4>Quick Top-Up</h4>
            <div class="preset-chips">
              <button type="button" class="preset-btn" (click)="setAmount(500)">+ ₹500</button>
              <button type="button" class="preset-btn" (click)="setAmount(1000)">+ ₹1,000</button>
              <button type="button" class="preset-btn" (click)="setAmount(2500)">+ ₹2,500</button>
              <button type="button" class="preset-btn" (click)="setAmount(5000)">+ ₹5,000</button>
            </div>

            <div class="topup-input-row">
              <input
                type="number"
                [(ngModel)]="topUpAmount"
                min="1"
                placeholder="Enter custom amount..."
                class="form-control"
              />
              <button
                type="button"
                class="btn btn-accent"
                (click)="onTopUp()"
                [disabled]="isToppingUp || topUpAmount <= 0"
              >
                {{ isToppingUp ? 'Adding...' : 'Add Money' }}
              </button>
            </div>
          </div>
        </div>

        <!-- Transactions History Table -->
        <div class="card transactions-card">
          <div class="card-header-row">
            <div>
              <h3>Transaction History</h3>
              <p class="section-subtext" *ngIf="totalElements() > 0">
                Showing {{ transactions().length }} of {{ totalElements() }} transactions
              </p>
            </div>
            <span class="badge badge-accent" *ngIf="totalPages() > 1">
              Page {{ currentPage() + 1 }} of {{ totalPages() }}
            </span>
          </div>

          <div class="table-responsive">
            <table class="table" *ngIf="transactions().length > 0; else noTx">
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Balance After</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let tx of transactions()">
                  <td>
                    <code class="tx-ref">{{ tx.transactionReference }}</code>
                  </td>
                  <td>
                    <span class="tx-type-tag" [ngClass]="'type-' + tx.transactionType.toLowerCase()">
                      {{ tx.transactionType }}
                    </span>
                  </td>
                  <td>
                    <strong [class.credit-text]="isCredit(tx.transactionType)" [class.debit-text]="!isCredit(tx.transactionType)">
                      {{ isCredit(tx.transactionType) ? '+' : '-' }}₹{{ tx.amount | number:'1.2-2' }}
                    </strong>
                  </td>
                  <td>₹{{ tx.balanceAfter | number:'1.2-2' }}</td>
                  <td>
                    <app-status-badge [status]="tx.status"></app-status-badge>
                  </td>
                  <td>{{ tx.createdAt | date:'medium' }}</td>
                </tr>
              </tbody>
            </table>

            <ng-template #noTx>
              <div class="no-tx-box">
                <p>No transaction activity recorded yet.</p>
              </div>
            </ng-template>
          </div>

          <div class="pagination-wrap" *ngIf="totalPages() > 1">
            <app-pagination
              [currentPage]="currentPage()"
              [totalPages]="totalPages()"
              (pageChange)="loadTransactions($event)"
            ></app-pagination>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .wallet-page {
      padding: 2.5rem 1.25rem 5rem;
    }
    .wallet-header { margin-bottom: 2rem; }
    .wallet-header h1 { font-size: 2.2rem; font-weight: 800; }
    .wallet-header p { color: var(--text-secondary); }

    .wallet-layout {
      display: grid;
      grid-template-columns: 380px 1fr;
      gap: 2rem;
      align-items: flex-start;
    }

    .wallet-card {
      padding: 2rem;
      background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%);
      color: #ffffff;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: var(--radius-xl);
      box-shadow: var(--shadow-lg);
    }
    .balance-badge {
      font-size: 0.8125rem;
      font-weight: 700;
      color: var(--accent-400);
      text-transform: uppercase;
      margin-bottom: 1rem;
    }
    .balance-label { font-size: 0.875rem; color: #c7d2fe; display: block; }
    .balance-amount-row {
      display: flex;
      align-items: baseline;
      gap: 4px;
      margin-bottom: 2rem;
    }
    .currency-symbol { font-size: 1.8rem; font-weight: 700; color: var(--accent-400); }
    .balance-value { font-size: 2.8rem; font-weight: 800; letter-spacing: -0.02em; }

    .topup-form-box {
      background: rgba(255, 255, 255, 0.08);
      padding: 1.25rem;
      border-radius: var(--radius-lg);
      backdrop-filter: blur(8px);
      border: 1px solid rgba(255, 255, 255, 0.15);
    }
    .topup-form-box h4 { font-size: 0.95rem; margin-bottom: 0.75rem; color: #ffffff; }
    .preset-chips { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; margin-bottom: 0.75rem; }
    .preset-btn {
      background: rgba(255, 255, 255, 0.15);
      color: #ffffff;
      border: none;
      padding: 0.4rem;
      border-radius: var(--radius-sm);
      font-weight: 700;
      font-size: 0.8125rem;
      cursor: pointer;
    }
    .preset-btn:hover { background: var(--accent-500); }

    .topup-input-row { display: flex; gap: 0.5rem; }
    .topup-input-row input { color: #000; }

    .card-header-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid var(--border-subtle);
    }
    .card-header-row h3 { margin: 0; font-size: 1.15rem; font-weight: 700; }
    .section-subtext { margin: 0.2rem 0 0; font-size: 0.8rem; color: var(--text-muted); }
    .transactions-card { background: #ffffff; }
    .tx-ref { font-size: 0.8rem; font-family: var(--font-mono); color: var(--text-secondary); }
    .tx-type-tag {
      font-size: 0.75rem;
      font-weight: 700;
      padding: 0.2rem 0.5rem;
      border-radius: var(--radius-sm);
      background: var(--bg-subtle);
    }
    .type-top_up, .type-refund, .type-credit { background: var(--success-bg); color: var(--success-text); }
    .type-debit, .type-order_payment { background: var(--danger-bg); color: var(--danger-text); }
    .credit-text { color: var(--success-solid); }
    .debit-text { color: var(--danger-solid); }

    .no-tx-box { padding: 3rem; text-align: center; color: var(--text-muted); }
    .pagination-wrap { padding: 1rem; display: flex; justify-content: center; }

    @media (max-width: 900px) {
      .wallet-layout { grid-template-columns: 1fr; }
    }
  `]
})
export class WalletComponent implements OnInit {
  topUpAmount: number = 1000;
  isToppingUp: boolean = false;
  pageSize: number = 6;
  transactions = signal<WalletTransactionDto[]>([]);
  totalElements = signal<number>(0);
  currentPage = signal<number>(0);
  totalPages = signal<number>(1);

  constructor(
    public walletService: WalletService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.walletService.getWallet().subscribe();
    this.loadTransactions(0);
  }

  loadTransactions(page: number): void {
    this.walletService.getTransactions(page, this.pageSize).subscribe({
      next: (res) => {
        this.transactions.set(res.content);
        this.currentPage.set(res.number);
        this.totalPages.set(res.totalPages);
        this.totalElements.set(res.totalElements);
      },
      error: () => {}
    });
  }

  setAmount(val: number): void {
    this.topUpAmount = val;
  }

  onTopUp(): void {
    if (this.topUpAmount <= 0) return;

    this.isToppingUp = true;
    this.walletService.topUp(this.topUpAmount).subscribe({
      next: () => {
        this.isToppingUp = false;
        this.loadTransactions(0);
      },
      error: () => {
        this.isToppingUp = false;
      }
    });
  }

  isCredit(type: string): boolean {
    return type === 'CREDIT' || type === 'TOP_UP' || type === 'REFUND';
  }
}
