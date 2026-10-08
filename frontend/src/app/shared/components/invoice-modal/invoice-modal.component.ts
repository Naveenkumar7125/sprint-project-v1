import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrderDto } from '../../../core/models/order.models';
import { ToastService } from '../../../core/services/toast.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-invoice-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="invoice-backdrop" *ngIf="order" (click)="onBackdropClick($event)">
      <div class="invoice-dialog animate-fade-in" (click)="$event.stopPropagation()">
        
        <!-- Header Actions Bar (Hidden in Print) -->
        <div class="invoice-toolbar no-print">
          <div class="toolbar-title">
            <span class="toolbar-icon"><i class="bi bi-receipt"></i></span>
            <strong>Tax Invoice & Order Receipt</strong>
            <span class="order-tag">#{{ order.orderNumber }}</span>
          </div>
          <div class="toolbar-actions">
            <button class="btn btn-primary btn-sm" (click)="printInvoice()" title="Download PDF or Print">
              <i class="bi bi-printer me-1"></i> Download PDF / Print
            </button>
            <button class="btn btn-secondary btn-sm" (click)="resendEmail()" title="Email Invoice Copy">
              <i class="bi bi-envelope me-1"></i> Email Invoice
            </button>
            <button class="btn-close" (click)="close()" title="Close">&times;</button>
          </div>
        </div>

        <!-- Printable Invoice Container -->
        <div class="invoice-sheet" id="printable-invoice">
          <!-- Invoice Brand & Header -->
          <div class="inv-header">
            <div class="inv-brand">
              <div class="brand-logo">
                <span class="logo-text">EShopping<span class="logo-accent">Zone</span></span>
              </div>
              <p class="brand-sub">Modern Next-Gen E-Commerce & Retail Marketplace</p>
              <div class="brand-details">
                <p>128 Tech Park Boulevard, Silicon City</p>
                <p>Bengaluru, Karnataka - 560100, India</p>
                <p><strong>GSTIN:</strong> 29AAACE1234F1Z5 | <strong>CIN:</strong> U72200KA2024PTC123456</p>
                <p><strong>Support:</strong> support&#64;eshoppingzone.com | +91 (800) 456-7890</p>
              </div>
            </div>

            <div class="inv-meta-right">
              <div class="inv-title-badge">TAX INVOICE</div>
              <div class="inv-meta-grid">
                <div class="meta-item">
                  <span class="meta-label">Invoice Number:</span>
                  <span class="meta-val font-mono">INV-{{ order.orderNumber }}</span>
                </div>
                <div class="meta-item">
                  <span class="meta-label">Invoice Date:</span>
                  <span class="meta-val">{{ order.createdAt | date:'mediumDate' }}</span>
                </div>
                <div class="meta-item">
                  <span class="meta-label">Order Ref:</span>
                  <span class="meta-val font-mono">#{{ order.orderNumber }}</span>
                </div>
                <div class="meta-item">
                  <span class="meta-label">Payment Mode:</span>
                  <span class="meta-val badge-pay">{{ order.paymentMethod || 'WALLET' }}</span>
                </div>
                <div class="meta-item">
                  <span class="meta-label">Order Status:</span>
                  <span class="meta-val badge-status">{{ order.status }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="inv-divider"></div>

          <!-- Billing & Shipping Information -->
          <div class="inv-parties">
            <div class="party-box billed-to">
              <h4>Billed & Shipped To:</h4>
              <p class="party-name">{{ order.customerUsername || 'Valued Customer' }}</p>
              <p class="party-email"><strong>Email:</strong> {{ order.customerEmail || 'customer@example.com' }}</p>
              <p class="party-address"><strong>Delivery Address:</strong></p>
              <p class="address-text">{{ order.shippingAddressSnapshot || '123 Market Street, Apt 4B, City Center, 560001' }}</p>
              <p class="party-phone"><strong>Contact:</strong> +91 98765 43210</p>
            </div>

            <div class="party-box dispatch-info">
              <h4>Order & Saga Summary:</h4>
              <p><strong>Fulfillment Mode:</strong> Express Priority Delivery</p>
              <p><strong>Order Timestamp:</strong> {{ order.createdAt | date:'medium' }}</p>
              <p><strong>Invoice Type:</strong> Retail / Consumer Tax Invoice</p>
              <p><strong>Place of Supply:</strong> Karnataka (State Code: 29)</p>
              <div class="stamp-badge">
                <span class="stamp-icon"><i class="bi bi-check-circle-fill"></i></span>
                <span class="stamp-text">PAYMENT VERIFIED & SETTLED</span>
              </div>
            </div>
          </div>

          <!-- Itemized Line Items Table -->
          <div class="inv-table-wrap">
            <table class="inv-table">
              <thead>
                <tr>
                  <th style="width: 5%;">#</th>
                  <th style="width: 45%;">Item Description</th>
                  <th style="width: 12%; text-align: center;">Qty</th>
                  <th style="width: 18%; text-align: right;">Unit Price</th>
                  <th style="width: 20%; text-align: right;">Total (INR)</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let item of order.items; let idx = index">
                  <td class="text-center font-mono">{{ idx + 1 }}</td>
                  <td>
                    <div class="item-name-cell">
                      <strong>{{ item.productName }}</strong>
                      <span class="item-sku">SKU: ESZ-PRD-{{ item.productId }} | HSN: 8517</span>
                    </div>
                  </td>
                  <td class="text-center">{{ item.quantity }}</td>
                  <td class="text-right">₹{{ item.unitPrice | number:'1.2-2' }}</td>
                  <td class="text-right font-bold">₹{{ item.totalPrice | number:'1.2-2' }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Calculations & Summary -->
          <div class="inv-summary-row">
            <div class="summary-left">
              <div class="words-box">
                <span class="words-title">Amount in Words:</span>
                <p class="words-text">{{ amountInWords(order.totalAmount) }}</p>
              </div>
              <div class="terms-box">
                <h5>Terms & Conditions:</h5>
                <ul>
                  <li>Goods once sold are eligible for return/replacement within 7 days under standard warranty policy.</li>
                  <li>This is a computer-generated tax invoice and requires no physical signature under IT Act 2000.</li>
                  <li>Applicable Goods & Services Tax (GST 18%) is inclusive in item billing.</li>
                </ul>
              </div>
            </div>

            <div class="summary-right">
              <div class="calc-row">
                <span>Items Subtotal:</span>
                <span class="font-bold">₹{{ getItemsSubtotal(order) | number:'1.2-2' }}</span>
              </div>
              <div class="calc-row">
                <span>Taxable Amount (Net):</span>
                <span>₹{{ getTaxableAmount(order) | number:'1.2-2' }}</span>
              </div>
              <div class="calc-row">
                <span>CGST (9.0%):</span>
                <span>₹{{ getCgst(order) | number:'1.2-2' }}</span>
              </div>
              <div class="calc-row">
                <span>SGST (9.0%):</span>
                <span>₹{{ getSgst(order) | number:'1.2-2' }}</span>
              </div>
              <div class="calc-row">
                <span>Doorstep Delivery:</span>
                <span *ngIf="getDeliveryFee(order) > 0" class="font-bold" style="color: #b45309;">
                  ₹{{ getDeliveryFee(order) | number:'1.2-2' }} (Standard &lt; ₹500)
                </span>
                <span *ngIf="getDeliveryFee(order) === 0" class="text-success font-bold">
                  FREE (Orders ≥ ₹500)
                </span>
              </div>
              <div class="inv-calc-divider"></div>
              <div class="calc-row total-calc-row">
                <strong>Grand Total (INR):</strong>
                <strong class="total-amount">₹{{ order.totalAmount | number:'1.2-2' }}</strong>
              </div>
              
              <div class="auth-signature">
                <div class="sig-seal">
                  <div class="seal-inner">
                    <span>ESZ</span>
                    <small>VERIFIED</small>
                  </div>
                </div>
                <div class="sig-info">
                  <span class="sig-line"></span>
                  <strong>Authorized Signatory</strong>
                  <small>EShopping Zone Private Limited</small>
                </div>
              </div>
            </div>
          </div>

          <!-- Invoice Footer -->
          <div class="inv-footer">
            <p>Thank you for choosing EShopping Zone! For questions regarding your order, reach out to <strong>support&#64;eshoppingzone.com</strong></p>
            <p class="footer-small">Reg. Office: EShopping Zone Plaza, Silicon Valley Tech Zone, Bangalore 560100</p>
          </div>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .invoice-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.75);
      backdrop-filter: blur(4px);
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
      overflow-y: auto;
    }

    .invoice-dialog {
      background: #ffffff;
      border-radius: 12px;
      max-width: 860px;
      width: 100%;
      max-height: 92vh;
      overflow-y: auto;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.35);
      display: flex;
      flex-direction: column;
    }

    .invoice-toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.5rem;
      background: #0f172a;
      color: #ffffff;
      border-top-left-radius: 12px;
      border-top-right-radius: 12px;
      position: sticky;
      top: 0;
      z-index: 10;
    }

    .toolbar-title {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 1rem;
    }

    .order-tag {
      background: rgba(255, 255, 255, 0.15);
      padding: 0.2rem 0.6rem;
      border-radius: 4px;
      font-family: monospace;
      font-size: 0.85rem;
    }

    .toolbar-actions {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .btn-close {
      background: transparent;
      border: none;
      color: #94a3b8;
      font-size: 1.75rem;
      line-height: 1;
      cursor: pointer;
      padding: 0 0.5rem;
    }
    .btn-close:hover { color: #ffffff; }

    /* Printable Sheet */
    .invoice-sheet {
      padding: 2.5rem;
      color: #1e293b;
      background: #ffffff;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      font-size: 0.9rem;
      line-height: 1.5;
    }

    .inv-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 2rem;
    }

    .brand-logo .logo-text {
      font-size: 1.75rem;
      font-weight: 900;
      letter-spacing: -0.5px;
      color: #0f172a;
    }
    .brand-logo .logo-accent {
      color: #6366f1;
    }
    .brand-sub {
      font-size: 0.8rem;
      color: #64748b;
      margin: 0.2rem 0 0.5rem;
    }
    .brand-details {
      font-size: 0.8rem;
      color: #475569;
      line-height: 1.4;
    }
    .brand-details p { margin: 0; }

    .inv-meta-right {
      text-align: right;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
    }

    .inv-title-badge {
      background: #0f172a;
      color: #ffffff;
      font-size: 1.1rem;
      font-weight: 800;
      letter-spacing: 1px;
      padding: 0.4rem 1.25rem;
      border-radius: 4px;
      margin-bottom: 0.75rem;
    }

    .inv-meta-grid {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
      font-size: 0.825rem;
    }
    .meta-item {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
    }
    .meta-label { color: #64748b; font-weight: 600; }
    .meta-val { color: #0f172a; font-weight: 700; }
    .badge-pay {
      background: #e0f2fe;
      color: #0369a1;
      padding: 0.1rem 0.5rem;
      border-radius: 4px;
      font-size: 0.75rem;
    }
    .badge-status {
      background: #dcfce7;
      color: #15803d;
      padding: 0.1rem 0.5rem;
      border-radius: 4px;
      font-size: 0.75rem;
    }

    .inv-divider {
      height: 2px;
      background: #e2e8f0;
      margin: 1.5rem 0;
    }

    .inv-parties {
      display: grid;
      grid-template-columns: 1.2fr 1fr;
      gap: 2rem;
      margin-bottom: 1.75rem;
    }

    .party-box {
      background: #f8fafc;
      padding: 1.25rem;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
    }
    .party-box h4 {
      font-size: 0.85rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #64748b;
      margin: 0 0 0.5rem;
    }
    .party-name {
      font-size: 1.05rem;
      font-weight: 700;
      color: #0f172a;
      margin: 0 0 0.25rem;
    }
    .party-email, .party-phone, .party-address {
      font-size: 0.825rem;
      color: #334155;
      margin: 0.15rem 0;
    }
    .address-text {
      color: #0f172a;
      font-size: 0.85rem;
      background: #ffffff;
      padding: 0.4rem 0.6rem;
      border-radius: 4px;
      border: 1px solid #cbd5e1;
      margin: 0.25rem 0 0.5rem;
    }

    .dispatch-info p {
      font-size: 0.825rem;
      margin: 0.35rem 0;
      color: #334155;
    }

    .stamp-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      background: #ecfdf5;
      border: 1px dashed #059669;
      color: #047857;
      padding: 0.35rem 0.75rem;
      border-radius: 6px;
      font-weight: 700;
      font-size: 0.75rem;
      margin-top: 0.6rem;
    }
    .stamp-icon { font-weight: 900; }

    /* Items Table */
    .inv-table-wrap {
      margin-bottom: 1.75rem;
      overflow-x: auto;
    }
    .inv-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.85rem;
    }
    .inv-table th {
      background: #0f172a;
      color: #ffffff;
      padding: 0.75rem 0.85rem;
      font-weight: 700;
      font-size: 0.8rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .inv-table td {
      padding: 0.85rem;
      border-bottom: 1px solid #e2e8f0;
      color: #1e293b;
    }
    .inv-table tbody tr:nth-child(even) {
      background: #f8fafc;
    }
    .item-name-cell {
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
    }
    .item-name-cell strong { color: #0f172a; font-size: 0.9rem; }
    .item-sku { font-size: 0.75rem; color: #64748b; }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .font-mono { font-family: monospace; }
    .font-bold { font-weight: 700; }

    /* Summary */
    .inv-summary-row {
      display: grid;
      grid-template-columns: 1.2fr 1fr;
      gap: 2rem;
      margin-bottom: 2rem;
    }

    .words-box {
      background: #f1f5f9;
      padding: 0.85rem 1rem;
      border-radius: 6px;
      margin-bottom: 1rem;
    }
    .words-title {
      font-size: 0.75rem;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
    }
    .words-text {
      margin: 0.2rem 0 0;
      font-weight: 700;
      color: #0f172a;
      font-size: 0.85rem;
    }

    .terms-box h5 {
      font-size: 0.8rem;
      margin: 0 0 0.35rem;
      color: #475569;
      text-transform: uppercase;
    }
    .terms-box ul {
      margin: 0;
      padding-left: 1.2rem;
      font-size: 0.75rem;
      color: #64748b;
      line-height: 1.4;
    }

    .summary-right {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    .calc-row {
      display: flex;
      justify-content: space-between;
      font-size: 0.85rem;
      color: #475569;
    }
    .text-success { color: #16a34a; }
    .inv-calc-divider {
      height: 1.5px;
      background: #0f172a;
      margin: 0.35rem 0;
    }
    .total-calc-row {
      font-size: 1.1rem;
      color: #0f172a;
      padding-top: 0.25rem;
    }
    .total-amount {
      color: #4338ca;
      font-size: 1.25rem;
    }

    .auth-signature {
      margin-top: 1.5rem;
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 1rem;
    }
    .sig-seal {
      width: 54px;
      height: 54px;
      border-radius: 50%;
      border: 2px dashed #6366f1;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #eef2ff;
    }
    .seal-inner {
      text-align: center;
      line-height: 1;
      color: #4f46e5;
    }
    .seal-inner span { font-weight: 900; font-size: 0.75rem; display: block; }
    .seal-inner small { font-size: 0.55rem; font-weight: 700; letter-spacing: 0.5px; }

    .sig-info {
      text-align: right;
      display: flex;
      flex-direction: column;
    }
    .sig-line {
      width: 140px;
      height: 1px;
      background: #94a3b8;
      margin-bottom: 0.35rem;
    }
    .sig-info strong { font-size: 0.8rem; color: #0f172a; }
    .sig-info small { font-size: 0.7rem; color: #64748b; }

    .inv-footer {
      border-top: 1px solid #e2e8f0;
      padding-top: 1rem;
      text-align: center;
      font-size: 0.75rem;
      color: #64748b;
    }
    .inv-footer p { margin: 0.2rem 0; }
    .footer-small { font-size: 0.7rem; color: #94a3b8; }

    /* Print Styles */
    @media print {
      body * {
        visibility: hidden !important;
      }
      #printable-invoice, #printable-invoice * {
        visibility: visible !important;
      }
      #printable-invoice {
        position: absolute !important;
        left: 0 !important;
        top: 0 !important;
        width: 100% !important;
        max-width: 100% !important;
        padding: 1.5cm !important;
        background: #ffffff !important;
        color: #000000 !important;
        box-shadow: none !important;
        border: none !important;
      }
      .no-print {
        display: none !important;
      }
      .invoice-backdrop {
        position: static !important;
        background: none !important;
        padding: 0 !important;
      }
      .invoice-dialog {
        box-shadow: none !important;
        max-width: 100% !important;
      }
    }
  `]
})
export class InvoiceModalComponent {
  @Input() order: OrderDto | null = null;
  @Output() closeEvent = new EventEmitter<void>();

  constructor(
    private toast: ToastService,
    private notificationService: NotificationService
  ) {}

  close(): void {
    this.closeEvent.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('invoice-backdrop')) {
      this.close();
    }
  }

  printInvoice(): void {
    const printableElement = document.getElementById('printable-invoice');
    if (!printableElement) {
      window.print();
      return;
    }

    this.toast.info('Preparing Tax Invoice PDF...');

    let iframe = document.getElementById('invoice-print-iframe') as HTMLIFrameElement;
    if (iframe) {
      iframe.remove();
    }

    iframe = document.createElement('iframe');
    iframe.id = 'invoice-print-iframe';
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.visibility = 'hidden';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) return;

    const styles = `
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        background: #ffffff;
        color: #1e293b;
        padding: 24px;
        font-size: 13px;
        line-height: 1.5;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      .inv-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
      .brand-logo .logo-text { font-size: 24px; font-weight: 900; color: #0f172a; }
      .brand-logo .logo-accent { color: #6366f1; }
      .brand-sub { font-size: 12px; color: #64748b; margin: 3px 0 6px; }
      .brand-details { font-size: 11px; color: #475569; line-height: 1.4; }
      .brand-details p { margin: 0; }
      
      .inv-meta-right { text-align: right; display: flex; flex-direction: column; align-items: flex-end; }
      .inv-title-badge { background: #0f172a; color: #ffffff; font-size: 15px; font-weight: 800; letter-spacing: 1px; padding: 6px 16px; border-radius: 4px; margin-bottom: 10px; display: inline-block; }
      .inv-meta-grid { display: flex; flex-direction: column; gap: 4px; font-size: 12px; }
      .meta-item { display: flex; justify-content: flex-end; gap: 10px; }
      .meta-label { color: #64748b; font-weight: 600; }
      .meta-val { color: #0f172a; font-weight: 700; }
      .badge-pay { background: #e0f2fe; color: #0369a1; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 700; }
      .badge-status { background: #dcfce7; color: #15803d; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 700; }
      
      .inv-divider { height: 2px; background: #e2e8f0; margin: 18px 0; }
      
      .inv-parties { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; }
      .party-box { border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; background: #f8fafc; }
      .party-box h4 { font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; font-weight: 800; margin-bottom: 8px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
      .party-name { font-size: 15px; font-weight: 800; color: #0f172a; margin-bottom: 4px; }
      .party-email, .party-phone { font-size: 12px; color: #334155; margin-bottom: 4px; }
      .party-address { font-size: 12px; font-weight: 700; color: #475569; margin-top: 6px; }
      .address-text { font-size: 12px; color: #1e293b; background: #ffffff; padding: 8px; border-radius: 6px; border: 1px solid #cbd5e1; margin: 4px 0 8px; line-height: 1.4; font-weight: 500; }
      .dispatch-info p { font-size: 12px; color: #334155; margin: 4px 0; }
      
      .stamp-badge { margin-top: 10px; display: inline-flex; align-items: center; gap: 6px; background: #f0fdf4; border: 1px solid #86efac; color: #166534; padding: 6px 12px; border-radius: 6px; font-size: 11px; font-weight: 800; }
      
      .inv-table-wrap { margin-bottom: 20px; }
      .inv-table { width: 100%; border-collapse: collapse; }
      .inv-table th { background: #0f172a; color: #ffffff; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; padding: 10px 12px; font-weight: 700; }
      .inv-table td { padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 12px; color: #1e293b; }
      .item-name-cell strong { display: block; font-size: 13px; color: #0f172a; }
      .item-id-tag { font-size: 11px; color: #64748b; }
      
      .inv-calculations { display: grid; grid-template-columns: 1.2fr 1fr; gap: 20px; margin-bottom: 24px; }
      .words-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; margin-top: 6px; }
      .words-box small { font-size: 11px; color: #64748b; font-weight: 700; text-transform: uppercase; }
      .words-box p { font-size: 12px; font-weight: 700; color: #0f172a; font-style: italic; margin-top: 2px; }
      
      .calc-col { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px; }
      .calc-row { display: flex; justify-content: space-between; font-size: 12px; padding: 4px 0; color: #475569; }
      .calc-row.grand-row { border-top: 2px solid #0f172a; padding-top: 8px; margin-top: 6px; font-size: 15px; font-weight: 900; color: #0f172a; }
      .calc-val { font-weight: 700; }
      
      .inv-signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 24px 0; }
      .sig-line { width: 140px; height: 1px; background: #94a3b8; margin-bottom: 6px; }
      .sig-info strong { font-size: 11px; color: #0f172a; display: block; }
      .sig-info small { font-size: 10px; color: #64748b; }
      
      .inv-footer { border-top: 1px solid #e2e8f0; padding-top: 14px; text-align: center; font-size: 11px; color: #64748b; }
      .inv-footer p { margin: 2px 0; }
      .footer-small { font-size: 10px; color: #94a3b8; }
      
      @page { size: A4 portrait; margin: 10mm; }
    `;

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Tax Invoice - ${this.order?.orderNumber}</title>
          <style>${styles}</style>
        </head>
        <body>
          ${printableElement.innerHTML}
        </body>
      </html>
    `);
    doc.close();

    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    }, 300);
  }

  resendEmail(): void {
    if (!this.order) return;
    const email = this.order.customerEmail || 'customer@example.com';
    const htmlInvoice = this.generateInvoiceHtml(this.order);

    this.notificationService.dispatchNotification({
      recipientEmail: email,
      userId: this.order.customerId,
      subject: `Official Tax Invoice: Order #${this.order.orderNumber}`,
      message: htmlInvoice,
      type: 'ORDER_CONFIRMED',
      channel: 'EMAIL'
    }, true);
    this.toast.success(`Official Tax Invoice sent to ${email}!`);
  }

  generateInvoiceHtml(order: OrderDto): string {
    const subtotal = this.getItemsSubtotal(order);
    const delivery = this.getDeliveryFee(order);
    const taxable = this.getTaxableAmount(order);
    const cgst = this.getCgst(order);
    const sgst = this.getSgst(order);
    const words = this.amountInWords(order.totalAmount);
    const dateStr = new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

    let itemsRows = '';
    (order.items || []).forEach((item, idx) => {
      itemsRows += `
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 10px 12px; text-align: center; color: #64748b; font-family: monospace;">${idx + 1}</td>
          <td style="padding: 10px 12px;">
            <strong style="color: #0f172a; font-size: 13px;">${item.productName}</strong>
            <div style="font-size: 11px; color: #64748b;">HSN: 8518 • Product ID: #${item.productId}</div>
          </td>
          <td style="padding: 10px 12px; text-align: center; font-weight: 700; color: #0f172a;">${item.quantity}</td>
          <td style="padding: 10px 12px; text-align: right; color: #334155;">₹${item.unitPrice.toFixed(2)}</td>
          <td style="padding: 10px 12px; text-align: right; font-weight: 700; color: #0f172a;">₹${(item.totalPrice || (item.quantity * item.unitPrice)).toFixed(2)}</td>
        </tr>
      `;
    });

    return `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 680px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; color: #1e293b; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
        <!-- Invoice Header -->
        <div style="background: #0f172a; color: #ffffff; padding: 24px; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <div style="font-size: 22px; font-weight: 900; letter-spacing: -0.5px;">EShopping<span style="color: #818cf8;">Zone</span></div>
            <div style="font-size: 11px; color: #94a3b8; margin-top: 2px;">Modern Next-Gen E-Commerce & Retail Marketplace</div>
          </div>
          <div style="text-align: right;">
            <div style="background: #ffffff; color: #0f172a; font-size: 12px; font-weight: 800; letter-spacing: 1px; padding: 4px 12px; border-radius: 4px; display: inline-block;">TAX INVOICE</div>
            <div style="font-size: 12px; color: #cbd5e1; margin-top: 4px; font-family: monospace;">INV-${order.orderNumber}</div>
          </div>
        </div>

        <div style="padding: 24px;">
          <!-- Meta Grid -->
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr>
              <td style="width: 50%; vertical-align: top; padding-right: 12px;">
                <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px;">
                  <div style="font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; margin-bottom: 6px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;">Billed & Shipped To:</div>
                  <div style="font-size: 14px; font-weight: 800; color: #0f172a;">${order.customerUsername || 'Valued Customer'}</div>
                  <div style="font-size: 12px; color: #475569; margin: 3px 0;"><strong>Email:</strong> ${order.customerEmail || 'customer@example.com'}</div>
                  <div style="font-size: 11px; font-weight: 700; color: #475569; margin-top: 6px;">Delivery Address:</div>
                  <div style="font-size: 12px; background: #ffffff; padding: 8px; border-radius: 6px; border: 1px solid #cbd5e1; color: #0f172a; margin-top: 2px; line-height: 1.4;">${order.shippingAddressSnapshot || 'Primary Delivery Address on File'}</div>
                </div>
              </td>
              <td style="width: 50%; vertical-align: top; padding-left: 12px;">
                <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px;">
                  <div style="font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; margin-bottom: 6px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;">Order Summary:</div>
                  <div style="font-size: 12px; color: #334155; margin: 3px 0;"><strong>Order Date:</strong> ${dateStr}</div>
                  <div style="font-size: 12px; color: #334155; margin: 3px 0;"><strong>Payment Mode:</strong> <span style="background: #e0f2fe; color: #0369a1; padding: 2px 6px; border-radius: 4px; font-weight: 700; font-size: 11px;">${order.paymentMethod || 'WALLET'}</span></div>
                  <div style="font-size: 12px; color: #334155; margin: 3px 0;"><strong>Order Status:</strong> <span style="background: #dcfce7; color: #15803d; padding: 2px 6px; border-radius: 4px; font-weight: 700; font-size: 11px;">${order.status}</span></div>
                  <div style="margin-top: 10px; background: #f0fdf4; border: 1px solid #86efac; color: #166534; padding: 6px 10px; border-radius: 6px; font-size: 11px; font-weight: 800; text-align: center;">
                    ✓ PAYMENT VERIFIED & SETTLED
                  </div>
                </div>
              </td>
            </tr>
          </table>

          <!-- Items Table -->
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <thead>
              <tr style="background: #0f172a; color: #ffffff;">
                <th style="padding: 10px 12px; font-size: 11px; text-transform: uppercase; text-align: center; width: 30px;">#</th>
                <th style="padding: 10px 12px; font-size: 11px; text-transform: uppercase; text-align: left;">Item Description</th>
                <th style="padding: 10px 12px; font-size: 11px; text-transform: uppercase; text-align: center; width: 50px;">Qty</th>
                <th style="padding: 10px 12px; font-size: 11px; text-transform: uppercase; text-align: right; width: 80px;">Unit Price</th>
                <th style="padding: 10px 12px; font-size: 11px; text-transform: uppercase; text-align: right; width: 90px;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsRows}
            </tbody>
          </table>

          <!-- Financial Breakdown -->
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr>
              <td style="width: 50%; vertical-align: top; padding-right: 12px;">
                <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px;">
                  <div style="font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase;">Amount in Words:</div>
                  <div style="font-size: 12px; font-weight: 700; color: #0f172a; font-style: italic; margin-top: 4px;">${words}</div>
                </div>
              </td>
              <td style="width: 50%; vertical-align: top; padding-left: 12px;">
                <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px;">
                  <div style="display: flex; justify-content: space-between; font-size: 12px; padding: 3px 0; color: #475569;">
                    <span>Items Subtotal:</span><strong>₹${subtotal.toFixed(2)}</strong>
                  </div>
                  <div style="display: flex; justify-content: space-between; font-size: 12px; padding: 3px 0; color: #475569;">
                    <span>Doorstep Delivery:</span><strong>${delivery > 0 ? '₹' + delivery.toFixed(2) : 'FREE'}</strong>
                  </div>
                  <div style="display: flex; justify-content: space-between; font-size: 12px; padding: 3px 0; color: #475569;">
                    <span>Taxable Value (18% GST):</span><strong>₹${taxable.toFixed(2)}</strong>
                  </div>
                  <div style="display: flex; justify-content: space-between; font-size: 12px; padding: 3px 0; color: #475569;">
                    <span>CGST (9.0%):</span><strong>₹${cgst.toFixed(2)}</strong>
                  </div>
                  <div style="display: flex; justify-content: space-between; font-size: 12px; padding: 3px 0; color: #475569;">
                    <span>SGST (9.0%):</span><strong>₹${sgst.toFixed(2)}</strong>
                  </div>
                  <div style="display: flex; justify-content: space-between; font-size: 15px; font-weight: 900; color: #0f172a; border-top: 2px solid #0f172a; margin-top: 6px; padding-top: 6px;">
                    <span>Grand Total:</span><span>₹${order.totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </td>
            </tr>
          </table>

          <!-- Footer -->
          <div style="border-top: 1px solid #e2e8f0; padding-top: 14px; text-align: center; font-size: 11px; color: #64748b;">
            <p style="margin: 2px 0;">This is a computer-generated tax invoice and is valid without physical signature under Indian IT Act 2000.</p>
            <p style="margin: 2px 0; font-size: 10px; color: #94a3b8;">EShopping Zone • GSTIN: 29AAACE1234F1Z5 • Support: support@eshoppingzone.com</p>
          </div>
        </div>
      </div>
    `;
  }

  getItemsSubtotal(order: OrderDto | null): number {
    if (!order || !order.items || order.items.length === 0) {
      return order ? (order.totalAmount < 500 && order.totalAmount > 60 ? +(order.totalAmount - 60).toFixed(2) : order.totalAmount) : 0;
    }
    const sum = order.items.reduce((s, i) => s + (i.totalPrice || (i.quantity * i.unitPrice)), 0);
    return +sum.toFixed(2);
  }

  getDeliveryFee(order: OrderDto | null): number {
    const subtotal = this.getItemsSubtotal(order);
    return (subtotal > 0 && subtotal < 500) ? 60 : 0;
  }

  getTaxableAmount(order: OrderDto | null): number {
    const subtotal = this.getItemsSubtotal(order);
    return +(subtotal / 1.18).toFixed(2);
  }

  getCgst(order: OrderDto | null): number {
    const subtotal = this.getItemsSubtotal(order);
    const tax = subtotal - this.getTaxableAmount(order);
    return +(tax / 2).toFixed(2);
  }

  getSgst(order: OrderDto | null): number {
    return this.getCgst(order);
  }

  amountInWords(amount: number): string {
    const num = Math.round(amount);
    if (isNaN(num) || num <= 0) return 'Zero Rupees Only';
    
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 
      'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    function convertSection(n: number): string {
      let str = '';
      if (n >= 100) {
        str += ones[Math.floor(n / 100)] + ' Hundred ';
        n %= 100;
      }
      if (n >= 20) {
        str += tens[Math.floor(n / 10)] + ' ';
        n %= 10;
      }
      if (n > 0) {
        str += ones[n] + ' ';
      }
      return str.trim();
    }

    let result = '';
    const crore = Math.floor(num / 10000000);
    const lakh = Math.floor((num % 10000000) / 100000);
    const thousand = Math.floor((num % 100000) / 1000);
    const remainder = num % 1000;

    if (crore > 0) result += convertSection(crore) + ' Crore ';
    if (lakh > 0) result += convertSection(lakh) + ' Lakh ';
    if (thousand > 0) result += convertSection(thousand) + ' Thousand ';
    if (remainder > 0) result += convertSection(remainder);

    return (result.trim() ? result.trim() : 'Zero') + ' Rupees Only';
  }
}
