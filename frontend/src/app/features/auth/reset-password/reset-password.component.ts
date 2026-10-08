import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { LogoComponent } from '../../../shared/components/logo/logo.component';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, LogoComponent],
  template: `
    <div class="auth-page">
      <div class="auth-card card-glass animate-fade-in">
        <div class="auth-header">
          <a routerLink="/" class="auth-logo">
            <app-logo [height]="42"></app-logo>
          </a>
          <h2>Set New Password</h2>
          <p>Enter your password reset token and choose a new secure password</p>
        </div>

        <form [formGroup]="resetForm" (ngSubmit)="onSubmit()" class="auth-form">
          <div class="form-group">
            <label class="form-label" for="token">Reset Token</label>
            <input
              id="token"
              type="text"
              formControlName="token"
              placeholder="Paste token from email or logs"
              class="form-control"
              [class.is-invalid]="f['token'].touched && f['token'].invalid"
            />
            <div *ngIf="f['token'].touched && f['token'].invalid" class="form-error">
              Reset token is required.
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="newPassword">New Password</label>
            <input
              id="newPassword"
              type="password"
              formControlName="newPassword"
              placeholder="At least 8 chars with upper, lower, digit, symbol"
              class="form-control"
              [class.is-invalid]="f['newPassword'].touched && f['newPassword'].invalid"
            />
            <div *ngIf="f['newPassword'].touched && f['newPassword'].invalid" class="form-error">
              Password must be 8+ characters and contain uppercase, lowercase, digit, and symbol.
            </div>
          </div>

          <button type="submit" class="btn btn-primary btn-lg submit-btn" [disabled]="resetForm.invalid || isLoading">
            <span *ngIf="!isLoading">Confirm & Update Password</span>
            <span *ngIf="isLoading">Updating password...</span>
          </button>
        </form>

        <div class="auth-footer">
          <p>Back to <a routerLink="/login" class="login-link">Sign In</a></p>
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
    .auth-header { text-align: center; margin-bottom: 2rem; }
    .auth-logo { display: inline-block; margin-bottom: 1rem; }
    .auth-header h2 { font-size: 1.75rem; font-weight: 800; color: var(--text-primary); margin-bottom: 0.25rem; }
    .auth-header p { font-size: 0.9rem; color: var(--text-secondary); }

    .submit-btn { width: 100%; margin-top: 0.5rem; }
    .auth-footer {
      text-align: center;
      font-size: 0.9rem;
      color: var(--text-secondary);
      border-top: 1px solid var(--border-subtle);
      padding-top: 1.25rem;
      margin-top: 1.5rem;
    }
    .login-link { color: var(--primary-600); font-weight: 700; }
  `]
})
export class ResetPasswordComponent implements OnInit {
  resetForm!: FormGroup;
  isLoading: boolean = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    const tokenFromUrl = this.route.snapshot.queryParams['token'] || '';
    const passwordPattern = '^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=!]).*$';

    this.resetForm = this.fb.group({
      token: [tokenFromUrl, [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(8), Validators.pattern(passwordPattern)]]
    });
  }

  get f() {
    return this.resetForm.controls;
  }

  onSubmit(): void {
    if (this.resetForm.invalid) {
      this.resetForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.authService.resetPassword(this.resetForm.value).subscribe({
      next: () => {
        this.isLoading = false;
        this.router.navigate(['/login']);
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }
}
