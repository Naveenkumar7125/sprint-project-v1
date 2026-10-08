import { Injectable, signal } from '@angular/core';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  durationMs?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private toastsSignal = signal<ToastMessage[]>([]);
  public toasts = this.toastsSignal.asReadonly();

  show(type: 'success' | 'error' | 'warning' | 'info', message: string, title?: string, durationMs: number = 4000): void {
    if (!message) return;
    
    // Avoid duplicate message spam
    const existing = this.toastsSignal().find(t => t.message === message);
    if (existing) {
      return;
    }

    const id = Math.random().toString(36).substring(2, 9);
    const toast: ToastMessage = { id, type, title, message, durationMs };

    // Keep at most 2 active toasts at a time
    this.toastsSignal.update(toasts => {
      const current = toasts.length >= 2 ? toasts.slice(toasts.length - 1) : toasts;
      return [...current, toast];
    });

    if (durationMs > 0) {
      setTimeout(() => {
        this.remove(id);
      }, durationMs);
    }
  }

  success(message: string, title: string = 'Success'): void {
    this.show('success', message, title);
  }

  error(message: string, title: string = 'Error'): void {
    this.show('error', message, title, 5000);
  }

  warning(message: string, title: string = 'Warning'): void {
    this.show('warning', message, title);
  }

  info(message: string, title: string = 'Information'): void {
    this.show('info', message, title);
  }

  clearAll(): void {
    this.toastsSignal.set([]);
  }

  remove(id: string): void {
    this.toastsSignal.update(toasts => toasts.filter(t => t.id !== id));
  }
}
