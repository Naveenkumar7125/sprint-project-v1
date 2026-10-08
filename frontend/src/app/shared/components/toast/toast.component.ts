import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, ToastMessage } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container" *ngIf="toastService.toasts().length > 0">
      <div
        *ngFor="let toast of toastService.toasts()"
        class="toast-item"
        [ngClass]="'toast-' + toast.type"
        (click)="toastService.remove(toast.id)"
      >
        <div class="toast-icon">
          <i *ngIf="toast.type === 'success'" class="bi bi-check-circle-fill"></i>
          <i *ngIf="toast.type === 'error'" class="bi bi-x-circle-fill"></i>
          <span *ngIf="toast.type === 'warning'">!</span>
          <i *ngIf="toast.type === 'info'" class="bi bi-info-circle-fill"></i>
        </div>
        <div class="toast-content">
          <h5 *ngIf="toast.title" class="toast-title">{{ toast.title }}</h5>
          <p class="toast-message">{{ toast.message }}</p>
        </div>
        <button class="toast-close" (click)="toastService.remove(toast.id); $event.stopPropagation()">×</button>
      </div>
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      top: 1.5rem;
      right: 1.5rem;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      max-width: 400px;
      width: calc(100% - 3rem);
      pointer-events: none;
    }
    .toast-item {
      pointer-events: auto;
      display: flex;
      align-items: flex-start;
      gap: 0.85rem;
      padding: 1rem 1.25rem;
      border-radius: var(--radius-lg);
      background: #ffffff;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
      border-left: 5px solid;
      cursor: pointer;
      animation: slideIn 0.3s ease-out;
      transition: transform 0.2s, opacity 0.2s;
    }
    .toast-item:hover {
      transform: scale(1.02);
    }
    .toast-success { border-left-color: var(--success-solid); }
    .toast-error { border-left-color: var(--danger-solid); }
    .toast-warning { border-left-color: var(--warning-solid); }
    .toast-info { border-left-color: var(--info-solid); }

    .toast-icon {
      font-weight: 800;
      font-size: 1.1rem;
      line-height: 1;
      width: 26px;
      height: 26px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: var(--radius-full);
      flex-shrink: 0;
    }
    .toast-success .toast-icon { background: var(--success-bg); color: var(--success-text); }
    .toast-error .toast-icon { background: var(--danger-bg); color: var(--danger-text); }
    .toast-warning .toast-icon { background: var(--warning-bg); color: var(--warning-text); }
    .toast-info .toast-icon { background: var(--info-bg); color: var(--info-text); }

    .toast-content { flex: 1; min-width: 0; }
    .toast-title { font-size: 0.9rem; font-weight: 700; color: var(--text-primary); margin-bottom: 0.2rem; }
    .toast-message { font-size: 0.85rem; color: var(--text-secondary); word-break: break-word; }
    .toast-close {
      background: none;
      border: none;
      font-size: 1.35rem;
      line-height: 1;
      color: var(--text-muted);
      cursor: pointer;
      padding: 0;
    }
    .toast-close:hover { color: var(--text-primary); }

    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
  `]
})
export class ToastComponent {
  constructor(public toastService: ToastService) {}
}
