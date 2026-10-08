export type NotificationStatus = 'SENT' | 'FAILED' | 'PENDING';
export type NotificationChannel = 'EMAIL' | 'SMS' | 'PUSH' | 'IN_APP';

export interface NotificationDto {
  id: number;
  recipientEmail: string;
  userId?: number;
  subject: string;
  message: string;
  type: string;
  channel?: NotificationChannel;
  status: NotificationStatus;
  read?: boolean;
  createdAt: string;
}

export interface SendNotificationRequest {
  recipientEmail: string;
  userId?: number;
  subject: string;
  message: string;
  type: string;
  channel?: NotificationChannel;
}
