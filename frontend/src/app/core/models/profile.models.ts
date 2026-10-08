export interface AddressDto {
  id?: number;
  profileId?: number;
  streetAddress: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  isDefault?: boolean;
  addressType?: string; // 'HOME' | 'WORK' | 'OTHER'
}

export interface UserProfileDto {
  id: number;
  userId: number;
  username: string;
  email: string;
  fullName?: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  gender?: string;
  addresses?: AddressDto[];
}

export interface UpdateProfileRequest {
  fullName: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  gender?: string;
}
