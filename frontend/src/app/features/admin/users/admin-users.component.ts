import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { of } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';
import { ProductService } from '../../../core/services/product.service';
import { ToastService } from '../../../core/services/toast.service';
import { DialogService } from '../../../core/services/dialog.service';
import { UserDto, UserRole, AccountStatus } from '../../../core/models/auth.models';
import { CategoryDto } from '../../../core/models/product.models';
import { SEED_CATEGORIES } from '../../../core/mocks/seed-products.data';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, StatusBadgeComponent],
  template: `
    <div class="admin-users-page">
      <!-- Page Header -->
      <div class="page-top">
        <div>
          <h2>User Accounts Directory</h2>
          <p>Supervise registered Customers, Merchants, Admins, and Delivery Courier Partners</p>
        </div>
        <div class="header-actions">
          <button class="btn btn-secondary" (click)="loadUsers()" [disabled]="isLoading()">
            <svg *ngIf="!isLoading()" class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
            <span *ngIf="isLoading()" class="spinner-small"></span>
            Refresh
          </button>
          <button class="btn btn-primary" (click)="openCreateUserModal()">
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
            Add New User
          </button>
        </div>
      </div>

      <!-- Quick Metrics Ribbon -->
      <div class="stats-grid">
        <div class="stat-card" (click)="setRoleFilter('ALL')" [class.active-stat]="selectedRole() === 'ALL'">
          <div class="stat-icon total-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          </div>
          <div class="stat-info">
            <span class="stat-label">Total Users</span>
            <span class="stat-value">{{ users().length }}</span>
          </div>
        </div>

        <div class="stat-card" (click)="setRoleFilter('CUSTOMER')" [class.active-stat]="selectedRole() === 'CUSTOMER'">
          <div class="stat-icon customer-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          </div>
          <div class="stat-info">
            <span class="stat-label">Customers</span>
            <span class="stat-value">{{ customerCount() }}</span>
          </div>
        </div>

        <div class="stat-card" (click)="setRoleFilter('MERCHANT')" [class.active-stat]="selectedRole() === 'MERCHANT'">
          <div class="stat-icon merchant-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
          </div>
          <div class="stat-info">
            <span class="stat-label">Merchants</span>
            <span class="stat-value">{{ merchantCount() }}</span>
          </div>
        </div>

        <div class="stat-card" (click)="setRoleFilter('DELIVERY_AGENT')" [class.active-stat]="selectedRole() === 'DELIVERY_AGENT'">
          <div class="stat-icon agent-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
          </div>
          <div class="stat-info">
            <span class="stat-label">Delivery Agents</span>
            <span class="stat-value">{{ agentCount() }}</span>
          </div>
        </div>

        <div class="stat-card" (click)="setRoleFilter('ADMIN')" [class.active-stat]="selectedRole() === 'ADMIN'">
          <div class="stat-icon admin-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          </div>
          <div class="stat-info">
            <span class="stat-label">Administrators</span>
            <span class="stat-value">{{ adminCount() }}</span>
          </div>
        </div>
      </div>

      <!-- Filters and Search Bar -->
      <div class="filters-card">
        <div class="search-box">
          <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input
            type="text"
            placeholder="Search by username, email, ID..."
            [ngModel]="searchQuery()"
            (ngModelChange)="searchQuery.set($event)"
          />
          <button *ngIf="searchQuery()" class="clear-btn" (click)="searchQuery.set('')"><i class="bi bi-x"></i></button>
        </div>

        <div class="filter-group">
          <label>Role:</label>
          <select [ngModel]="selectedRole()" (ngModelChange)="selectedRole.set($event)">
            <option value="ALL">All Roles</option>
            <option value="CUSTOMER">Customer</option>
            <option value="MERCHANT">Merchant</option>
            <option value="DELIVERY_AGENT">Delivery Agent</option>
            <option value="ADMIN">Admin</option>
          </select>
        </div>

        <div class="filter-group">
          <label>Status:</label>
          <select [ngModel]="selectedStatus()" (ngModelChange)="selectedStatus.set($event)">
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="DEACTIVATED">Deactivated</option>
            <option value="PENDING_VERIFICATION">Pending</option>
          </select>
        </div>

        <div class="filter-group">
          <label>Merchant Domain:</label>
          <select [ngModel]="selectedCategoryFilter()" (ngModelChange)="selectedCategoryFilter.set($event)">
            <option value="ALL">All Categories</option>
            <option *ngFor="let cat of categories()" [value]="cat.name">{{ cat.name }}</option>
          </select>
        </div>

        <div class="filter-info">
          Showing <strong>{{ filteredUsers().length }}</strong> of <strong>{{ users().length }}</strong> users
        </div>
      </div>

      <!-- Users Table Card -->
      <div class="card table-card">
        <div class="table-responsive">
          <table class="table" *ngIf="filteredUsers().length > 0; else noUsers">
            <thead>
              <tr>
                <th>User ID</th>
                <th>User & Contact</th>
                <th>Assigned Role</th>
                <th>Merchant Domain Category</th>
                <th>Account Status</th>
                <th>Enabled</th>
                <th>Registered Date</th>
                <th class="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let u of filteredUsers()">
                <td>
                  <code class="user-id">#{{ u.id }}</code>
                </td>

                <td>
                  <div class="user-profile-cell">
                    <div class="avatar" [ngClass]="getAvatarColorClass(u.role)">
                      {{ getInitials(u.username) }}
                    </div>
                    <div class="user-meta">
                      <strong class="username">{{ u.username }}</strong>
                      <span class="email">{{ u.email }}</span>
                    </div>
                  </div>
                </td>

                <td>
                  <div class="role-selector-wrapper">
                    <select
                      class="role-dropdown"
                      [ngModel]="u.role"
                      (ngModelChange)="onRoleChange(u, $event)"
                      [title]="'Change role for ' + u.username"
                    >
                      <option value="CUSTOMER">Customer</option>
                      <option value="MERCHANT">Merchant</option>
                      <option value="DELIVERY_AGENT">Delivery Agent</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </div>
                </td>

                <td>
                  <ng-container *ngIf="u.role === 'MERCHANT'; else notMerchantDomain">
                    <span *ngIf="u.assignedCategoryName" class="merchant-domain-badge" (click)="openEditModal(u)" title="Click to change merchant category">
                      <i class="bi bi-tag me-1"></i> {{ u.assignedCategoryName }}
                    </span>
                    <span *ngIf="!u.assignedCategoryName" class="merchant-domain-unassigned" (click)="openEditModal(u)" title="Click to assign category">
                      <span class="text-muted"><i class="bi bi-dash"></i> Unassigned</span>
                    </span>
                  </ng-container>
                  <ng-template #notMerchantDomain>
                    <span class="text-muted" style="font-size: 0.8rem; color: #94a3b8;">— Platform</span>
                  </ng-template>
                </td>

                <td>
                  <select
                    class="status-dropdown"
                    [ngModel]="u.accountStatus || 'ACTIVE'"
                    (ngModelChange)="onStatusChange(u, $event)"
                    [ngClass]="'status-' + (u.accountStatus || 'ACTIVE').toLowerCase()"
                  >
                    <option value="ACTIVE">● Active</option>
                    <option value="SUSPENDED">● Suspended</option>
                    <option value="DEACTIVATED">● Deactivated</option>
                    <option value="PENDING_VERIFICATION">● Pending</option>
                  </select>
                </td>

                <td>
                  <label class="switch-toggle" [title]="u.enabled ? 'Click to disable user' : 'Click to enable user'">
                    <input
                      type="checkbox"
                      [checked]="u.enabled"
                      (change)="toggleUserEnabled(u)"
                    />
                    <span class="slider"></span>
                  </label>
                  <span class="toggle-label" [class.text-active]="u.enabled">
                    {{ u.enabled ? 'Enabled' : 'Disabled' }}
                  </span>
                </td>

                <td>
                  <span class="date-text">
                    {{ formatDate(u.createdAt) }}
                  </span>
                </td>

                <td class="text-right">
                  <div class="action-buttons">
                    <button
                      class="btn-icon"
                      title="Edit User & Assigned Category"
                      (click)="openEditModal(u)"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button
                      class="btn-icon btn-danger-icon"
                      title="Delete User"
                      (click)="deleteUser(u)"
                      [disabled]="isCurrentUser(u)"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          <ng-template #noUsers>
            <div class="empty-state">
              <div class="empty-icon"><i class="bi bi-people"></i></div>
              <h3>No users found</h3>
              <p *ngIf="searchQuery() || selectedRole() !== 'ALL' || selectedStatus() !== 'ALL' || selectedCategoryFilter() !== 'ALL'">
                No user accounts match your current filters. Try resetting search or filter criteria.
              </p>
              <p *ngIf="!searchQuery() && selectedRole() === 'ALL' && selectedStatus() === 'ALL' && selectedCategoryFilter() === 'ALL'">
                No user accounts are registered yet in the system.
              </p>
              <button class="btn btn-secondary mt-3" (click)="resetFilters()">Reset Filters</button>
            </div>
          </ng-template>
        </div>
      </div>

      <!-- Create User Modal -->
      <div class="modal-backdrop" *ngIf="showCreateModal()">
        <div class="modal-dialog">
          <div class="modal-header">
            <h3>Add New User Account</h3>
            <button class="close-btn" (click)="showCreateModal.set(false)"><i class="bi bi-x-lg"></i></button>
          </div>
          <form [formGroup]="createUserForm" (ngSubmit)="submitCreateUser()">
            <div class="modal-body">
              <div class="form-group">
                <label>Username <span class="required">*</span></label>
                <input
                  type="text"
                  formControlName="username"
                  class="form-control"
                  placeholder="e.g. alex_rivera"
                />
                <div *ngIf="createUserForm.get('username')?.touched && createUserForm.get('username')?.invalid" class="field-error">
                  Username is required (min 3 chars).
                </div>
              </div>

              <div class="form-group">
                <label>Email Address <span class="required">*</span></label>
                <input
                  type="email"
                  formControlName="email"
                  class="form-control"
                  placeholder="e.g. alex@example.com"
                />
                <div *ngIf="createUserForm.get('email')?.touched && createUserForm.get('email')?.invalid" class="field-error">
                  A valid email address is required.
                </div>
              </div>

              <div class="form-group">
                <label>Password <span class="required">*</span></label>
                <input
                  type="password"
                  formControlName="password"
                  class="form-control"
                  placeholder="Minimum 6 characters"
                />
                <div *ngIf="createUserForm.get('password')?.touched && createUserForm.get('password')?.invalid" class="field-error">
                  Password is required (min 6 chars).
                </div>
              </div>

              <div class="form-group">
                <label>Account Role <span class="required">*</span></label>
                <select formControlName="role" class="form-control">
                  <option value="CUSTOMER">Customer (Shopper)</option>
                  <option value="MERCHANT">Merchant (Seller)</option>
                  <option value="DELIVERY_AGENT">Delivery Agent (Courier)</option>
                  <option value="ADMIN">System Administrator</option>
                </select>
              </div>

              <!-- Merchant Category Selection in Create Modal -->
              <div class="form-group" *ngIf="createUserForm.get('role')?.value === 'MERCHANT'">
                <label>Merchant Assigned Domain Category <span class="required">*</span></label>
                <select formControlName="assignedCategoryId" class="form-control">
                  <option value="">Select category specialization...</option>
                  <option *ngFor="let cat of categories()" [value]="cat.id">{{ cat.name }}</option>
                </select>
                <small class="text-muted" style="font-size: 0.75rem;">Merchants can only catalog products under this assigned category.</small>
              </div>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="showCreateModal.set(false)">Cancel</button>
              <button type="submit" class="btn btn-primary" [disabled]="createUserForm.invalid || isSubmitting()">
                <span *ngIf="isSubmitting()" class="spinner-small"></span>
                Create User
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Edit User Modal -->
      <div class="modal-backdrop" *ngIf="showEditModal() && selectedUser()">
        <div class="modal-dialog">
          <div class="modal-header">
            <h3>Edit User: {{ selectedUser()?.username }}</h3>
            <button class="close-btn" (click)="showEditModal.set(false)"><i class="bi bi-x-lg"></i></button>
          </div>
          <form [formGroup]="editUserForm" (ngSubmit)="submitEditUser()">
            <div class="modal-body">
              <div class="user-summary-card">
                <div class="avatar" [ngClass]="getAvatarColorClass(selectedUser()?.role || 'CUSTOMER')">
                  {{ getInitials(selectedUser()?.username || 'U') }}
                </div>
                <div>
                  <strong>{{ selectedUser()?.username }}</strong>
                  <p class="text-muted">{{ selectedUser()?.email }}</p>
                  <small>User ID: #{{ selectedUser()?.id }}</small>
                </div>
              </div>

              <div class="form-group mt-3">
                <label>Assigned Role</label>
                <select formControlName="role" class="form-control">
                  <option value="CUSTOMER">CUSTOMER</option>
                  <option value="MERCHANT">MERCHANT</option>
                  <option value="DELIVERY_AGENT">DELIVERY_AGENT</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>

              <!-- Merchant Category Assignment in Edit Modal -->
              <div class="form-group" *ngIf="editUserForm.get('role')?.value === 'MERCHANT'">
                <label>Merchant Assigned Domain Category <span class="required">*</span></label>
                <select formControlName="assignedCategoryId" class="form-control">
                  <option value="">Select category specialization...</option>
                  <option *ngFor="let cat of categories()" [value]="cat.id">{{ cat.name }}</option>
                </select>
                <small class="text-muted" style="font-size: 0.75rem;">Determines which category this merchant has exclusive product publishing rights for.</small>
              </div>

              <div class="form-group">
                <label>Account Status</label>
                <select formControlName="accountStatus" class="form-control">
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="SUSPENDED">SUSPENDED</option>
                  <option value="DEACTIVATED">DEACTIVATED</option>
                  <option value="PENDING_VERIFICATION">PENDING_VERIFICATION</option>
                </select>
              </div>

              <div class="form-group checkbox-group">
                <label class="checkbox-label">
                  <input type="checkbox" formControlName="enabled" />
                  Account Enabled
                </label>
              </div>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="showEditModal.set(false)">Cancel</button>
              <button type="submit" class="btn btn-primary" [disabled]="isSubmitting()">
                <span *ngIf="isSubmitting()" class="spinner-small"></span>
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .admin-users-page {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .page-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .page-top h2 {
      font-size: 1.85rem;
      font-weight: 800;
      color: var(--text-primary, #1e293b);
      margin: 0;
    }

    .page-top p {
      color: var(--text-secondary, #64748b);
      margin: 0.25rem 0 0 0;
      font-size: 0.95rem;
    }

    .header-actions {
      display: flex;
      gap: 0.75rem;
      align-items: center;
    }

    .icon {
      width: 16px;
      height: 16px;
      margin-right: 6px;
    }

    /* Stats Grid */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 1rem;
    }

    .stat-card {
      background: #ffffff;
      border: 1px solid var(--border-color, #e2e8f0);
      border-radius: 12px;
      padding: 1rem 1.25rem;
      display: flex;
      align-items: center;
      gap: 1rem;
      cursor: pointer;
      transition: all 0.2s ease;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
    }

    .stat-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    }

    .stat-card.active-stat {
      border-color: #3b82f6;
      background: #eff6ff;
    }

    .stat-icon {
      width: 44px;
      height: 44px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .stat-icon svg {
      width: 22px;
      height: 22px;
    }

    .total-icon { background: #f1f5f9; color: #475569; }
    .customer-icon { background: #e0f2fe; color: #0284c7; }
    .merchant-icon { background: #fef3c7; color: #d97706; }
    .agent-icon { background: #ede9fe; color: #7c3aed; }
    .admin-icon { background: #dcfce7; color: #16a34a; }

    .stat-info {
      display: flex;
      flex-direction: column;
    }

    .stat-label {
      font-size: 0.8rem;
      color: #64748b;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .stat-value {
      font-size: 1.4rem;
      font-weight: 800;
      color: #0f172a;
    }

    /* Filters Card */
    .filters-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 1rem 1.25rem;
      display: flex;
      align-items: center;
      gap: 1.25rem;
      flex-wrap: wrap;
    }

    .search-box {
      flex: 1;
      min-width: 240px;
      position: relative;
      display: flex;
      align-items: center;
    }

    .search-icon {
      position: absolute;
      left: 12px;
      width: 18px;
      height: 18px;
      color: #94a3b8;
    }

    .search-box input {
      width: 100%;
      padding: 0.6rem 2.2rem 0.6rem 2.4rem;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      font-size: 0.9rem;
      outline: none;
      transition: border-color 0.2s;
    }

    .search-box input:focus {
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
    }

    .clear-btn {
      position: absolute;
      right: 10px;
      background: transparent;
      border: none;
      color: #94a3b8;
      cursor: pointer;
      font-size: 0.9rem;
    }

    .filter-group {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .filter-group label {
      font-size: 0.85rem;
      font-weight: 600;
      color: #475569;
    }

    .filter-group select {
      padding: 0.55rem 0.9rem;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      font-size: 0.85rem;
      background: #ffffff;
      color: #1e293b;
      cursor: pointer;
      outline: none;
    }

    .filter-info {
      font-size: 0.85rem;
      color: #64748b;
      margin-left: auto;
    }

    /* Table Styles */
    .table-card {
      background: #ffffff;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      overflow: hidden;
    }

    .table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
    }

    .table th {
      background: #f8fafc;
      padding: 0.9rem 1.25rem;
      font-size: 0.78rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #475569;
      border-bottom: 1px solid #e2e8f0;
    }

    .table td {
      padding: 1rem 1.25rem;
      border-bottom: 1px solid #f1f5f9;
      font-size: 0.9rem;
      vertical-align: middle;
    }

    .table tr:hover {
      background: #f8fafc;
    }

    .user-id {
      font-family: var(--font-mono, monospace);
      color: #64748b;
      font-weight: 700;
      background: #f1f5f9;
      padding: 0.2rem 0.45rem;
      border-radius: 6px;
    }

    .user-profile-cell {
      display: flex;
      align-items: center;
      gap: 0.85rem;
    }

    .avatar {
      width: 38px;
      height: 38px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 0.85rem;
      color: #ffffff;
      flex-shrink: 0;
    }

    .avatar-customer { background: linear-gradient(135deg, #0284c7, #38bdf8); }
    .avatar-merchant { background: linear-gradient(135deg, #d97706, #fbbf24); }
    .avatar-agent { background: linear-gradient(135deg, #7c3aed, #a78bfa); }
    .avatar-admin { background: linear-gradient(135deg, #16a34a, #4ade80); }

    .user-meta {
      display: flex;
      flex-direction: column;
    }

    .username {
      color: #0f172a;
      font-weight: 700;
    }

    .email {
      font-size: 0.8rem;
      color: #64748b;
    }

    .role-dropdown {
      padding: 0.4rem 0.75rem;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 700;
      border: 1px solid #cbd5e1;
      background: #f8fafc;
      color: #334155;
      cursor: pointer;
      outline: none;
      transition: all 0.2s ease;
    }

    .role-dropdown:hover, .role-dropdown:focus {
      border-color: #3b82f6;
      background: #eff6ff;
      color: #1d4ed8;
    }

    .status-dropdown {
      padding: 0.35rem 0.75rem;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 700;
      cursor: pointer;
      outline: none;
      border: 1px solid transparent;
    }

    .status-active {
      background: #ecfdf5;
      color: #047857;
      border-color: #a7f3d0;
    }

    .status-suspended {
      background: #fffbeb;
      color: #b45309;
      border-color: #fde68a;
    }

    .status-deactivated {
      background: #fef2f2;
      color: #b91c1c;
      border-color: #fecaca;
    }

    .status-pending_verification {
      background: #f5f3ff;
      color: #6d28d9;
      border-color: #ddd6fe;
    }

    /* Switch Toggle */
    .switch-toggle {
      position: relative;
      display: inline-block;
      width: 36px;
      height: 20px;
      vertical-align: middle;
      margin-right: 6px;
    }

    .switch-toggle input {
      opacity: 0;
      width: 0;
      height: 0;
    }

    .slider {
      position: absolute;
      cursor: pointer;
      top: 0; left: 0; right: 0; bottom: 0;
      background-color: #cbd5e1;
      transition: 0.3s;
      border-radius: 20px;
    }

    .slider:before {
      position: absolute;
      content: "";
      height: 14px;
      width: 14px;
      left: 3px;
      bottom: 3px;
      background-color: white;
      transition: 0.3s;
      border-radius: 50%;
    }

    input:checked + .slider {
      background-color: #10b981;
    }

    input:checked + .slider:before {
      transform: translateX(16px);
    }

    .toggle-label {
      font-size: 0.8rem;
      font-weight: 600;
      color: #94a3b8;
    }

    .toggle-label.text-active {
      color: #10b981;
    }

    .date-text {
      font-size: 0.82rem;
      color: #64748b;
    }

    .text-right {
      text-align: right;
    }

    .action-buttons {
      display: flex;
      justify-content: flex-end;
      gap: 0.4rem;
    }

    .btn-icon {
      width: 32px;
      height: 32px;
      border-radius: 6px;
      border: 1px solid #e2e8f0;
      background: #ffffff;
      color: #475569;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-icon svg {
      width: 15px;
      height: 15px;
    }

    .btn-icon:hover:not([disabled]) {
      background: #f1f5f9;
      color: #0f172a;
      border-color: #cbd5e1;
    }

    .btn-danger-icon:hover:not([disabled]) {
      background: #fee2e2;
      color: #dc2626;
      border-color: #fca5a5;
    }

    .btn-icon[disabled] {
      opacity: 0.35;
      cursor: not-allowed;
    }

    /* Empty state */
    .empty-state {
      padding: 3.5rem 1rem;
      text-align: center;
    }

    .empty-icon {
      font-size: 3rem;
      margin-bottom: 0.75rem;
    }

    .empty-state h3 {
      font-size: 1.25rem;
      font-weight: 700;
      color: #1e293b;
      margin-bottom: 0.25rem;
    }

    .empty-state p {
      color: #64748b;
      font-size: 0.9rem;
      max-width: 420px;
      margin: 0 auto;
    }

    /* Modals */
    .modal-backdrop {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(15, 23, 42, 0.6);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1050;
      padding: 1rem;
    }

    .modal-dialog {
      background: #ffffff;
      border-radius: 14px;
      width: 100%;
      max-width: 500px;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
      overflow: hidden;
      animation: modalIn 0.2s ease-out;
    }

    @keyframes modalIn {
      from { opacity: 0; transform: scale(0.95); }
      to { opacity: 1; transform: scale(1); }
    }

    .modal-header {
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .modal-header h3 {
      margin: 0;
      font-size: 1.2rem;
      font-weight: 700;
      color: #0f172a;
    }

    .close-btn {
      background: transparent;
      border: none;
      font-size: 1.2rem;
      color: #94a3b8;
      cursor: pointer;
    }

    .modal-body {
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .modal-footer {
      padding: 1rem 1.5rem;
      background: #f8fafc;
      border-top: 1px solid #e2e8f0;
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }

    .form-group label {
      font-size: 0.85rem;
      font-weight: 600;
      color: #334155;
    }

    .required {
      color: #ef4444;
    }

    .form-control {
      padding: 0.65rem 0.9rem;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      font-size: 0.9rem;
      outline: none;
      transition: border-color 0.2s;
    }

    .form-control:focus {
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
    }

    .field-error {
      font-size: 0.78rem;
      color: #ef4444;
      font-weight: 500;
    }

    .user-summary-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 0.9rem;
      display: flex;
      align-items: center;
      gap: 0.85rem;
    }

    .checkbox-group {
      margin-top: 0.5rem;
    }

    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
      font-size: 0.9rem;
      font-weight: 600;
      color: #1e293b;
    }

    .merchant-domain-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      background: #ecfdf5;
      color: #047857;
      border: 1px solid #a7f3d0;
      padding: 0.25rem 0.65rem;
      border-radius: 20px;
      font-size: 0.78rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .merchant-domain-badge:hover {
      background: #d1fae5;
      border-color: #6ee7b7;
      transform: translateY(-1px);
    }

    .merchant-domain-unassigned {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      background: #fffbeb;
      color: #b45309;
      border: 1px dashed #fcd34d;
      padding: 0.25rem 0.65rem;
      border-radius: 20px;
      font-size: 0.78rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .merchant-domain-unassigned:hover {
      background: #fef3c7;
      border-color: #f59e0b;
    }

    .spinner-small {
      width: 14px;
      height: 14px;
      border: 2px solid rgba(255, 255, 255, 0.4);
      border-top-color: currentColor;
      border-radius: 50%;
      display: inline-block;
      animation: spin 0.6s linear infinite;
      margin-right: 6px;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `]
})
export class AdminUsersComponent implements OnInit {
  users = signal<UserDto[]>([]);
  categories = signal<CategoryDto[]>([]);
  isLoading = signal<boolean>(false);
  isSubmitting = signal<boolean>(false);

