import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule, Validators } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { ProductService } from '../../../core/services/product.service';
import { UserRole } from '../../../core/models/auth.models';
import { CategoryDto } from '../../../core/models/product.models';
import { SEED_CATEGORIES } from '../../../core/mocks/seed-products.data';
import { environment } from '../../../../environments/environment';
import { LogoComponent } from '../../../shared/components/logo/logo.component';
import { ToastService } from '../../../core/services/toast.service';

declare const google: any;

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterModule, LogoComponent],
  template: `
    <div class="auth-page">
      <div class="auth-card card-glass animate-fade-in">
        <div class="auth-header">
          <a routerLink="/" class="auth-logo">
            <app-logo [height]="42"></app-logo>
          </a>
          <h2>Create Account</h2>
          <p>Join EShopping Zone as a Customer, Merchant, or Partner</p>
        </div>

        <!-- Role Selector Pills -->
        <div class="role-selector">
          <button
            type="button"
            class="role-pill"
            [class.active]="selectedRole === 'CUSTOMER'"
            (click)="selectRole('CUSTOMER')"
          >
            <i class="bi bi-bag-check me-1"></i> Shopper
          </button>
          <button
            type="button"
            class="role-pill"
            [class.active]="selectedRole === 'MERCHANT'"
            (click)="selectRole('MERCHANT')"
          >
            <i class="bi bi-shop me-1"></i> Merchant
          </button>
          <button
            type="button"
            class="role-pill"
            [class.active]="selectedRole === 'DELIVERY_AGENT'"
            (click)="selectRole('DELIVERY_AGENT')"
          >
            <i class="bi bi-truck me-1"></i> Courier
          </button>
        </div>

        <form [formGroup]="registerForm" (ngSubmit)="onSubmit()" class="auth-form">
          <div class="form-group">
            <label class="form-label" for="username">Username</label>
            <input
              id="username"
              type="text"
              formControlName="username"
              placeholder="e.g. alex_stone"
              class="form-control"
              [class.is-invalid]="f['username'].touched && f['username'].invalid"
            />
            <div *ngIf="f['username'].touched && f['username'].invalid" class="form-error">
              Username must be between 3 and 50 characters.
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="email">Email Address</label>
            <input
              id="email"
              type="email"
              formControlName="email"
              placeholder="e.g. alex@example.com"
              class="form-control"
              [class.is-invalid]="f['email'].touched && f['email'].invalid"
            />
            <div *ngIf="f['email'].touched && f['email'].invalid" class="form-error">
              Please enter a valid email address.
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="password">Password</label>
            <input
              id="password"
              type="password"
              formControlName="password"
              placeholder="At least 8 chars with upper, lower, digit, symbol"
              class="form-control"
              [class.is-invalid]="f['password'].touched && f['password'].invalid"
            />
            <div *ngIf="f['password'].touched && f['password'].invalid" class="form-error">
              Password must be 8+ characters and include uppercase, lowercase, digit, and special character.
            </div>
          </div>

          <!-- Merchant Domain Category Selection -->
          <div *ngIf="selectedRole === 'MERCHANT'" class="merchant-domain-box animate-fade-in">
            <div class="domain-box-header">
              <span class="domain-icon"><i class="bi bi-tag-fill"></i></span>
              <div>
                <strong>Single Category Specialization</strong>
                <p>Each merchant manages exactly one product category catalog.</p>
              </div>
            </div>
            <div class="form-group mt-2">
              <label class="form-label" for="assignedCategoryId">Select Your Store Category *</label>
              <select
                id="assignedCategoryId"
                formControlName="assignedCategoryId"
                class="form-control domain-select"
                (change)="onCategorySelect($event)"
                [class.is-invalid]="f['assignedCategoryId'].touched && f['assignedCategoryId'].invalid"
              >
                <option value="">Choose product category...</option>
                <option *ngFor="let cat of categories()" [value]="cat.id">
                  {{ cat.name }}
                </option>
              </select>
              <div *ngIf="f['assignedCategoryId'].touched && f['assignedCategoryId'].invalid" class="form-error">
                Please select your authorized store category.
              </div>
            </div>
          </div>

          <button type="submit" class="btn btn-primary btn-lg submit-btn" [disabled]="registerForm.invalid || isLoading">
            <span *ngIf="!isLoading">Register as {{ getRoleDisplayName(selectedRole) }}</span>
            <span *ngIf="isLoading">Creating account...</span>
          </button>
        </form>

        <div class="divider-or">
          <span>OR SIGN UP WITH</span>
        </div>

        <!-- OAuth Social Sign-Up -->
        <div class="oauth-buttons">
          <button type="button" class="btn btn-secondary oauth-btn" (click)="signUpWithGoogle()">
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
              <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
            </svg>
            Google
          </button>

          <button type="button" class="btn btn-secondary oauth-btn" (click)="openGithubModal()">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path fill-rule="evenodd" clip-rule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
            </svg>
            GitHub
          </button>
        </div>

        <div class="auth-footer">
          <p>Already have an account? <a routerLink="/login" class="login-link">Sign In</a></p>
        </div>
      </div>

      <!-- Interactive GitHub OAuth Register Modal -->
      <div class="modal-backdrop animate-fade-in" *ngIf="showGithubModal" (click)="closeGithubModal()">
        <div class="modal-card github-modal animate-scale-up" (click)="$event.stopPropagation()">
          <div class="github-modal-header">
            <div class="github-logo-wrap">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                <path fill-rule="evenodd" clip-rule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
              </svg>
            </div>
            <div>
              <h3>Sign up with GitHub</h3>
              <p>Register as {{ getRoleDisplayName(selectedRole) }} via GitHub</p>
            </div>
            <button class="modal-close-btn" (click)="closeGithubModal()"><i class="bi bi-x-lg"></i></button>
          </div>

          <div class="github-modal-body">
            <div class="form-group">
              <label class="form-label" for="ghRegHandle">GitHub Username or Handle</label>
              <div class="gh-input-group">
                <input
                  id="ghRegHandle"
                  type="text"
                  [(ngModel)]="githubUsername"
                  placeholder="e.g. octocat, torvalds, or your username"
                  class="form-control"
                  (keyup.enter)="fetchGithubProfile()"
                />
                <button
                  type="button"
                  class="btn btn-secondary btn-sm gh-fetch-btn"
                  (click)="fetchGithubProfile()"
                  [disabled]="isFetchingGithub || !githubUsername.trim()"
                >
                  {{ isFetchingGithub ? 'Checking...' : 'Verify' }}
                </button>
              </div>
            </div>

            <!-- Profile Preview Card if verified -->
            <div class="gh-profile-card animate-fade-in" *ngIf="githubProfile">
              <img [src]="githubProfile.avatar_url" [alt]="githubProfile.login" class="gh-avatar" />
              <div class="gh-info">
                <h4>{{ githubProfile.name || githubProfile.login }}</h4>
                <p class="gh-handle">&#64;{{ githubProfile.login }}</p>
                <small *ngIf="githubProfile.bio">{{ githubProfile.bio }}</small>
              </div>
              <span class="badge badge-success">Verified</span>
            </div>

            <div class="form-group mt-3" *ngIf="githubProfile">
              <label class="form-label" for="ghRegEmail">Notification Email (For Wallet & Order Receipts)</label>
              <input
                id="ghRegEmail"
                type="email"
                [(ngModel)]="githubEmail"
                placeholder="e.g. your_real_email@gmail.com"
                class="form-control"
              />
              <small class="text-muted" style="font-size: 0.75rem; color: #64748b; margin-top: 0.25rem; display: block;">
                Enter your Gmail or active mailbox to receive real-time email notifications.
              </small>
            </div>

            <!-- Role Selector in Modal -->
            <div class="form-group">
              <label class="form-label">Account Role</label>
              <div class="role-selector-sm">
                <button
                  type="button"
                  class="role-pill-sm"
                  [class.active]="selectedRole === 'CUSTOMER'"
                  (click)="selectRole('CUSTOMER')"
                >
                  <i class="bi bi-bag-check me-1"></i> Shopper
                </button>
                <button
                  type="button"
                  class="role-pill-sm"
                  [class.active]="selectedRole === 'MERCHANT'"
                  (click)="selectRole('MERCHANT')"
                >
                  <i class="bi bi-shop me-1"></i> Merchant
                </button>
                <button
                  type="button"
                  class="role-pill-sm"
                  [class.active]="selectedRole === 'DELIVERY_AGENT'"
                  (click)="selectRole('DELIVERY_AGENT')"
                >
                  <i class="bi bi-truck me-1"></i> Courier
                </button>
              </div>
            </div>

            <!-- GitHub Modal Category selection if MERCHANT -->
            <div *ngIf="selectedRole === 'MERCHANT'" class="form-group mt-2">
              <label class="form-label" for="modalMerchantCategory">Store Specialization Category *</label>
              <select
                id="modalMerchantCategory"
                [(ngModel)]="githubAssignedCategoryId"
                class="form-control"
              >
                <option value="">Select store category...</option>
                <option *ngFor="let cat of categories()" [value]="cat.id">
                  {{ cat.name }}
                </option>
              </select>
            </div>

            <div class="gh-actions">
              <button
                type="button"
                class="btn btn-primary btn-lg w-100"
                (click)="confirmGithubAuth()"
              >
                <i class="bi bi-check-circle-fill me-1"></i> Register as {{ getRoleDisplayName(selectedRole) }}
              </button>

              <button
                type="button"
                class="btn btn-outline btn-sm w-100 mt-2"
                (click)="quickGithubSignUp()"
              >
                1-Click Quick Developer Sign-Up
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-page {
      min-height: calc(100vh - 180px);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 3rem 1.25rem;
      background: linear-gradient(135deg, #eef2ff 0%, #f8fafc 50%, #ffedd5 100%);
    }
    .auth-card {
      max-width: 480px;
      width: 100%;
      padding: 2.5rem;
      background: rgba(255, 255, 255, 0.95);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-xl);
      box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.08);
    }
    .auth-header { text-align: center; margin-bottom: 1.5rem; }
    .auth-logo { display: inline-block; margin-bottom: 1rem; }
    .auth-header h2 { font-size: 1.75rem; font-weight: 800; color: var(--text-primary); margin-bottom: 0.25rem; }
    .auth-header p { font-size: 0.875rem; color: var(--text-secondary); }

    .role-selector {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0.5rem;
      background: var(--bg-subtle);
      padding: 0.35rem;
      border-radius: var(--radius-lg);
      margin-bottom: 1.5rem;
    }
    .role-pill {
      background: transparent;
      border: none;
      padding: 0.6rem 0.25rem;
      font-size: 0.8125rem;
      font-weight: 700;
      color: var(--text-secondary);
      border-radius: var(--radius-md);
      cursor: pointer;
      transition: all var(--transition-fast);
      text-align: center;
    }
    .role-pill.active {
      background: #ffffff;
      color: var(--primary-700);
      box-shadow: var(--shadow-sm);
    }

    .role-selector-sm {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0.5rem;
      background: #f1f5f9;
      padding: 0.25rem;
      border-radius: var(--radius-md);
      margin-top: 0.35rem;
    }
    .role-pill-sm {
      background: transparent;
      border: none;
      padding: 0.5rem 0.2rem;
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--text-secondary);
      border-radius: var(--radius-sm);
      cursor: pointer;
      transition: all var(--transition-fast);
      text-align: center;
    }
    .role-pill-sm.active {
      background: #ffffff;
      color: var(--primary-700);
      box-shadow: var(--shadow-sm);
    }

    .submit-btn { width: 100%; margin-top: 0.5rem; }

    .divider-or {
      display: flex;
      align-items: center;
      text-align: center;
      margin: 1.75rem 0 1.25rem;
      color: var(--text-muted);
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 0.05em;
    }
    .divider-or::before, .divider-or::after {
      content: '';
      flex: 1;
      border-bottom: 1px solid var(--border-subtle);
    }
    .divider-or span { padding: 0 0.75rem; }

    .oauth-buttons {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.75rem;
      margin-bottom: 1.5rem;
    }
    .oauth-btn {
      width: 100%;
      font-size: 0.875rem;
      font-weight: 600;
    }

    .auth-footer {
      text-align: center;
      font-size: 0.9rem;
      color: var(--text-secondary);
      border-top: 1px solid var(--border-subtle);
      padding-top: 1.25rem;
      margin-top: 0.5rem;
    }
    .login-link { color: var(--primary-600); font-weight: 700; }

    /* Modal Backdrop & Github Auth Dialog */
    .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(15, 23, 42, 0.65);
      backdrop-filter: blur(6px);
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
    }
    .github-modal {
      max-width: 480px;
      width: 100%;
      background: #ffffff;
      border-radius: var(--radius-xl);
      padding: 2rem;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      border: 1px solid var(--border-subtle);
    }
    .github-modal-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1.5rem;
      position: relative;
    }
    .github-logo-wrap {
      width: 48px;
      height: 48px;
      background: #0f172a;
      color: #ffffff;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .github-modal-header h3 {
      font-size: 1.25rem;
      font-weight: 800;
      color: #0f172a;
      margin-bottom: 0.2rem;
    }
    .github-modal-header p {
      font-size: 0.85rem;
      color: var(--text-secondary);
    }
    .modal-close-btn {
      position: absolute;
      top: -0.5rem;
      right: -0.5rem;
      background: #f1f5f9;
      border: none;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      cursor: pointer;
      font-weight: 700;
      color: #64748b;
    }
    .modal-close-btn:hover { background: #e2e8f0; color: #0f172a; }

    .gh-input-group {
      display: flex;
      gap: 0.5rem;
    }
    .gh-fetch-btn {
      white-space: nowrap;
      padding: 0 1rem;
    }

    .gh-profile-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: var(--radius-md);
      margin: 1rem 0;
    }
    .gh-avatar {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      object-fit: cover;
      border: 2px solid var(--primary-500);
    }
    .gh-info h4 {
      font-size: 0.95rem;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 0.1rem;
    }
    .gh-handle {
      font-size: 0.8125rem;
      color: var(--primary-600);
      font-weight: 600;
    }
    .gh-info small {
      font-size: 0.75rem;
      color: #64748b;
      display: block;
    }
    .gh-actions {
      margin-top: 1.5rem;
    }

    .merchant-domain-box {
      background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
      border: 1px solid #86efac;
      border-radius: var(--radius-md);
      padding: 1rem;
      margin-bottom: 1.25rem;
    }
    .domain-box-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .domain-icon {
      font-size: 1.5rem;
    }
    .domain-box-header strong {
      display: block;
      font-size: 0.9rem;
      color: #166534;
    }
    .domain-box-header p {
      margin: 0;
      font-size: 0.78rem;
      color: #15803d;
    }
    .domain-select {
      background: #ffffff;
      border-color: #86efac;
      font-weight: 600;
    }
    .domain-select:focus {
      border-color: #22c55e;
      box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.2);
    }
  `]
})
export class RegisterComponent implements OnInit {
  registerForm!: FormGroup;
  selectedRole: UserRole = 'CUSTOMER';
  isLoading: boolean = false;
  categories = signal<CategoryDto[]>([]);

