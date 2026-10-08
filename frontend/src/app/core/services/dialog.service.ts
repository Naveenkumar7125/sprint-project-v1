import { Injectable, signal } from '@angular/core';

export interface ConfirmDialogOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

@Injectable({
  providedIn: 'root'
})
export class DialogService {
  private dialogStateSignal = signal<{
    isOpen: boolean;
    options: ConfirmDialogOptions;
    resolve?: (result: boolean) => void;
  }>({
    isOpen: false,
    options: { title: '', message: '' }
  });

  public dialogState = this.dialogStateSignal.asReadonly();

  confirm(options: ConfirmDialogOptions): Promise<boolean> {
    return new Promise((resolve) => {
      this.dialogStateSignal.set({
        isOpen: true,
        options: {
          confirmText: 'Confirm',
          cancelText: 'Cancel',
          type: 'danger',
          ...options
        },
        resolve
      });
    });
  }

  handleAction(confirmed: boolean): void {
    const current = this.dialogStateSignal();
    if (current.resolve) {
      current.resolve(confirmed);
    }
    this.dialogStateSignal.set({
      isOpen: false,
      options: { title: '', message: '' }
    });
  }
}