  // Filters
  searchQuery = signal<string>('');
  selectedRole = signal<string>('ALL');
  selectedStatus = signal<string>('ALL');
  selectedCategoryFilter = signal<string>('ALL');

  // Modals state
  showCreateModal = signal<boolean>(false);
  showEditModal = signal<boolean>(false);
  selectedUser = signal<UserDto | null>(null);

  createUserForm: FormGroup;
  editUserForm: FormGroup;

  // Computed Counts
  customerCount = computed(() => this.users().filter(u => u.role === 'CUSTOMER').length);
  merchantCount = computed(() => this.users().filter(u => u.role === 'MERCHANT').length);
  agentCount = computed(() => this.users().filter(u => u.role === 'DELIVERY_AGENT').length);
  adminCount = computed(() => this.users().filter(u => u.role === 'ADMIN').length);

  filteredUsers = computed(() => {
    let list = this.users();
    const query = this.searchQuery().trim().toLowerCase();
    const role = this.selectedRole();
    const status = this.selectedStatus();
    const catFilter = this.selectedCategoryFilter();

    if (query) {
      list = list.filter(u =>
        u.username.toLowerCase().includes(query) ||
        u.email.toLowerCase().includes(query) ||
        u.id.toString().includes(query) ||
        (u.assignedCategoryName && u.assignedCategoryName.toLowerCase().includes(query))
      );
    }

    if (role !== 'ALL') {
      list = list.filter(u => u.role === role);
    }

    if (status !== 'ALL') {
      list = list.filter(u => (u.accountStatus || 'ACTIVE') === status);
    }

    if (catFilter !== 'ALL') {
      list = list.filter(u => u.role === 'MERCHANT' && u.assignedCategoryName === catFilter);
    }

    return list;
  });

