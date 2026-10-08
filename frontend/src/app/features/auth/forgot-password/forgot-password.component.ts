import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { LogoComponent } from '../../../shared/components/logo/logo.component';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, LogoComponent],
  template: `
    <div class="auth-page">
      <div class="auth-card card-glass animate-fade-in">
        <div class="auth-header">
          <a routerLink="/" class="auth-logo">
            <app-logo [height]="42"></app-logo>
          </a>
          <h2>Reset Password</h2>
          <p>Enter your email and we'll send a password recovery token</p>
        </div>

        <form [formGroup]="forgotForm" (ngSubmit)="onSubmit()" class="auth-form" *ngIf="!submitted">
          <div class="form-group">
            <label class="form-label" for="email">Account Email</label>
            <input
              id="email"
              type="email"
              formControlName="email"
              placeholder="e.g. yourname@example.com"
              class="form-control"
              [class.is-invalid]="f['email'].touched && f['email'].invalid"
            />
            <div *ngIf="f['email'].touched && f['email'].invalid" class="form-error">
              Please provide a valid registered email address.
            </div>
          </div>

          <button type="submit" class="btn btn-primary btn-lg submit-btn" [disabled]="forgotForm.invalid || isLoading">
            <span *ngIf="!isLoading">Send Recovery Instructions</span>
            <span *ngIf="isLoading">Sending...</span>
          </button>
        </form>

        <div class="success-box" *ngIf="submitted">
          <div class="success-icon"><i class="bi bi-envelope-check-fill"></i></div>
          <h3>Check your inbox</h3>
          <p>If an account is associated with <strong>{{ forgotForm.value.email }}</strong>, you will receive password reset instructions.</p>
          <a routerLink="/reset-password" class="btn btn-accent btn-sm" style="margin-top: 1rem;">
            Have a Reset Token? Click Here
          </a>
        </div>

        <div class="auth-footer">
          <p>Remember your password? <a routerLink="/login" class="login-link">Back to Sign In</a></p>
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
    .success-box {
      text-align: center;
      padding: 1.5rem;
      background: var(--success-bg);
      border: 1px solid var(--success-border);
      border-radius: var(--radius-lg);
      margin-bottom: 1.5rem;
    }
    .success-icon { font-size: 2.5rem; margin-bottom: 0.5rem; }
    .success-box h3 { color: var(--success-text); font-size: 1.15rem; margin-bottom: 0.5rem; }
    .success-box p { color: var(--success-text); font-size: 0.875rem; }

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
export class ForgotPasswordComponent implements OnInit {
  forgotForm!: FormGroup;
  isLoading: boolean = false;
  submitted: boolean = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.forgotForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  get f() {
    return this.forgotForm.controls;
  }

  onSubmit(): void {
    if (this.forgotForm.invalid) {
      this.forgotForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.authService.forgotPassword(this.forgotForm.value).subscribe({
      next: () => {
        this.isLoading = false;
        this.submitted = true;
      },
      error: () => {
        this.isLoading = false;
        this.submitted = true;
      }
    });
  }
}