  // GitHub Auth Modal State
  showGithubModal: boolean = false;
  githubUsername: string = 'Naveenkumar7125';
  githubEmail: string = '';
  githubProfile: any = null;
  githubAssignedCategoryId: string = '';
  isFetchingGithub: boolean = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private productService: ProductService,
    private router: Router,
    private route: ActivatedRoute,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    const prefillEmail = this.route.snapshot.queryParams['email'] || '';
    const prefillUsername = this.route.snapshot.queryParams['username'] || '';
    const passwordPattern = '^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=!]).*$';

    this.registerForm = this.fb.group({
      username: [prefillUsername, [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
      email: [prefillEmail, [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8), Validators.pattern(passwordPattern)]],
      assignedCategoryId: ['']
    });

    this.loadCategories();
  }

  loadCategories(): void {
    this.productService.getAllCategories().subscribe({
      next: (cats) => {
        if (cats && cats.length > 0) {
          this.categories.set(cats);
        } else {
          this.categories.set(SEED_CATEGORIES);
        }
      },
      error: () => {
        this.categories.set(SEED_CATEGORIES);
      }
    });
  }

  get f() {
    return this.registerForm.controls;
  }

  selectRole(role: UserRole): void {
    this.selectedRole = role;
    const catControl = this.registerForm.get('assignedCategoryId');
    if (role === 'MERCHANT') {
      catControl?.setValidators([Validators.required]);
    } else {
      catControl?.clearValidators();
      catControl?.setValue('');
    }
    catControl?.updateValueAndValidity();
  }

