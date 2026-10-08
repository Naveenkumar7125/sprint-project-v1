import { Injectable, signal, computed, Injector } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  WalletDto,
  WalletTransactionDto,
  WalletTopUpRequest,
  MerchantWalletDto,
  SettlementDto,
  PlatformCommissionSummaryDto,
  TransactionType,
  TransactionStatus,
  WalletStatus
} from '../models/wallet.models';
import { Page } from '../models/api-response.models';
import { ToastService } from './toast.service';
import { AuthService } from '../auth/auth.service';
import { NotificationService } from './notification.service';

@Injectable({
  providedIn: 'root'
})
export class WalletService {
  private readonly baseUrl = `${environment.apiBaseUrl}/api/v1/wallet`;

  private balanceSignal = signal<number>(0);
  public balance = this.balanceSignal.asReadonly();

  public wallet = computed<WalletDto>(() => {
    const status: WalletStatus = 'ACTIVE';
    const bal = this.balanceSignal();
    const safeBal = isNaN(bal) ? 0 : bal;
    const user = this.authService.currentUser();
    return {
      id: user?.id || 1,
      userId: user?.id || 1,
      role: 'ROLE_CUSTOMER',
      balance: safeBal,
      currency: 'INR',
      status: status,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  });

  constructor(
    private http: HttpClient,
    private toast: ToastService,
    private authService: AuthService,
    private injector: Injector
  ) {
    // Clear obsolete legacy shared keys
    localStorage.removeItem('esz_wallet_data');
    localStorage.removeItem('esz_wallet_txns');
    this.refreshLocalState();
  }

  private getUserKey(suffix: string): string {
    const user = this.authService.currentUser();
    const identifier = user?.id ? String(user.id) : (user?.username ? user.username.toLowerCase() : 'anonymous');
    return `esz_wallet_${identifier}_${suffix}`;
  }

  public refreshLocalState(): void {
    const bal = this.getStoredBalance();
    this.balanceSignal.set(bal);
  }

  private getStoredBalance(): number {
    try {
      const key = this.getUserKey('balance');
      const data = localStorage.getItem(key);
      if (data === null) {
        // Only seed john_doe with demo balance, all new users get 0.00
        const user = this.authService.currentUser();
        if (user?.username === 'john_doe') {
          localStorage.setItem(key, '500.00');
          return 500.00;
        }
        return 0;
      }
      const parsed = parseFloat(data);
      return isNaN(parsed) ? 0 : parsed;
    } catch {
      return 0;
    }
  }

  private saveStoredBalance(bal: number): void {
    const safe = isNaN(bal) ? 0 : bal;
    const key = this.getUserKey('balance');
    localStorage.setItem(key, safe.toFixed(2));
    this.balanceSignal.set(safe);
  }

  private getStoredTxns(): WalletTransactionDto[] {
    try {
      const key = this.getUserKey('txns');
      const data = localStorage.getItem(key);
      if (!data) return [];
      const txns: WalletTransactionDto[] = JSON.parse(data);
      return txns.map(t => ({
        ...t,
        amount: isNaN(Number(t.amount)) ? 0 : Number(t.amount),
        balanceAfter: isNaN(Number(t.balanceAfter)) ? 0 : Number(t.balanceAfter)
      }));
    } catch {
      return [];
    }
  }

  private saveStoredTxns(txns: WalletTransactionDto[]): void {
    const key = this.getUserKey('txns');
    localStorage.setItem(key, JSON.stringify(txns));
  }

  getWallet(): Observable<WalletDto> {
    this.refreshLocalState();
    return this.http.get<WalletDto>(`${this.baseUrl}/me`).pipe(
      tap(wallet => {
        if (wallet && !isNaN(Number(wallet.balance))) {
          const bal = Number(wallet.balance);
          this.balanceSignal.set(bal);
          this.saveStoredBalance(bal);
        }
      }),
      catchError(() => {
        return of(this.wallet());
      })
    );
  }

  topUp(request: any): Observable<WalletTransactionDto> {
    let amount: number;
    let ref: string;
    let desc = 'Wallet Top-up';

    if (typeof request === 'number') {
      amount = request;
      ref = 'TOPUP-' + Math.floor(1000 + Math.random() * 9000);
    } else if (typeof request === 'object' && request !== null) {
      amount = Number(request.amount || request.value || 0);
      ref = request.referenceId || ('TOPUP-' + Math.floor(1000 + Math.random() * 9000));
      desc = request.description || desc;
    } else {
      amount = Number(request) || 0;
      ref = 'TOPUP-' + Math.floor(1000 + Math.random() * 9000);
    }

    if (isNaN(amount) || amount <= 0) {
      amount = 500;
    }

    const topUpReq: WalletTopUpRequest = { amount, referenceId: ref };

    return this.http.post<WalletTransactionDto>(`${this.baseUrl}/top-up`, topUpReq).pipe(
      tap(() => {
        const currentBal = this.getStoredBalance();
        const newBal = currentBal + amount;
        this.balanceSignal.set(newBal);
        this.saveStoredBalance(newBal);
        const txn = this.addLocalTxn(amount, 'TOP_UP', desc);
        this.dispatchWalletNotification(amount, 'TOP_UP', newBal, txn.transactionReference);
        this.toast.success(`Successfully added ₹${amount.toLocaleString()} to your wallet!`);
      }),
      catchError(() => {
        const currentBal = this.getStoredBalance();
        const newBal = currentBal + amount;
        this.balanceSignal.set(newBal);
        this.saveStoredBalance(newBal);
        const txn = this.addLocalTxn(amount, 'TOP_UP', desc);
        this.dispatchWalletNotification(amount, 'TOP_UP', newBal, txn.transactionReference);
        this.toast.success(`Successfully added ₹${amount.toLocaleString()} to your wallet!`);
        return of(txn);
      })
    );
  }

  deduct(amount: number, description: string): void {
    const current = this.getStoredBalance();
    const newBal = Math.max(0, current - amount);
    this.saveStoredBalance(newBal);
    const txn = this.addLocalTxn(amount, 'ORDER_PAYMENT', description);
    this.dispatchWalletNotification(amount, 'ORDER_PAYMENT', newBal, txn.transactionReference, description);
  }

  private dispatchWalletNotification(amount: number, type: TransactionType, newBal: number, ref?: string, desc?: string): void {
    try {
      const user = this.authService.currentUser();
      const notifService = this.injector.get(NotificationService);
      const isTopUp = type === 'TOP_UP' || type === 'CREDIT' || type === 'REFUND';
      const referenceId = ref || ('TXN-' + Math.floor(100000 + Math.random() * 900000));
      const dateStr = new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
      const recipientEmail = user?.email || 'customer@example.com';
      const customerName = user?.username || 'Valued Customer';
      
      const subject = isTopUp
        ? `Wallet Credited: ₹${amount.toFixed(2)} Added (${referenceId})`
        : `Wallet Debited: ₹${amount.toFixed(2)} Paid (${referenceId})`;

      const badgeBg = isTopUp ? '#dcfce7' : '#fee2e2';
      const badgeColor = isTopUp ? '#15803d' : '#b91c1c';
      const badgeText = isTopUp ? 'WALLET CREDITED' : 'WALLET DEBITED';
      const amountPrefix = isTopUp ? '+₹' : '-₹';
      const amountColor = isTopUp ? '#16a34a' : '#dc2626';
      const purposeText = desc || (isTopUp ? 'Wallet Funds Top-Up' : 'Order Checkout Payment');

      const message = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 620px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; color: #1e293b; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
          <!-- Header -->
          <div style="background: #0f172a; color: #ffffff; padding: 22px 24px; display: flex; justify-content: space-between; align-items: center;">
            <div>
              <div style="font-size: 20px; font-weight: 900; letter-spacing: -0.5px;">EShopping<span style="color: #818cf8;">Zone</span></div>
              <div style="font-size: 11px; color: #94a3b8; margin-top: 2px;">Official Financial & Transaction Advice</div>
            </div>
            <div style="text-align: right;">
              <span style="background: ${badgeBg}; color: ${badgeColor}; font-size: 11px; font-weight: 800; padding: 4px 10px; border-radius: 4px; display: inline-block;">${badgeText}</span>
              <div style="font-size: 11px; color: #cbd5e1; margin-top: 4px; font-family: monospace;">${referenceId}</div>
            </div>
          </div>

          <!-- Body -->
          <div style="padding: 24px;">
            <p style="font-size: 15px; margin: 0 0 16px; color: #0f172a;">Dear <strong>${customerName}</strong>,</p>
            <p style="font-size: 13px; line-height: 1.5; color: #475569; margin: 0 0 20px;">
              ${isTopUp ? 'Your EShopping Zone digital wallet balance has been successfully credited with funds.' : 'An authorized deduction was processed from your EShopping Zone digital wallet.'}
            </p>

            <!-- Amount Highlight Box -->
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px 20px; text-align: center; margin-bottom: 20px;">
              <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px;">Transaction Amount</div>
              <div style="font-size: 28px; font-weight: 900; color: ${amountColor}; margin: 4px 0;">${amountPrefix}${amount.toFixed(2)}</div>
              <div style="font-size: 12px; color: #166534; font-weight: 700;">✓ Transaction Settled & Confirmed</div>
            </div>

            <!-- Transaction Details Table -->
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
              <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #64748b; margin-bottom: 10px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;">
                Transaction Breakdown
              </div>
              <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
                <tr style="border-bottom: 1px solid #e2e8f0;">
                  <td style="padding: 8px 0; color: #64748b;">Transaction Reference:</td>
                  <td style="padding: 8px 0; text-align: right; font-weight: 700; font-family: monospace; color: #0f172a;">${referenceId}</td>
                </tr>
                <tr style="border-bottom: 1px solid #e2e8f0;">
                  <td style="padding: 8px 0; color: #64748b;">Purpose / Description:</td>
                  <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #0f172a;">${purposeText}</td>
                </tr>
                <tr style="border-bottom: 1px solid #e2e8f0;">
                  <td style="padding: 8px 0; color: #64748b;">Payment Method:</td>
                  <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #0f172a;">EShopping Digital Wallet</td>
                </tr>
                <tr style="border-bottom: 1px solid #e2e8f0;">
                  <td style="padding: 8px 0; color: #64748b;">Date & Time:</td>
                  <td style="padding: 8px 0; text-align: right; color: #334155;">${dateStr}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #64748b; font-weight: 700;">Available Wallet Balance After:</td>
                  <td style="padding: 8px 0; text-align: right; font-size: 14px; font-weight: 900; color: #0f172a;">₹${newBal.toFixed(2)}</td>
                </tr>
              </table>
            </div>

            <!-- Action Button -->
            <div style="text-align: center; margin: 24px 0 16px;">
              <a href="http://localhost:4200/account/wallet" style="background: #0f172a; color: #ffffff; text-decoration: none; padding: 10px 22px; border-radius: 6px; font-size: 12px; font-weight: 700; display: inline-block;">
                View Wallet Passbook →
              </a>
            </div>

            <!-- Footer -->
            <div style="border-top: 1px solid #e2e8f0; padding-top: 14px; text-align: center; font-size: 11px; color: #64748b;">
              <p style="margin: 2px 0;">This is an automated transaction advice generated by EShopping Zone Financial Services.</p>
              <p style="margin: 2px 0; font-size: 10px; color: #94a3b8;">If you did not authorize this transaction, please contact security@eshoppingzone.com immediately.</p>
            </div>
          </div>
        </div>
      `;

      notifService.dispatchNotification({
        recipientEmail: recipientEmail,
        userId: user?.id,
        subject: subject,
        message: message,
        type: isTopUp ? 'WALLET_CREDIT' : 'WALLET_DEBIT',
        channel: 'EMAIL'
      }, false);
    } catch {}
  }

  private addLocalTxn(amount: number, type: TransactionType, desc: string): WalletTransactionDto {
    const txns = this.getStoredTxns();
    const status: TransactionStatus = 'SUCCESS';
    const currentBal = this.getStoredBalance();
    const user = this.authService.currentUser();

    const newTxn: WalletTransactionDto = {
      id: Date.now(),
      transactionReference: 'TXN-' + Math.floor(100000 + Math.random() * 900000),
      walletId: user?.id || 1,
      userId: user?.id || 1,
      transactionType: type,
      amount: Number(amount),
      balanceAfter: currentBal,
      status: status,
      description: desc,
      createdAt: new Date().toISOString()
    };
    txns.unshift(newTxn);
    this.saveStoredTxns(txns);
    return newTxn;
  }

  getTransactions(page: number = 0, size: number = 10): Observable<Page<WalletTransactionDto>> {
    this.refreshLocalState();
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<Page<WalletTransactionDto>>(`${this.baseUrl}/transactions`, { params }).pipe(
      map(res => {
        if (!res || !res.content || res.content.length === 0) {
          return this.paginateTxns(this.getStoredTxns(), page, size);
        }
        return res;
      }),
      catchError(() => of(this.paginateTxns(this.getStoredTxns(), page, size)))
    );
  }

  getMerchantWallet(merchantId?: number): Observable<MerchantWalletDto> {
    let params = new HttpParams();
    if (merchantId) params = params.set('merchantId', merchantId.toString());

    return this.http.get<MerchantWalletDto>(`${environment.apiBaseUrl}/api/v1/merchant/wallet`, { params }).pipe(
      catchError(() => {
        const user = this.authService.currentUser();
        const stored = this.getStoredBalance();
        return of({
          id: user?.id || 1,
          merchantId: user?.id || 1,
          pendingBalance: 0,
          availableBalance: stored,
          totalBalance: stored,
          totalEarnings: stored,
          currency: 'INR',
          status: 'ACTIVE' as WalletStatus,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      })
    );
  }

  getMerchantSettlements(status?: string, page: number = 0, size: number = 10): Observable<Page<SettlementDto>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    if (status) params = params.set('status', status);

    return this.http.get<Page<SettlementDto>>(`${environment.apiBaseUrl}/api/v1/merchant/settlements`, { params }).pipe(
      catchError(() => of({
        content: [],
        pageable: { pageNumber: page, pageSize: size, sort: { empty: true, sorted: false, unsorted: true }, offset: 0, paged: true, unpaged: false },
        totalPages: 0,
        totalElements: 0,
        last: true,
        size,
        number: page,
        sort: { empty: true, sorted: false, unsorted: true },
        numberOfElements: 0,
        first: true,
        empty: true
      }))
    );
  }

  getAdminCommissions(): Observable<PlatformCommissionSummaryDto> {
    return this.http.get<PlatformCommissionSummaryDto>(`${environment.apiBaseUrl}/api/v1/admin/commissions`).pipe(
      catchError(() => of({
        configuredCommissionPercentage: 10,
        totalGrossMerchandiseValue: 0,
        totalPlatformCommission: 0,
        pendingPlatformCommission: 0,
        settledPlatformCommission: 0,
        totalSettlementsCount: 0,
        pendingSettlementsCount: 0,
        completedSettlementsCount: 0,
        cancelledSettlementsCount: 0
      }))
    );
  }

  private paginateTxns(list: WalletTransactionDto[], page: number, size: number): Page<WalletTransactionDto> {
    const start = page * size;
    const content = list.slice(start, start + size);
    const totalElements = list.length;
    const totalPages = Math.ceil(totalElements / size);

    return {
      content,
      pageable: {
        pageNumber: page,
        pageSize: size,
        sort: { empty: true, sorted: false, unsorted: true },
        offset: start,
        paged: true,
        unpaged: false
      },
      totalPages,
      totalElements,
      last: page >= totalPages - 1,
      size,
      number: page,
      sort: { empty: true, sorted: false, unsorted: true },
      numberOfElements: content.length,
      first: page === 0,
      empty: content.length === 0
    };
  }
}