  constructor(
    private authService: AuthService,
    private productService: ProductService,
    private toast: ToastService,
    private dialog: DialogService,
    private fb: FormBuilder
  ) {
    this.createUserForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      role: ['CUSTOMER', [Validators.required]],
      assignedCategoryId: ['']
    });

    this.editUserForm = this.fb.group({
      role: ['CUSTOMER', [Validators.required]],
      assignedCategoryId: [''],
      accountStatus: ['ACTIVE', [Validators.required]],
      enabled: [true]
    });
  }

  ngOnInit(): void {
    this.loadUsers();
    this.loadCategories();
  }

  loadCategories(): void {
    this.productService.getAllCategories().subscribe({
      next: (cats) => {
        if (cats && cats.length > 0) {
          this.categories.set(cats);
        } else {
          this.categories.set(SEED_CATEGORIES);
        }
      },
      error: () => {
        this.categories.set(SEED_CATEGORIES);
      }
    });
  }

  loadUsers(): void {
    this.isLoading.set(true);
    this.authService.getUsers().subscribe({
      next: (userList) => {
        this.users.set(userList || []);
        this.isLoading.set(false);
      },
      error: () => {
        this.toast.error('Failed to load user accounts.');
        this.isLoading.set(false);
      }
    });
  }

  setRoleFilter(role: string): void {
    this.selectedRole.set(role);
  }

  resetFilters(): void {
    this.searchQuery.set('');
    this.selectedRole.set('ALL');
    this.selectedStatus.set('ALL');
    this.selectedCategoryFilter.set('ALL');
  }

  isCurrentUser(user: UserDto): boolean {
    const current = this.authService.currentUser();
    return !!current && (current.id === user.id || current.username === user.username);
  }

  onRoleChange(user: UserDto, newRole: UserRole): void {
    if (user.role === newRole) return;
    this.authService.updateUserRole(user.id, newRole).subscribe({
      next: () => {
        this.users.update(list => list.map(u => u.id === user.id ? { ...u, role: newRole } : u));
      },
      error: () => {
        this.loadUsers();
      }
    });
  }

  onStatusChange(user: UserDto, newStatus: AccountStatus): void {
    const isEnabled = newStatus === 'ACTIVE';
    this.authService.updateUserStatus(user.id, newStatus, isEnabled).subscribe({
      next: () => {
        this.users.update(list => list.map(u => u.id === user.id ? { ...u, accountStatus: newStatus, enabled: isEnabled } : u));
      },
      error: () => {
        this.loadUsers();
      }
    });
  }

  toggleUserEnabled(user: UserDto): void {
    this.authService.toggleUserEnabled(user.id).subscribe({
      next: () => {
        this.users.update(list => list.map(u => u.id === user.id ? { ...u, enabled: !user.enabled, accountStatus: !user.enabled ? 'ACTIVE' : 'DEACTIVATED' } : u));
      },
      error: () => {
        this.loadUsers();
      }
    });
  }

  async deleteUser(user: UserDto): Promise<void> {
    if (this.isCurrentUser(user)) {
      this.toast.error('You cannot delete your own active administrator account.');
      return;
    }

    const confirmed = await this.dialog.confirm({
      title: 'Delete User Account',
      message: `Are you sure you want to permanently delete user "${user.username}" (${user.email})? This action cannot be undone.`,
      confirmText: 'Delete User',
      type: 'danger'
    });

    if (confirmed) {
      this.authService.deleteUser(user.id).subscribe({
        next: () => {
          this.users.update(list => list.filter(u => u.id !== user.id));
        }
      });
    }
  }

  openCreateUserModal(): void {
    this.createUserForm.reset({
      username: '',
      email: '',
      password: '',
      role: 'CUSTOMER',
      assignedCategoryId: ''
    });
    this.showCreateModal.set(true);
  }

  submitCreateUser(): void {
    if (this.createUserForm.invalid) return;

    this.isSubmitting.set(true);
    const formVal = this.createUserForm.value;

    let catId: number | undefined = undefined;
    let catName: string | undefined = undefined;
    if (formVal.role === 'MERCHANT' && formVal.assignedCategoryId) {
      catId = +formVal.assignedCategoryId;
      const cat = this.categories().find(c => c.id === catId);
      catName = cat ? cat.name : undefined;
    }

    this.authService.adminCreateUser({
      username: formVal.username.trim(),
      email: formVal.email.trim(),
      password: formVal.password,
      role: formVal.role,
      assignedCategoryId: catId,
      assignedCategoryName: catName
    }).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.showCreateModal.set(false);
        this.loadUsers();
      },
      error: () => {
        this.isSubmitting.set(false);
      }
    });
  }

  openEditModal(user: UserDto): void {
    this.selectedUser.set(user);
    this.editUserForm.patchValue({
      role: user.role,
      assignedCategoryId: user.assignedCategoryId || '',
      accountStatus: user.accountStatus || 'ACTIVE',
      enabled: user.enabled
    });
    this.showEditModal.set(true);
  }

  submitEditUser(): void {
    const user = this.selectedUser();
    if (!user || this.editUserForm.invalid) return;

    this.isSubmitting.set(true);
    const { role, assignedCategoryId, accountStatus, enabled } = this.editUserForm.value;

    this.authService.updateUserStatus(user.id, accountStatus, enabled).subscribe({
      next: () => {
        const updateRole$ = (user.role !== role)
          ? this.authService.updateUserRole(user.id, role)
          : of(user);

        updateRole$.subscribe({
          next: () => {
            if (role === 'MERCHANT' && assignedCategoryId && +assignedCategoryId !== user.assignedCategoryId) {
              const cat = this.categories().find(c => c.id === +assignedCategoryId);
              const catName = cat ? cat.name : 'Assigned Category';
              this.authService.updateUserCategory(user.id, +assignedCategoryId, catName).subscribe({
                next: () => {
                  this.isSubmitting.set(false);
                  this.showEditModal.set(false);
                  this.loadUsers();
                },
                error: () => {
                  this.isSubmitting.set(false);
                  this.loadUsers();
                }
              });
            } else {
              this.isSubmitting.set(false);
              this.showEditModal.set(false);
              this.loadUsers();
            }
          },
          error: () => {
            this.isSubmitting.set(false);
            this.loadUsers();
          }
        });
      },
      error: () => {
        this.isSubmitting.set(false);
        this.loadUsers();
      }
    });
  }

  getInitials(username: string): string {
    if (!username) return 'U';
    return username.substring(0, 2).toUpperCase();
  }

  getAvatarColorClass(role: UserRole): string {
    switch (role) {
      case 'ADMIN': return 'avatar-admin';
      case 'MERCHANT': return 'avatar-merchant';
      case 'DELIVERY_AGENT': return 'avatar-agent';
      case 'CUSTOMER':
      default:
        return 'avatar-customer';
    }
  }

  formatDate(dateStr?: string): string {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  }
}
