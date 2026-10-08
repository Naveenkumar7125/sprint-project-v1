import { Injectable, signal, computed } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { NotificationDto, SendNotificationRequest, NotificationStatus } from '../models/notification.models';
import { Page } from '../models/api-response.models';
import { ToastService } from './toast.service';
import { AuthService } from '../auth/auth.service';

const ALL_NOTIFICATIONS_KEY = 'esz_all_system_notifications';
const EMAILJS_CONFIG_KEY = 'esz_emailjs_config';

export interface EmailJsConfig {
  serviceId: string;
  templateId: string;
  publicKey: string;
  enabled: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private readonly baseUrl = `${environment.apiBaseUrl}/api/v1/notifications`;

  private notificationsSignal = signal<NotificationDto[]>([]);
  public notifications = this.notificationsSignal.asReadonly();

  public unreadCount = computed(() => {
    return this.notificationsSignal().filter(n => !n.read).length;
  });

  public selectedEmailPreview = signal<NotificationDto | null>(null);

  constructor(
    private http: HttpClient,
    private toast: ToastService,
    private authService: AuthService
  ) {
    this.refreshNotifications();
  }

  public getEmailJsConfig(): EmailJsConfig {
    try {
      const data = localStorage.getItem(EMAILJS_CONFIG_KEY);
      return data ? JSON.parse(data) : { serviceId: '', templateId: '', publicKey: '', enabled: false };
    } catch {
      return { serviceId: '', templateId: '', publicKey: '', enabled: false };
    }
  }

  public saveEmailJsConfig(config: EmailJsConfig): void {
    localStorage.setItem(EMAILJS_CONFIG_KEY, JSON.stringify(config));
    this.toast.success('Email delivery settings saved.');
  }

  private getUserKey(): string {
    const user = this.authService.currentUser();
    const identifier = user?.id ? String(user.id) : (user?.username ? user.username.toLowerCase() : 'anonymous');
    return `esz_notifications_${identifier}`;
  }

