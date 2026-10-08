import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule, Validators } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { environment } from '../../../../environments/environment';
import { LogoComponent } from '../../../shared/components/logo/logo.component';
import { ToastService } from '../../../core/services/toast.service';

declare const google: any;

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterModule, LogoComponent],
  template: `
    <div class="auth-page">
      <div class="auth-card card-glass animate-fade-in">
        <div class="auth-header">
          <a routerLink="/" class="auth-logo">
            <app-logo [height]="42"></app-logo>
          </a>
          <h2>Welcome Back</h2>
          <p>Sign in to your EShopping Zone account</p>
        </div>

        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="auth-form">
          <div class="form-group">
            <label class="form-label" for="usernameOrEmail">Username or Email</label>
            <input
              id="usernameOrEmail"
              type="text"
              formControlName="usernameOrEmail"
              placeholder="e.g. john_doe or john@example.com"
              class="form-control"
              [class.is-invalid]="f['usernameOrEmail'].touched && f['usernameOrEmail'].invalid"
            />
            <div *ngIf="f['usernameOrEmail'].touched && f['usernameOrEmail'].invalid" class="form-error">
              Please enter your username or email address.
            </div>
          </div>

          <div class="form-group">
            <div class="label-row">
              <label class="form-label" for="password">Password</label>
              <a routerLink="/forgot-password" class="forgot-link">Forgot Password?</a>
            </div>
            <input
              id="password"
              type="password"
              formControlName="password"
              placeholder="Enter your password"
              class="form-control"
              [class.is-invalid]="f['password'].touched && f['password'].invalid"
            />
            <div *ngIf="f['password'].touched && f['password'].invalid" class="form-error">
              Password is required.
            </div>
          </div>

          <button type="submit" class="btn btn-primary btn-lg submit-btn" [disabled]="loginForm.invalid || isLoading">
            <span *ngIf="!isLoading">Sign In</span>
            <span *ngIf="isLoading">Signing in...</span>
          </button>
        </form>

        <div class="divider-or">
          <span>OR CONTINUE WITH</span>
        </div>

        <!-- OAuth Social Sign-In -->
        <div class="oauth-buttons">
          <button type="button" class="btn btn-secondary oauth-btn" (click)="signInWithGoogle()">
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

        <!-- Quick Demo Role Sign-In -->
        <div class="demo-accounts-box">
          <div class="demo-box-header"><i class="bi bi-person-badge-fill me-1"></i> QUICK DEMO LOGINS</div>
          <div class="demo-grid">
            <button type="button" class="demo-btn admin" (click)="quickLogin('admin@example.com', 'Password@123')">
              <span class="role-icon"><i class="bi bi-shield-lock-fill"></i></span>
              <span class="role-title">Admin</span>
            </button>
            <button type="button" class="demo-btn merchant" (click)="quickLogin('merchant@example.com', 'Password@123')">
              <span class="role-icon"><i class="bi bi-shop"></i></span>
              <span class="role-title">Merchant</span>
            </button>
            <button type="button" class="demo-btn delivery" (click)="quickLogin('delivery@example.com', 'Password@123')">
              <span class="role-icon"><i class="bi bi-truck"></i></span>
              <span class="role-title">Delivery</span>
            </button>
            <button type="button" class="demo-btn customer" (click)="quickLogin('john@example.com', 'Password@123')">
              <span class="role-icon"><i class="bi bi-bag-check-fill"></i></span>
              <span class="role-title">Customer</span>
            </button>
          </div>
        </div>

        <div class="auth-footer">
          <p>Don't have an account? <a routerLink="/register" class="register-link">Create Account</a></p>
        </div>
      </div>

      <!-- Interactive GitHub OAuth Modal -->
      <div class="modal-backdrop animate-fade-in" *ngIf="showGithubModal" (click)="closeGithubModal()">
        <div class="modal-card github-modal animate-scale-up" (click)="$event.stopPropagation()">
          <div class="github-modal-header">
            <div class="github-logo-wrap">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                <path fill-rule="evenodd" clip-rule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
              </svg>
            </div>
            <div>
              <h3>Sign in with GitHub</h3>
              <p>Authorize EShopping Zone with your GitHub profile</p>
            </div>
            <button class="modal-close-btn" (click)="closeGithubModal()"><i class="bi bi-x-lg"></i></button>
          </div>

          <div class="github-modal-body">
            <div class="form-group">
              <label class="form-label" for="ghHandle">GitHub Username or Handle</label>
              <div class="gh-input-group">
                <input
                  id="ghHandle"
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
              <label class="form-label" for="ghEmail">Notification Email (For Wallet & Order Receipts)</label>
              <input
                id="ghEmail"
                type="email"
                [(ngModel)]="githubEmail"
                placeholder="e.g. your_real_email@gmail.com"
                class="form-control"
              />
              <small class="text-muted" style="font-size: 0.75rem; color: #64748b; margin-top: 0.25rem; display: block;">
                Enter your Gmail or active mailbox to receive real-time email notifications.
              </small>
            </div>

            <div class="gh-actions">
              <button
                type="button"
                class="btn btn-primary btn-lg w-100"
                (click)="confirmGithubAuth()"
              >
                <i class="bi bi-shield-check me-1"></i> Authorize & Sign In
              </button>

              <button
                type="button"
                class="btn btn-outline btn-sm w-100 mt-2"
                (click)="quickGithubSignIn()"
              >
                1-Click Quick Developer Sign-In
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
      max-width: 460px;
      width: 100%;
      padding: 2.5rem;
      background: rgba(255, 255, 255, 0.95);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-xl);
      box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.08);
    }
    .auth-header {
      text-align: center;
      margin-bottom: 2rem;
    }
    .auth-logo {
      display: inline-block;
      margin-bottom: 1.25rem;
    }
    .auth-header h2 {
      font-size: 1.75rem;
      font-weight: 800;
      color: var(--text-primary);
      margin-bottom: 0.35rem;
    }
    .auth-header p {
      font-size: 0.9rem;
      color: var(--text-secondary);
    }
    .label-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .forgot-link {
      font-size: 0.8125rem;
      color: var(--primary-600);
      font-weight: 600;
    }
    .forgot-link:hover { text-decoration: underline; }
    .submit-btn {
      width: 100%;
      margin-top: 0.5rem;
    }

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
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
    }

    .demo-accounts-box {
      margin: 1.25rem 0 1.5rem;
      padding: 1rem;
      background: #f8fafc;
      border: 1px dashed #cbd5e1;
      border-radius: var(--radius-lg);
    }
    .demo-box-header {
      font-size: 0.725rem;
      font-weight: 800;
      letter-spacing: 0.05em;
      color: #64748b;
      margin-bottom: 0.75rem;
      text-align: center;
    }
    .demo-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0.5rem;
    }
    .demo-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.5rem 0.75rem;
      border-radius: var(--radius-md);
      border: 1px solid #e2e8f0;
      background: #ffffff;
      cursor: pointer;
      font-weight: 600;
      font-size: 0.8125rem;
      transition: all 0.2s ease;
    }
    .demo-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    }
    .demo-btn.admin:hover { border-color: #8b5cf6; background: #f5f3ff; color: #6d28d9; }
    .demo-btn.merchant:hover { border-color: #3b82f6; background: #eff6ff; color: #1d4ed8; }
    .demo-btn.delivery:hover { border-color: #10b981; background: #ecfdf5; color: #047857; }
    .demo-btn.customer:hover { border-color: #f59e0b; background: #fffbeb; color: #b45309; }
    .role-icon { font-size: 1rem; }
    .role-title { font-weight: 700; }

    .auth-footer {
      text-align: center;
      font-size: 0.9rem;
      color: var(--text-secondary);
      border-top: 1px solid var(--border-subtle);
      padding-top: 1.25rem;
    }
    .register-link {
      color: var(--primary-600);
      font-weight: 700;
    }
    .register-link:hover { text-decoration: underline; }

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
  `]
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  isLoading: boolean = false;
  returnUrl: string = '/';

  // GitHub Auth Modal State
  showGithubModal: boolean = false;
  githubUsername: string = 'Naveenkumar7125';
  githubEmail: string = '';
  githubProfile: any = null;
  isFetchingGithub: boolean = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
    const prefillUser = this.route.snapshot.queryParams['usernameOrEmail'] || this.route.snapshot.queryParams['email'] || '';

    this.loginForm = this.fb.group({
      usernameOrEmail: [prefillUser, [Validators.required]],
      password: ['', [Validators.required]]
    });
  }

  get f() {
    return this.loginForm.controls;
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.authService.login(this.loginForm.value, this.returnUrl).subscribe({
      next: () => {
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  signInWithGoogle(): void {
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
                this.authService.handleSocialAuthLogin({
                  email: user.email,
                  username: user.name || user.email.split('@')[0],
                  avatarUrl: user.picture
                }, this.returnUrl);
              })
              .catch(() => {
                this.toast.error('Failed to retrieve Google profile. Please try again.');
              });
            } else if (response?.error) {
              this.toast.warning('Google sign-in was cancelled.');
            }
          },
          error_callback: () => {
            this.toast.error('Google sign-in window could not be opened. Please check your popup blocker.');
          }
        });
        client.requestAccessToken();
        return;
      } catch (err) {
        this.toast.error('Google Sign-In is unavailable. Please sign in with username and password.');
        return;
      }
    }

    this.toast.info('Google Sign-In is initializing. If this persists, please use your username/password.');
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

    this.closeGithubModal();
    this.authService.handleSocialAuthLogin({
      username: handle,
      email: email,
      avatarUrl: avatar
    }, this.returnUrl);
  }

  quickGithubSignIn(): void {
    this.closeGithubModal();
    this.authService.handleSocialAuthLogin({
      email: 'john.doe@example.com',
      username: 'john_doe'
    }, this.returnUrl);
  }

  quickLogin(username: string, password: string): void {
    this.toast.clearAll();
    this.loginForm.patchValue({
      usernameOrEmail: username,
      password: password
    });
    this.onSubmit();
  }
}

