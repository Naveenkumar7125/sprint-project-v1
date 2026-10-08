import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LogoComponent } from '../logo/logo.component';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterModule, LogoComponent],
  template: `
    <footer class="footer-root">
      <!-- Trust Signals Banner -->
      <div class="features-bar">
        <div class="container features-grid">
          <div class="feature-item">
            <span class="feature-icon"><i class="bi bi-truck"></i></span>
            <div>
              <h4>Express Delivery</h4>
              <p>Fast doorstep delivery with live tracking</p>
            </div>
          </div>
          <div class="feature-item">
            <span class="feature-icon"><i class="bi bi-shield-check"></i></span>
            <div>
              <h4>100% Safe Payments</h4>
              <p>Secure digital wallet & cash on delivery</p>
            </div>
          </div>
          <div class="feature-item">
            <span class="feature-icon"><i class="bi bi-star-fill"></i></span>
            <div>
              <h4>Verified Reviews</h4>
              <p>Authentic feedback from real buyers</p>
            </div>
          </div>
          <div class="feature-item">
            <span class="feature-icon"><i class="bi bi-arrow-repeat"></i></span>
            <div>
              <h4>Easy Returns & Refunds</h4>
              <p>Hassle-free refunds to your wallet</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Footer Links -->
      <div class="container footer-main">
        <div class="footer-brand-col">
          <app-logo [height]="46" textColor="#FFFFFF"></app-logo>
          <p class="brand-desc">
            EShopping Zone is India's trusted online shopping destination offering a premium selection of electronics, fashion, home essentials, and lifestyle brands with fast delivery and seamless digital payments.
          </p>
          <div class="payment-methods-strip">
            <span class="badge badge-primary"><i class="bi bi-credit-card-2-front me-1"></i> EShopping Pay</span>
            <span class="badge badge-accent"><i class="bi bi-cash-stack me-1"></i> Cash on Delivery</span>
            <span class="badge badge-info"><i class="bi bi-lock-fill me-1"></i> Secure Checkout</span>
          </div>
        </div>

        <div class="footer-links-col">
          <h4>Customer Care</h4>
          <ul>
            <li><a routerLink="/account/orders">My Orders & Receipts</a></li>
            <li><a routerLink="/track-delivery">Track Package Live</a></li>
            <li><a routerLink="/account/wallet">Digital Wallet</a></li>
            <li><a routerLink="/account/profile">Saved Addresses</a></li>
          </ul>
        </div>

        <div class="footer-links-col">
          <h4>Partner & Seller</h4>
          <ul>
            <li><a routerLink="/merchant/dashboard">Merchant Dashboard</a></li>
            <li><a routerLink="/delivery/dashboard">Delivery Partner Hub</a></li>
            <li><a routerLink="/admin/dashboard">Management Portal</a></li>
            <li><a routerLink="/register">Become a Seller</a></li>
          </ul>
        </div>

        <div class="footer-links-col">
          <h4>Help & Support</h4>
          <ul>
            <li><a routerLink="/products">Browse All Products</a></li>
            <li><a routerLink="/account/notifications">Alerts & Mail Inbox</a></li>
            <li><a routerLink="/track-delivery">Shipping & Delivery Policy</a></li>
            <li><a routerLink="/account/wallet">Refund & Wallet Policy</a></li>
          </ul>
        </div>
      </div>

      <!-- Bottom Copyright -->
      <div class="footer-bottom">
        <div class="container bottom-content">
          <p>© 2026 EShopping Zone Pvt. Ltd. All rights reserved.</p>
          <div class="legal-links">
            <span>Privacy Policy</span>
            <span>•</span>
            <span>Terms of Service</span>
            <span>•</span>
            <span>Security & Compliance</span>
          </div>
        </div>
      </div>
    </footer>
  `,
  styles: [`
    .footer-root {
      background: #0f172a;
      color: #94a3b8;
      margin-top: auto;
      border-top: 1px solid #1e293b;
    }
    .features-bar {
      background: #1e293b;
      padding: 2rem 0;
      border-bottom: 1px solid #334155;
    }
    .features-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 1.5rem;
    }
    .feature-item {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .feature-icon { font-size: 2rem; }
    .feature-item h4 {
      color: #f8fafc;
      font-size: 0.95rem;
      font-weight: 700;
      margin-bottom: 0.2rem;
    }
    .feature-item p {
      color: #94a3b8;
      font-size: 0.8125rem;
      margin: 0;
    }

    .footer-main {
      display: grid;
      grid-template-columns: 2fr 1fr 1fr 1fr;
      gap: 2.5rem;
      padding: 3.5rem 1.25rem 2.5rem;
    }
    .brand-desc {
      color: #94a3b8;
      font-size: 0.875rem;
      line-height: 1.6;
      margin: 1.25rem 0;
      max-width: 400px;
    }
    .payment-methods-strip {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .footer-links-col h4 {
      color: #f8fafc;
      font-size: 1rem;
      font-weight: 700;
      margin-bottom: 1.25rem;
    }
    .footer-links-col ul { list-style: none; display: flex; flex-direction: column; gap: 0.75rem; }
    .footer-links-col a {
      color: #94a3b8;
      font-size: 0.875rem;
      transition: color var(--transition-fast);
    }
    .footer-links-col a:hover { color: #f97316; }

    .footer-bottom {
      background: #020617;
      padding: 1.25rem 0;
      font-size: 0.8125rem;
      border-top: 1px solid #1e293b;
    }
    .bottom-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
    }
    .legal-links { display: flex; gap: 0.75rem; color: #64748b; }

    @media (max-width: 900px) {
      .footer-main { grid-template-columns: 1fr 1fr; }
    }
    @media (max-width: 600px) {
      .footer-main { grid-template-columns: 1fr; }
      .bottom-content { flex-direction: column; text-align: center; }
    }
  `]
})
export class FooterComponent {}