  private getStoredUserNotifications(): NotificationDto[] {
    try {
      const key = this.getUserKey();
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private saveStoredUserNotifications(list: NotificationDto[]): void {
    const key = this.getUserKey();
    localStorage.setItem(key, JSON.stringify(list));
    this.notificationsSignal.set(list);
  }

  private getStoredAllNotifications(): NotificationDto[] {
    try {
      const data = localStorage.getItem(ALL_NOTIFICATIONS_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private saveStoredAllNotifications(list: NotificationDto[]): void {
    localStorage.setItem(ALL_NOTIFICATIONS_KEY, JSON.stringify(list));
  }

  public refreshNotifications(): void {
    const userList = this.getStoredUserNotifications();
    this.notificationsSignal.set(userList);
  }

  getMyNotifications(page: number = 0, size: number = 10): Observable<Page<NotificationDto>> {
    this.refreshNotifications();
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', 'createdAt,desc');

    return this.http.get<Page<NotificationDto>>(`${this.baseUrl}/my-notifications`, { params }).pipe(
      tap(res => {
        if (res?.content && res.content.length > 0) {
          this.notificationsSignal.set(res.content);
        }
      }),
      catchError(() => {
        const localList = this.getStoredUserNotifications();
        return of(this.paginateNotifications(localList, page, size));
      })
    );
  }

  getAllNotifications(status?: NotificationStatus, page: number = 0, size: number = 10): Observable<Page<NotificationDto>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', 'createdAt,desc');

    if (status) {
      params = params.set('status', status);
    }

    return this.http.get<Page<NotificationDto>>(this.baseUrl, { params }).pipe(
      catchError(() => {
        let all = this.getStoredAllNotifications();
        if (status) {
          all = all.filter(n => n.status === status);
        }
        return of(this.paginateNotifications(all, page, size));
      })
    );
  }

  dispatchNotification(request: SendNotificationRequest, showEmailToast: boolean = false): NotificationDto {
    const newNotif: NotificationDto = {
      id: Date.now(),
      recipientEmail: request.recipientEmail,
      userId: request.userId || this.authService.currentUser()?.id || 1,
      subject: request.subject,
      message: request.message,
      type: request.type,
      channel: request.channel || 'EMAIL',
      status: 'SENT',
      read: false,
      createdAt: new Date().toISOString()
    };

    // Save to user storage
    const userKey = request.userId || this.authService.currentUser()?.id
      ? `esz_notifications_${request.userId || this.authService.currentUser()?.id}`
      : this.getUserKey();
    try {
      const existingUserData = localStorage.getItem(userKey);
      const userList: NotificationDto[] = existingUserData ? JSON.parse(existingUserData) : [];
      userList.unshift(newNotif);
      localStorage.setItem(userKey, JSON.stringify(userList));
      if (userKey === this.getUserKey()) {
        this.notificationsSignal.set(userList);
      }
    } catch {}

    // Save to system/admin storage
    const allList = this.getStoredAllNotifications();
    allList.unshift(newNotif);
    this.saveStoredAllNotifications(allList);

    // 1. Dispatch to Mail Relay Server (port 8090) & Backend Notification Microservice
    const backendPayload = {
      recipientEmail: request.recipientEmail,
      recipientUserId: request.userId || this.authService.currentUser()?.id || 1,
      subject: request.subject,
      content: request.message,
      channel: 'EMAIL'
    };

    // Primary: Direct to local Mail Relay Server (connected to Gmail SMTP)
    this.http.post<NotificationDto>('http://localhost:8090/api/v1/notifications/send', backendPayload).subscribe({
      next: () => {},
      error: () => {
        // Fallback: Backend Gateway
        this.http.post<NotificationDto>(`${this.baseUrl}/send`, backendPayload).subscribe({
          error: () => {}
        });
      }
    });

    // 2. Dispatch via EmailJS if configured
    const emailJs = this.getEmailJsConfig();
    const isRealEmail = request.recipientEmail &&
      request.recipientEmail.includes('@') &&
      !request.recipientEmail.endsWith('@example.com') &&
      !request.recipientEmail.endsWith('@github.com');

    if (emailJs.enabled && emailJs.serviceId && emailJs.templateId && emailJs.publicKey && isRealEmail) {
      try {
        fetch('https://api.emailjs.com/api/v1.0/email/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            service_id: emailJs.serviceId,
            template_id: emailJs.templateId,
            user_id: emailJs.publicKey,
            template_params: {
              to_email: request.recipientEmail,
              to_name: this.authService.currentUser()?.username || 'Shopper',
              subject: request.subject,
              message: request.message
            }
          })
        }).then(res => {
          if (res.ok) {
            this.toast.success(`Live Email delivered via EmailJS to ${request.recipientEmail}!`);
          }
        }).catch(() => {});
      } catch {}
    } else if (isRealEmail) {
      // 3. Fallback Web Relay
      try {
        fetch(`https://formsubmit.co/ajax/${encodeURIComponent(request.recipientEmail)}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            _subject: request.subject,
            name: 'EShopping Zone Automated Notification',
            message: request.message,
            _template: 'box'
          })
        }).catch(() => {});
      } catch {}
    }

    // 4. Notify user in application
    if (showEmailToast) {
      if (isRealEmail) {
        this.toast.success(`Email Dispatched to ${request.recipientEmail}: "${request.subject}"`);
      } else {
        this.toast.info(`In-App Notification Recorded for ${request.recipientEmail}`);
      }
    }

    return newNotif;
  }

  sendNotification(request: SendNotificationRequest): Observable<NotificationDto> {
    const notif = this.dispatchNotification(request, true);
    return of(notif);
  }

  markAsRead(id: number): void {
    const list = this.getStoredUserNotifications();
    const item = list.find(n => n.id === id);
    if (item) {
      item.read = true;
      this.saveStoredUserNotifications(list);
    }
  }

  markAllAsRead(): void {
    const list = this.getStoredUserNotifications();
    list.forEach(n => n.read = true);
    this.saveStoredUserNotifications(list);
  }

  previewEmail(notification: NotificationDto): void {
    this.selectedEmailPreview.set(notification);
    this.markAsRead(notification.id);
  }

  closeEmailPreview(): void {
    this.selectedEmailPreview.set(null);
  }

  private paginateNotifications(list: NotificationDto[], page: number, size: number): Page<NotificationDto> {
    const start = page * size;
    const content = list.slice(start, start + size);
    const totalElements = list.length;
    const totalPages = Math.ceil(totalElements / size);

    return {
      content,
      pageable: {
        pageNumber: page,
        pageSize: size,
        sort: { empty: true, sorted: false, unsorted: true },
        offset: start,
        paged: true,
        unpaged: false
      },
      totalPages,
      totalElements,
      last: page >= totalPages - 1,
      size,
      number: page,
      sort: { empty: true, sorted: false, unsorted: true },
      numberOfElements: content.length,
      first: page === 0,
      empty: content.length === 0
    };
  }
}
