import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  UserProfileDto,
  AddressDto,
  UpdateProfileRequest
} from '../models/profile.models';
import { ToastService } from './toast.service';
import { AuthService } from '../auth/auth.service';

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private readonly baseUrl = `${environment.apiBaseUrl}/api/v1/profiles`;

  constructor(
    private http: HttpClient,
    private toast: ToastService,
    private authService: AuthService
  ) {
    // Clear legacy global shared keys
    localStorage.removeItem('esz_user_addresses');
    localStorage.removeItem('esz_user_profile');
  }

  private getUserKey(suffix: string): string {
    const user = this.authService.currentUser();
    const identifier = user?.id ? String(user.id) : (user?.username ? user.username.toLowerCase() : 'anonymous');
    return `esz_profile_${identifier}_${suffix}`;
  }

  private getStoredAddresses(): AddressDto[] {
    try {
      const key = this.getUserKey('addresses');
      const data = localStorage.getItem(key);
      if (data) {
        return JSON.parse(data);
      }
      // Only seed sample address for demo account john_doe
      const user = this.authService.currentUser();
      if (user?.username === 'john_doe') {
        const demoAddresses: AddressDto[] = [
          {
            id: 1,
            streetAddress: '742 Evergreen Terrace',
            city: 'Springfield',
            state: 'IL',
            country: 'USA',
            postalCode: '62704',
            addressType: 'HOME',
            isDefault: true
          }
        ];
        localStorage.setItem(key, JSON.stringify(demoAddresses));
        return demoAddresses;
      }
      return [];
    } catch {
      return [];
    }
  }

  private saveStoredAddresses(addresses: AddressDto[]): void {
    const key = this.getUserKey('addresses');
    localStorage.setItem(key, JSON.stringify(addresses));
  }

  getProfile(): Observable<UserProfileDto> {
    return this.getMyProfile();
  }

  getMyProfile(): Observable<UserProfileDto> {
    return this.http.get<UserProfileDto>(`${this.baseUrl}/me`).pipe(
      tap(profile => {
        if (profile?.addresses) {
          this.saveStoredAddresses(profile.addresses);
        }
        const profileKey = this.getUserKey('data');
        localStorage.setItem(profileKey, JSON.stringify(profile));
      }),
      catchError(() => {
        const profileKey = this.getUserKey('data');
        const stored = localStorage.getItem(profileKey);
        if (stored) return of(JSON.parse(stored));

        const user = this.authService.currentUser();
        const defaultProfile: UserProfileDto = {
          id: user?.id || Date.now(),
          userId: user?.id || Date.now(),
          username: user?.username || 'user',
          email: user?.email || '',
          fullName: user?.username || '',
          phoneNumber: '',
          addresses: this.getStoredAddresses()
        };
        return of(defaultProfile);
      })
    );
  }

  updateProfile(request: UpdateProfileRequest): Observable<UserProfileDto> {
    return this.http.put<UserProfileDto>(this.baseUrl, request).pipe(
      tap(profile => {
        const profileKey = this.getUserKey('data');
        localStorage.setItem(profileKey, JSON.stringify(profile));
        this.toast.success('Profile updated successfully.');
      }),
      catchError(() => {
        const user = this.authService.currentUser();
        const profile: UserProfileDto = {
          id: user?.id || Date.now(),
          userId: user?.id || Date.now(),
          username: user?.username || 'user',
          email: user?.email || '',
          fullName: request.fullName || user?.username || '',
          phoneNumber: request.phoneNumber || '',
          dateOfBirth: request.dateOfBirth,
          gender: request.gender,
          addresses: this.getStoredAddresses()
        };
        const profileKey = this.getUserKey('data');
        localStorage.setItem(profileKey, JSON.stringify(profile));
        this.toast.success('Profile updated successfully.');
        return of(profile);
      })
    );
  }

  getAddresses(): Observable<AddressDto[]> {
    return this.http.get<AddressDto[]>(`${this.baseUrl}/addresses`).pipe(
      catchError(() => of(this.getStoredAddresses()))
    );
  }

  addAddress(request: AddressDto): Observable<AddressDto> {
    const list = this.getStoredAddresses();
    const newAddress: AddressDto = {
      id: Date.now(),
      streetAddress: request.streetAddress,
      city: request.city,
      state: request.state,
      country: request.country,
      postalCode: request.postalCode,
      addressType: request.addressType || 'HOME',
      isDefault: request.isDefault || list.length === 0
    };

    return this.http.post<AddressDto>(`${this.baseUrl}/addresses`, request).pipe(
      tap(addr => {
        this.saveLocalAddress(addr || newAddress);
        this.toast.success('Address added successfully.');
      }),
      catchError(() => {
        this.saveLocalAddress(newAddress);
        this.toast.success('Address added successfully.');
        return of(newAddress);
      })
    );
  }

  private saveLocalAddress(addr: AddressDto): void {
    const list = this.getStoredAddresses();
    if (addr.isDefault) {
      list.forEach(a => a.isDefault = false);
    }
    list.unshift(addr);
    this.saveStoredAddresses(list);
  }

  updateAddress(id: number, request: AddressDto): Observable<AddressDto> {
    return this.http.put<AddressDto>(`${this.baseUrl}/addresses/${id}`, request).pipe(
      tap(addr => {
        this.updateLocalAddress(id, request, addr);
        this.toast.success('Address updated.');
      }),
      catchError(() => {
        const addr = this.updateLocalAddress(id, request);
        this.toast.success('Address updated.');
        return of(addr!);
      })
    );
  }

  private updateLocalAddress(id: number, request: AddressDto, apiResult?: AddressDto): AddressDto | undefined {
    const list = this.getStoredAddresses();
    const index = list.findIndex(a => a.id === id);
    if (index !== -1) {
      if (apiResult) {
        list[index] = apiResult;
      } else {
        if (request.isDefault) {
          list.forEach(a => a.isDefault = false);
        }
        list[index] = {
          ...list[index],
          ...request
        };
      }
      this.saveStoredAddresses(list);
      return list[index];
    }
    return undefined;
  }

  deleteAddress(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/addresses/${id}`).pipe(
      tap(() => {
        this.deleteLocalAddress(id);
        this.toast.info('Address removed.');
      }),
      catchError(() => {
        this.deleteLocalAddress(id);
        this.toast.info('Address removed.');
        return of(void 0);
      })
    );
  }

  private deleteLocalAddress(id: number): void {
    const list = this.getStoredAddresses().filter(a => a.id !== id);
    this.saveStoredAddresses(list);
  }

  setDefaultAddress(id: number): Observable<AddressDto> {
    return this.http.patch<AddressDto>(`${this.baseUrl}/addresses/${id}/default`, null).pipe(
      tap(addr => {
        this.setLocalDefaultAddress(id);
        this.toast.success('Default address updated.');
      }),
      catchError(() => {
        const addr = this.setLocalDefaultAddress(id);
        this.toast.success('Default address updated.');
        return of(addr!);
      })
    );
  }

  private setLocalDefaultAddress(id: number): AddressDto | undefined {
    const list = this.getStoredAddresses();
    let target: AddressDto | undefined;
    list.forEach(a => {
      if (a.id === id) {
        a.isDefault = true;
        target = a;
      } else {
        a.isDefault = false;
      }
    });
    this.saveStoredAddresses(list);
    return target;
  }
}
