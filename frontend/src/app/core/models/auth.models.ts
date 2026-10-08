export type UserRole = 'CUSTOMER' | 'MERCHANT' | 'ADMIN' | 'DELIVERY_AGENT';
export type AccountStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'LOCKED' | 'DEACTIVATED' | 'PENDING_VERIFICATION';

export interface UserDto {
  id: number;
  username: string;
  email: string;
  role: UserRole;
  enabled: boolean;
  accountStatus: AccountStatus;
  assignedCategoryId?: number;
  assignedCategoryName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  userId: number;
  username: string;
  email: string;
  role: UserRole;
  assignedCategoryId?: number;
  assignedCategoryName?: string;
}

export interface LoginRequest {
  usernameOrEmail?: string;
  username?: string;
  email?: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  role: UserRole;
  assignedCategoryId?: number;
  assignedCategoryName?: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}
