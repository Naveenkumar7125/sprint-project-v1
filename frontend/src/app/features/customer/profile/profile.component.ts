import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProfileService } from '../../../core/services/profile.service';
import { AuthService } from '../../../core/auth/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { DialogService } from '../../../core/services/dialog.service';
import { UserProfileDto, AddressDto } from '../../../core/models/profile.models';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="profile-page container">
      <div class="profile-header">
        <h1>My Account & Preferences</h1>
        <p>Manage your personal profile, phone number, and delivery address book</p>
      </div>

      <div class="profile-layout">
        <!-- Personal Information Card -->
        <div class="card profile-card">
          <div class="card-header">
            <h3>Personal Profile</h3>
          </div>
          <div class="card-body">
            <form [formGroup]="profileForm" (ngSubmit)="onSaveProfile()">
              <div class="form-group">
                <label class="form-label">Username</label>
                <input type="text" [value]="authService.currentUser()?.username" class="form-control" disabled />
              </div>

              <div class="form-group">
                <label class="form-label">Email</label>
                <input type="text" [value]="authService.currentUser()?.email" class="form-control" disabled />
              </div>

              <div class="form-group">
                <label class="form-label" for="fullName">Full Name</label>
                <input id="fullName" type="text" formControlName="fullName" placeholder="e.g. John Doe" class="form-control" />
              </div>

              <div class="form-group">
                <label class="form-label" for="phoneNumber">Phone Number</label>
                <input id="phoneNumber" type="tel" formControlName="phoneNumber" placeholder="+91 9876543210" class="form-control" />
              </div>

              <div class="form-row-2">
                <div class="form-group">
                  <label class="form-label" for="gender">Gender</label>
                  <select id="gender" formControlName="gender" class="form-select">
                    <option value="">Select Gender</option>
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label" for="dateOfBirth">Date of Birth</label>
                  <input id="dateOfBirth" type="date" formControlName="dateOfBirth" class="form-control" />
                </div>
              </div>

              <button type="submit" class="btn btn-primary" [disabled]="profileForm.invalid || isSavingProfile">
                Save Profile Changes
              </button>
            </form>
          </div>
        </div>

        <!-- Address Book Card -->
        <div class="card addresses-card">
          <div class="card-header">
            <h3>Delivery Addresses</h3>
            <button class="btn btn-secondary btn-sm" (click)="openAddAddressForm()">
              <i class="bi bi-plus-lg me-1"></i> Add Address
            </button>
          </div>

          <div class="card-body">
            <!-- Add Address Form -->
            <form [formGroup]="addressForm" (ngSubmit)="onSaveAddress()" *ngIf="showAddressForm" class="addr-form animate-fade-in">
              <h4>{{ isEditingAddress ? 'Edit Address' : 'New Delivery Address' }}</h4>

              <div class="form-group">
                <label class="form-label">Street Address</label>
                <input type="text" formControlName="streetAddress" placeholder="Street / Flat / House No." class="form-control" />
              </div>

              <div class="form-row-2">
                <div class="form-group">
                  <label class="form-label">City</label>
                  <input type="text" formControlName="city" placeholder="City" class="form-control" />
                </div>
                <div class="form-group">
                  <label class="form-label">State</label>
                  <input type="text" formControlName="state" placeholder="State" class="form-control" />
                </div>
              </div>

              <div class="form-row-2">
                <div class="form-group">
                  <label class="form-label">Postal Code</label>
                  <input type="text" formControlName="postalCode" placeholder="PIN / Postal Code" class="form-control" />
                </div>
                <div class="form-group">
                  <label class="form-label">Country</label>
                  <input type="text" formControlName="country" placeholder="India" class="form-control" />
                </div>
              </div>

              <div class="form-actions">
                <button type="button" class="btn btn-secondary btn-sm" (click)="showAddressForm = false">Cancel</button>
                <button type="submit" class="btn btn-primary btn-sm" [disabled]="addressForm.invalid">Save Address</button>
              </div>
            </form>

            <!-- Address Cards List -->
            <div class="addresses-list" *ngIf="addresses().length > 0; else noAddrs">
              <div class="address-item" *ngFor="let addr of addresses()">
                <div class="addr-info">
                  <div class="addr-header-tags">
                    <span class="badge badge-primary">{{ addr.addressType || 'HOME' }}</span>
                    <span class="badge badge-success" *ngIf="addr.isDefault">Default</span>
                  </div>
                  <strong>{{ addr.streetAddress }}</strong>
                  <p>{{ addr.city }}, {{ addr.state }} - {{ addr.postalCode }}</p>
                  <small>{{ addr.country }}</small>
                </div>

                <div class="addr-actions">
                  <button
                    class="btn btn-outline btn-sm"
                    *ngIf="!addr.isDefault"
                    (click)="setDefault(addr.id!)"
                  >
                    Set Default
                  </button>
                  <button
                    class="btn btn-danger btn-sm"
                    (click)="deleteAddress(addr.id!)"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>

            <ng-template #noAddrs>
              <p class="text-muted" style="text-align: center; padding: 2rem 0;">No delivery addresses saved yet.</p>
            </ng-template>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .profile-page { padding: 2.5rem 1.25rem 5rem; }
    .profile-header { margin-bottom: 2rem; }
    .profile-header h1 { font-size: 2.2rem; font-weight: 800; }
    .profile-header p { color: var(--text-secondary); }

    .profile-layout {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 2rem;
      align-items: flex-start;
    }
    .form-row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }

    .addr-form {
      background: var(--bg-subtle);
      padding: 1.25rem;
      border-radius: var(--radius-lg);
      margin-bottom: 1.5rem;
      border: 1px solid var(--border-subtle);
    }
    .addr-form h4 { font-size: 1rem; margin-bottom: 1rem; }
    .form-actions { display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: 1rem; }

    .addresses-list { display: flex; flex-direction: column; gap: 1rem; }
    .address-item {
      padding: 1.25rem;
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-lg);
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .addr-info strong { font-size: 0.95rem; display: block; margin: 0.35rem 0 0.2rem; }
    .addr-info p { font-size: 0.85rem; margin: 0; }
    .addr-actions { display: flex; gap: 0.5rem; }

    @media (max-width: 850px) {
      .profile-layout { grid-template-columns: 1fr; }
    }
  `]
})
export class ProfileComponent implements OnInit {
  profile = signal<UserProfileDto | null>(null);
  addresses = signal<AddressDto[]>([]);

  profileForm!: FormGroup;
  addressForm!: FormGroup;

  isSavingProfile: boolean = false;
  showAddressForm: boolean = false;
  isEditingAddress: boolean = false;
  editingAddressId?: number;

  constructor(
    private profileService: ProfileService,
    public authService: AuthService,
    private toast: ToastService,
    private dialog: DialogService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.profileForm = this.fb.group({
      fullName: [''],
      phoneNumber: [''],
      dateOfBirth: [''],
      gender: ['']
    });

    this.addressForm = this.fb.group({
      streetAddress: ['', [Validators.required]],
      city: ['', [Validators.required]],
      state: ['', [Validators.required]],
      postalCode: ['', [Validators.required]],
      country: ['India', [Validators.required]],
      addressType: ['HOME']
    });

    this.loadProfile();
  }

  loadProfile(): void {
    this.profileService.getMyProfile().subscribe({
      next: (prof) => {
        this.profile.set(prof);
        this.profileForm.patchValue({
          fullName: prof.fullName || '',
          phoneNumber: prof.phoneNumber || '',
          dateOfBirth: prof.dateOfBirth || '',
          gender: prof.gender || ''
        });
        if (prof.addresses) {
          this.addresses.set(prof.addresses);
        }
      },
      error: () => {}
    });
  }

  onSaveProfile(): void {
    if (this.profileForm.invalid) return;
    this.isSavingProfile = true;

    this.profileService.updateProfile(this.profileForm.value).subscribe({
      next: () => {
        this.isSavingProfile = false;
        this.toast.success('Profile updated.');
      },
      error: () => {
        this.isSavingProfile = false;
      }
    });
  }

  openAddAddressForm(): void {
    this.isEditingAddress = false;
    this.addressForm.reset({ country: 'India', addressType: 'HOME' });
    this.showAddressForm = true;
  }

  onSaveAddress(): void {
    if (this.addressForm.invalid) return;

    this.profileService.addAddress(this.addressForm.value).subscribe({
      next: (newAddr) => {
        this.addresses.update(l => [...l, newAddr]);
        this.showAddressForm = false;
        this.toast.success('Address added.');
      },
      error: () => {}
    });
  }

  setDefault(id: number): void {
    this.profileService.setDefaultAddress(id).subscribe({
      next: () => {
        this.toast.success('Default address updated.');
        this.loadProfile();
      },
      error: () => {}
    });
  }

  async deleteAddress(id: number): Promise<void> {
    const confirmed = await this.dialog.confirm({
      title: 'Delete Address?',
      message: 'Are you sure you want to remove this delivery address?',
      confirmText: 'Delete Address',
      type: 'danger'
    });

    if (confirmed) {
      this.profileService.deleteAddress(id).subscribe({
        next: () => {
          this.addresses.update(l => l.filter(a => a.id !== id));
          this.toast.info('Address removed.');
        },
        error: () => {}
      });
    }
  }
}
