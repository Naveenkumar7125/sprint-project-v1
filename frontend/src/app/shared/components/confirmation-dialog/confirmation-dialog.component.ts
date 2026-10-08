import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogService } from '../../../core/services/dialog.service';

@Component({
  selector: 'app-confirmation-dialog',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-overlay" *ngIf="dialogService.dialogState().isOpen" (click)="onCancel()">
      <div class="modal-box animate-fade-in" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3 class="modal-title">{{ dialogService.dialogState().options.title }}</h3>
        </div>
        <div class="modal-body">
          <p class="modal-message">{{ dialogService.dialogState().options.message }}</p>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" (click)="onCancel()">
            {{ dialogService.dialogState().options.cancelText || 'Cancel' }}
          </button>
          <button
            class="btn"
            [ngClass]="dialogService.dialogState().options.type === 'danger' ? 'btn-danger' : 'btn-primary'"
            (click)="onConfirm()"
          >
            {{ dialogService.dialogState().options.confirmText || 'Confirm' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(15, 23, 42, 0.6);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 99999;
      padding: 1.5rem;
    }
    .modal-box {
      background: #ffffff;
      border-radius: var(--radius-xl);
      max-width: 480px;
      width: 100%;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      border: 1px solid var(--border-subtle);
      overflow: hidden;
    }
    .modal-header {
      padding: 1.5rem 1.5rem 1rem;
    }
    .modal-title {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--text-primary);
    }
    .modal-body {
      padding: 0 1.5rem 1.5rem;
    }
    .modal-message {
      font-size: 0.95rem;
      color: var(--text-secondary);
      line-height: 1.6;
    }
    .modal-footer {
      padding: 1rem 1.5rem;
      background: var(--bg-subtle);
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
    }
  `]
})
export class ConfirmationDialogComponent {
  constructor(public dialogService: DialogService) {}

  onConfirm(): void {
    this.dialogService.handleAction(true);
  }

  onCancel(): void {
    this.dialogService.handleAction(false);
  }
}