  onCategorySelect(event: any): void {
    // category changed in form
  }

  getRoleDisplayName(role: UserRole): string {
    switch (role) {
      case 'MERCHANT': return 'Merchant';
      case 'DELIVERY_AGENT': return 'Courier';
      default: return 'Customer';
    }
  }

  onSubmit(): void {
    if (this.selectedRole === 'MERCHANT' && !this.registerForm.value.assignedCategoryId) {
      this.registerForm.get('assignedCategoryId')?.markAsTouched();
      this.toast.error('Please select the single category your merchant store will operate in.');
      return;
    }

    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;

    let catId: number | undefined = undefined;
    let catName: string | undefined = undefined;

    if (this.selectedRole === 'MERCHANT') {
      catId = +this.registerForm.value.assignedCategoryId;
      const cat = this.categories().find(c => c.id === catId);
      catName = cat ? cat.name : undefined;
    }

    const payload = {
      username: this.registerForm.value.username,
      email: this.registerForm.value.email,
      password: this.registerForm.value.password,
      role: this.selectedRole,
      assignedCategoryId: catId,
      assignedCategoryName: catName
    };

    this.authService.register(payload).subscribe({
      next: () => {
        this.isLoading = false;
        this.router.navigate(['/login'], {
          queryParams: {
            usernameOrEmail: payload.username
          }
        });
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  signUpWithGoogle(): void {
    const clientId = environment.oauth.googleClientId;

    if (typeof google !== 'undefined' && google?.accounts?.oauth2) {
      try {
        const client = google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: 'email profile openid',
          callback: (response: any) => {
            if (response && response.access_token) {
              fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${response.access_token}` }
              })
              .then(res => res.json())
              .then(user => {
                let catId: number | undefined = undefined;
                let catName: string | undefined = undefined;
                if (this.selectedRole === 'MERCHANT') {
                  const firstCat = this.categories()[0];
                  catId = firstCat?.id || 1;
                  catName = firstCat?.name || 'Electronics & Gadgets';
                }

                this.authService.handleSocialAuthRegister({
                  email: user.email,
                  username: user.name || user.email.split('@')[0],
                  role: this.selectedRole,
                  assignedCategoryId: catId,
                  assignedCategoryName: catName,
                  avatarUrl: user.picture
                });
              })
              .catch(() => {
                this.toast.error('Failed to retrieve Google profile for registration. Please try again.');
              });
            } else if (response?.error) {
              this.toast.warning('Google sign-up was cancelled.');
            }
          },
          error_callback: () => {
            this.toast.error('Google sign-up window could not be opened. Please check your popup blocker.');
          }
        });
        client.requestAccessToken();
        return;
      } catch (err) {
        this.toast.error('Google Sign-Up is currently unavailable. Please register using the form below.');
        return;
      }
    }

    this.toast.info('Google Sign-Up is initializing. Please complete the form below or try again.');
  }

  openGithubModal(): void {
    this.showGithubModal = true;
    if (this.githubUsername && !this.githubProfile) {
      this.fetchGithubProfile();
    }
  }

  closeGithubModal(): void {
    this.showGithubModal = false;
  }

  fetchGithubProfile(): void {
    const handle = this.githubUsername.trim();
    if (!handle) return;

    this.isFetchingGithub = true;
    fetch(`https://api.github.com/users/${encodeURIComponent(handle)}`)
      .then(res => {
        if (res.ok) return res.json();
        throw new Error('Profile not found');
      })
      .then(profile => {
        this.isFetchingGithub = false;
        this.githubProfile = profile;
        if (profile?.email && !this.githubEmail) {
          this.githubEmail = profile.email;
        }
      })
      .catch(() => {
        this.isFetchingGithub = false;
        this.githubProfile = {
          login: handle,
          name: handle,
          avatar_url: `https://avatars.githubusercontent.com/u/9919?v=4`,
          bio: 'Active GitHub Developer'
        };
      });
  }

  confirmGithubAuth(): void {
    const handle = this.githubUsername.trim() || 'Naveenkumar7125';
    const name = this.githubProfile?.name || handle;
    const email = this.githubEmail.trim() || this.githubProfile?.email || `${handle.toLowerCase()}@github.com`;
    const avatar = this.githubProfile?.avatar_url || `https://avatars.githubusercontent.com/u/9919?v=4`;

    let catId: number | undefined = undefined;
    let catName: string | undefined = undefined;
    if (this.selectedRole === 'MERCHANT') {
      const selectedId = this.githubAssignedCategoryId ? +this.githubAssignedCategoryId : (this.categories()[0]?.id || 1);
      const cat = this.categories().find(c => c.id === selectedId);
      catId = selectedId;
      catName = cat ? cat.name : 'Electronics & Gadgets';
    }

    this.closeGithubModal();
    this.authService.handleSocialAuthRegister({
      username: handle,
      email: email,
      role: this.selectedRole,
      assignedCategoryId: catId,
      assignedCategoryName: catName,
      avatarUrl: avatar
    });
  }

  quickGithubSignUp(): void {
    this.closeGithubModal();
    const randomId = Math.floor(Math.random() * 1000);

    let catId: number | undefined = undefined;
    let catName: string | undefined = undefined;
    if (this.selectedRole === 'MERCHANT') {
      const firstCat = this.categories()[0];
      catId = firstCat?.id || 1;
      catName = firstCat?.name || 'Electronics & Gadgets';
    }

    this.authService.handleSocialAuthRegister({
      email: `dev${randomId}@github.com`,
      username: `GithubDev${randomId}`,
      role: this.selectedRole,
      assignedCategoryId: catId,
      assignedCategoryName: catName
    });
  }
}
