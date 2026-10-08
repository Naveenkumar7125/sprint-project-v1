import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ProductService } from '../../../core/services/product.service';
import { ToastService } from '../../../core/services/toast.service';
import { CategoryDto } from '../../../core/models/product.models';

@Component({
  selector: 'app-admin-categories',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterLink],
  template: `
    <div class="admin-cats-page">
      <!-- Top Page Header -->
      <div class="page-header">
        <div class="header-left">
          <div class="badge-pill">Store Taxonomy</div>
          <h2>Category Management</h2>
          <p class="subtitle">Create, update, and manage product department categories across the storefront</p>
        </div>
        <div class="header-actions">
          <button class="btn btn-outline" (click)="loadCategories()" [disabled]="isLoading()">
            <i class="bi bi-arrow-clockwise me-1"></i> {{ isLoading() ? 'Refreshing...' : 'Refresh' }}
          </button>
        </div>
      </div>

      <!-- Overview Stats -->
      <div class="stats-row">
        <div class="stat-card">
          <div class="stat-icon purple"><i class="bi bi-folder-fill"></i></div>
          <div class="stat-info">
            <div class="stat-value">{{ categories().length }}</div>
            <div class="stat-label">Total Categories</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon blue"><i class="bi bi-box-seam"></i></div>
          <div class="stat-info">
            <div class="stat-value">{{ totalProductsCount() }}</div>
            <div class="stat-label">Assigned Products</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon green"><i class="bi bi-stars"></i></div>
          <div class="stat-info">
            <div class="stat-value">{{ filteredCategories().length }}</div>
            <div class="stat-label">Matching Filters</div>
          </div>
        </div>
      </div>

      <!-- Main Layout -->
      <div class="cats-layout">
        <!-- Left Column: Add New Category Form -->
        <div class="card form-card">
          <div class="card-header">
            <div class="card-title-group">
              <span class="card-icon"><i class="bi bi-plus-circle"></i></span>
              <h3>Add New Category</h3>
            </div>
          </div>
          <div class="card-body">
            <form [formGroup]="createForm" (ngSubmit)="onCreateCategory()">
              <div class="form-group">
                <label class="form-label" for="catName">Category Name <span class="req">*</span></label>
                <input
                  id="catName"
                  type="text"
                  formControlName="name"
                  placeholder="e.g. Smart Watches & Wearables"
                  class="form-control"
                  [class.is-invalid]="createForm.get('name')?.invalid && createForm.get('name')?.touched"
                />
                <div class="field-error" *ngIf="createForm.get('name')?.invalid && createForm.get('name')?.touched">
                  Name must be between 2 and 50 characters.
                </div>
              </div>

              <div class="form-group">
                <label class="form-label" for="catDesc">Description</label>
                <textarea
                  id="catDesc"
                  rows="3"
                  formControlName="description"
                  placeholder="Brief description of products cataloged under this department..."
                  class="form-control"
                ></textarea>
              </div>

              <button type="submit" class="btn btn-primary btn-block" [disabled]="createForm.invalid || isSubmitting()">
                <span *ngIf="isSubmitting()" class="spinner-inline"></span>
                {{ isSubmitting() ? 'Creating Category...' : 'Create Category' }}
              </button>
            </form>
          </div>
        </div>

        <!-- Right Column: Categories Management Table -->
        <div class="card list-card">
          <div class="card-header list-header">
            <div class="card-title-group">
              <span class="card-icon"><i class="bi bi-folder2-open"></i></span>
              <h3>Active Categories ({{ filteredCategories().length }})</h3>
            </div>
            <!-- Search & Filter Input -->
            <div class="search-box">
              <span class="search-icon"><i class="bi bi-search"></i></span>
              <input
                type="text"
                class="search-input"
                placeholder="Search categories..."
                [(ngModel)]="searchQuery"
              />
              <button class="clear-btn" *ngIf="searchQuery" (click)="searchQuery = ''"><i class="bi bi-x"></i></button>
            </div>
          </div>

          <div class="table-responsive">
            <table class="table">
              <thead>
                <tr>
                  <th style="width: 80px;">ID</th>
                  <th style="width: 220px;">Category Name</th>
                  <th>Description</th>
                  <th style="width: 130px; text-align: center;">Products</th>
                  <th style="width: 140px; text-align: right;">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngIf="isLoading()" class="loading-row">
                  <td colspan="5">
                    <div class="loading-state">
                      <div class="spinner"></div>
                      <span>Loading categories...</span>
                    </div>
                  </td>
                </tr>

                <tr *ngIf="!isLoading() && filteredCategories().length === 0" class="empty-row">
                  <td colspan="5">
                    <div class="empty-state">
                      <span class="empty-icon"><i class="bi bi-folder2-open"></i></span>
                      <h4>No Categories Found</h4>
                      <p *ngIf="searchQuery">No categories match "{{ searchQuery }}". Try a different search term.</p>
                      <p *ngIf="!searchQuery">Get started by creating your first department category on the left.</p>
                    </div>
                  </td>
                </tr>

                <tr *ngFor="let c of filteredCategories()" class="cat-row">
                  <td><code class="cat-id">#{{ c.id }}</code></td>
                  <td>
                    <div class="cat-name-cell">
                      <span class="cat-folder-icon"><i class="bi bi-folder-fill"></i></span>
                      <strong class="cat-name-text">{{ c.name }}</strong>
                    </div>
                  </td>
                  <td>
                    <span class="cat-desc-text" [title]="c.description || ''">
                      {{ c.description || 'No description provided' }}
                    </span>
                  </td>
                  <td style="text-align: center;">
                    <span class="prod-count-badge" [class.empty-count]="!c.productCount">
                      {{ c.productCount ?? 0 }} items
                    </span>
                  </td>
                  <td style="text-align: right;">
                    <div class="action-buttons">
                      <button
                        class="btn-icon edit-btn"
                        title="Edit Category"
                        (click)="openEditModal(c)"
                      >
                        <i class="bi bi-pencil"></i>
                      </button>
                      <button
                        class="btn-icon delete-btn"
                        title="Delete Category"
                        (click)="openDeleteModal(c)"
                      >
                        <i class="bi bi-trash3"></i>
                      </button>
                      <a
                        [routerLink]="['/categories', c.name]"
                        target="_blank"
                        class="btn-icon view-btn"
                        title="View Category on Storefront"
                      >
                        ↗
                      </a>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- EDIT CATEGORY MODAL -->
      <div class="modal-backdrop" *ngIf="editingCategory()" (click)="closeEditModal()">
        <div class="modal-dialog" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <div class="modal-title-wrap">
              <span class="modal-icon"><i class="bi bi-pencil"></i></span>
              <h3>Edit Category</h3>
            </div>
            <button class="modal-close-btn" (click)="closeEditModal()"><i class="bi bi-x-lg"></i></button>
          </div>

          <form [formGroup]="editForm" (ngSubmit)="onUpdateCategory()">
            <div class="modal-body">
              <div class="form-group">
                <label class="form-label" for="editCatName">Category Name <span class="req">*</span></label>
                <input
                  id="editCatName"
                  type="text"
                  formControlName="name"
                  class="form-control"
                  [class.is-invalid]="editForm.get('name')?.invalid && editForm.get('name')?.touched"
                />
                <div class="field-error" *ngIf="editForm.get('name')?.invalid && editForm.get('name')?.touched">
                  Category name must be between 2 and 50 characters.
                </div>
              </div>

              <div class="form-group">
                <label class="form-label" for="editCatDesc">Description</label>
                <textarea
                  id="editCatDesc"
                  rows="3"
                  formControlName="description"
                  class="form-control"
                ></textarea>
              </div>

              <div class="info-box" *ngIf="editingCategory()?.productCount">
                <i class="bi bi-info-circle me-1"></i> <strong>{{ editingCategory()?.productCount }} products</strong> are currently assigned to this category.
              </div>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn btn-outline" (click)="closeEditModal()" [disabled]="isSubmitting()">
                Cancel
              </button>
              <button type="submit" class="btn btn-primary" [disabled]="editForm.invalid || isSubmitting()">
                <span *ngIf="isSubmitting()" class="spinner-inline"></span>
                {{ isSubmitting() ? 'Saving Changes...' : 'Save Changes' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- DELETE CONFIRMATION MODAL -->
      <div class="modal-backdrop" *ngIf="deletingCategory()" (click)="closeDeleteModal()">
        <div class="modal-dialog modal-danger" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <div class="modal-title-wrap">
              <span class="modal-icon warning-icon"><i class="bi bi-exclamation-triangle-fill"></i></span>
              <h3>Delete Category</h3>
            </div>
            <button class="modal-close-btn" (click)="closeDeleteModal()"><i class="bi bi-x-lg"></i></button>
          </div>

          <div class="modal-body">
            <p class="delete-msg">
              Are you sure you want to delete category <strong>"{{ deletingCategory()?.name }}"</strong>?
            </p>

            <div class="alert-box danger-box" *ngIf="deletingCategory()?.productCount && deletingCategory()!.productCount! > 0">
              <span class="alert-icon"><i class="bi bi-shield-slash-fill"></i></span>
              <div>
                <strong>Warning:</strong> This category contains <strong>{{ deletingCategory()?.productCount }} products</strong>.
                You must delete or reassign those products before deleting this category.
              </div>
            </div>

            <p class="sub-warning" *ngIf="!deletingCategory()?.productCount || deletingCategory()!.productCount === 0">
              This action cannot be undone.
            </p>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-outline" (click)="closeDeleteModal()" [disabled]="isSubmitting()">
              Cancel
            </button>
            <button
              type="button"
              class="btn btn-danger"
              (click)="onConfirmDelete()"
              [disabled]="isSubmitting()"
            >
              <span *ngIf="isSubmitting()" class="spinner-inline"></span>
              {{ isSubmitting() ? 'Deleting...' : 'Delete Category' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .admin-cats-page {
      display: flex;
      flex-direction: column;
      gap: 1.75rem;
      padding-bottom: 2rem;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .badge-pill {
      display: inline-block;
      padding: 0.25rem 0.65rem;
      background: #eef2ff;
      color: #4f46e5;
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      border-radius: 9999px;
      margin-bottom: 0.5rem;
    }

    .page-header h2 {
      font-size: 1.85rem;
      font-weight: 800;
      color: #0f172a;
      margin: 0;
      letter-spacing: -0.02em;
    }

    .subtitle {
      color: #64748b;
      margin: 0.25rem 0 0;
      font-size: 0.95rem;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    /* Stats Overview */
    .stats-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1.25rem;
    }

    .stat-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 1.25rem;
      display: flex;
      align-items: center;
      gap: 1rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }

    .stat-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    }

    .stat-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.35rem;
    }

    .stat-icon.purple { background: #f5f3ff; color: #7c3aed; }
    .stat-icon.blue { background: #eff6ff; color: #2563eb; }
    .stat-icon.green { background: #ecfdf5; color: #059669; }

    .stat-value {
      font-size: 1.6rem;
      font-weight: 800;
      color: #0f172a;
      line-height: 1.1;
    }

    .stat-label {
      font-size: 0.825rem;
      color: #64748b;
      font-weight: 500;
      margin-top: 0.25rem;
    }

    /* Layout Grid */
    .cats-layout {
      display: grid;
      grid-template-columns: 360px 1fr;
      gap: 1.75rem;
      align-items: flex-start;
    }

    @media (max-width: 1024px) {
      .cats-layout { grid-template-columns: 1fr; }
    }

    /* Cards */
    .card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      box-shadow: 0 1px 4px rgba(0,0,0,0.04);
      overflow: hidden;
    }

    .card-header {
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid #f1f5f9;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
    }

    .list-header {
      flex-wrap: wrap;
    }

    .card-title-group {
      display: flex;
      align-items: center;
      gap: 0.6rem;
    }

    .card-icon {
      font-size: 1.2rem;
    }

    .card-header h3 {
      font-size: 1.1rem;
      font-weight: 700;
      color: #0f172a;
      margin: 0;
    }

    .card-body {
      padding: 1.5rem;
    }

    /* Search Box */
    .search-box {
      position: relative;
      display: flex;
      align-items: center;
      min-width: 240px;
    }

    .search-icon {
      position: absolute;
      left: 0.75rem;
      color: #94a3b8;
      font-size: 0.9rem;
      pointer-events: none;
    }

    .search-input {
      width: 100%;
      padding: 0.45rem 2rem 0.45rem 2.25rem;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      font-size: 0.875rem;
      outline: none;
      transition: border-color 0.2s, box-shadow 0.2s;
    }

    .search-input:focus {
      border-color: #6366f1;
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
    }

    .clear-btn {
      position: absolute;
      right: 0.5rem;
      background: none;
      border: none;
      color: #94a3b8;
      cursor: pointer;
      font-size: 0.75rem;
      padding: 0.25rem;
    }

    /* Forms */
    .form-group {
      margin-bottom: 1.25rem;
    }

    .form-label {
      display: block;
      font-size: 0.85rem;
      font-weight: 600;
      color: #334155;
      margin-bottom: 0.4rem;
    }

    .req {
      color: #ef4444;
    }

    .form-control {
      width: 100%;
      padding: 0.6rem 0.85rem;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      font-size: 0.9rem;
      font-family: inherit;
      color: #1e293b;
      background: #ffffff;
      outline: none;
      transition: all 0.2s ease;
      box-sizing: border-box;
    }

    .form-control:focus {
      border-color: #6366f1;
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
    }

    .form-control.is-invalid {
      border-color: #ef4444;
      background-color: #fff5f5;
    }

    .field-error {
      color: #ef4444;
      font-size: 0.775rem;
      margin-top: 0.35rem;
    }

    /* Buttons */
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.4rem;
      padding: 0.55rem 1.1rem;
      border-radius: 8px;
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      border: 1px solid transparent;
      text-decoration: none;
    }

    .btn-block { width: 100%; }

    .btn-primary {
      background: #4f46e5;
      color: #ffffff;
    }

    .btn-primary:hover:not(:disabled) {
      background: #4338ca;
      box-shadow: 0 2px 6px rgba(79, 70, 229, 0.3);
    }

    .btn-outline {
      background: #ffffff;
      border-color: #cbd5e1;
      color: #334155;
    }

    .btn-outline:hover:not(:disabled) {
      background: #f8fafc;
      border-color: #94a3b8;
    }

    .btn-danger {
      background: #dc2626;
      color: #ffffff;
    }

    .btn-danger:hover:not(:disabled) {
      background: #b91c1c;
      box-shadow: 0 2px 6px rgba(220, 38, 38, 0.3);
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .action-buttons {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
    }

    .btn-icon {
      width: 32px;
      height: 32px;
      border-radius: 6px;
      border: 1px solid #e2e8f0;
      background: #ffffff;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 0.85rem;
      color: #475569;
      transition: all 0.15s ease;
      text-decoration: none;
    }

    .btn-icon:hover {
      background: #f1f5f9;
      color: #0f172a;
      border-color: #cbd5e1;
    }

    .edit-btn:hover { background: #eef2ff; color: #4f46e5; border-color: #c7d2fe; }
    .delete-btn:hover { background: #fef2f2; color: #dc2626; border-color: #fecaca; }
    .view-btn:hover { background: #f0fdf4; color: #16a34a; border-color: #bbf7d0; }

    /* Table Styles */
    .table-responsive {
      overflow-x: auto;
    }

    .table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
    }

    .table th {
      background: #f8fafc;
      color: #475569;
      font-size: 0.775rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding: 0.85rem 1.25rem;
      border-bottom: 1px solid #e2e8f0;
    }

    .table td {
      padding: 1rem 1.25rem;
      border-bottom: 1px solid #f1f5f9;
      font-size: 0.9rem;
      color: #334155;
      vertical-align: middle;
    }

    .cat-row:hover td {
      background: #fafafa;
    }

    .cat-id {
      background: #f1f5f9;
      color: #475569;
      padding: 0.2rem 0.45rem;
      border-radius: 4px;
      font-size: 0.8rem;
      font-weight: 600;
    }

    .cat-name-cell {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .cat-folder-icon {
      font-size: 1.1rem;
    }

    .cat-name-text {
      color: #0f172a;
      font-weight: 700;
    }

    .cat-desc-text {
      color: #64748b;
      font-size: 0.85rem;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      max-width: 320px;
    }

    .prod-count-badge {
      display: inline-block;
      padding: 0.25rem 0.65rem;
      background: #ecfdf5;
      color: #059669;
      font-weight: 700;
      font-size: 0.775rem;
      border-radius: 9999px;
    }

    .prod-count-badge.empty-count {
      background: #f1f5f9;
      color: #64748b;
    }

    /* Loading & Empty States */
    .loading-state, .empty-state {
      padding: 3rem 1.5rem;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
    }

    .spinner {
      width: 32px;
      height: 32px;
      border: 3px solid #e2e8f0;
      border-top-color: #4f46e5;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    .spinner-inline {
      width: 14px;
      height: 14px;
      border: 2px solid rgba(255,255,255,0.4);
      border-top-color: #ffffff;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      display: inline-block;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .empty-icon {
      font-size: 2.5rem;
      margin-bottom: 0.5rem;
    }

    .empty-state h4 {
      margin: 0;
      font-size: 1.15rem;
      color: #0f172a;
    }

    .empty-state p {
      margin: 0;
      color: #64748b;
      font-size: 0.9rem;
      max-width: 300px;
    }

    /* Modal Backdrop & Dialog */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.6);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1050;
      padding: 1rem;
      animation: fadeIn 0.15s ease-out;
    }

    .modal-dialog {
      background: #ffffff;
      width: 100%;
      max-width: 480px;
      border-radius: 14px;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
      overflow: hidden;
      animation: slideUp 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes slideUp {
      from { transform: translateY(12px) scale(0.98); opacity: 0; }
      to { transform: translateY(0) scale(1); opacity: 1; }
    }

    .modal-header {
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid #f1f5f9;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .modal-title-wrap {
      display: flex;
      align-items: center;
      gap: 0.6rem;
    }

    .modal-icon {
      font-size: 1.2rem;
    }

    .modal-header h3 {
      margin: 0;
      font-size: 1.15rem;
      font-weight: 700;
      color: #0f172a;
    }

    .modal-close-btn {
      background: none;
      border: none;
      font-size: 1.1rem;
      color: #94a3b8;
      cursor: pointer;
      padding: 0.25rem 0.5rem;
      border-radius: 6px;
      transition: all 0.15s;
    }

    .modal-close-btn:hover {
      background: #f1f5f9;
      color: #334155;
    }

    .modal-body {
      padding: 1.5rem;
    }

    .modal-footer {
      padding: 1rem 1.5rem;
      background: #f8fafc;
      border-top: 1px solid #f1f5f9;
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 0.75rem;
    }

    .info-box {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      color: #166534;
      padding: 0.75rem 1rem;
      border-radius: 8px;
      font-size: 0.85rem;
      margin-top: 0.5rem;
    }

    .delete-msg {
      font-size: 1rem;
      color: #1e293b;
      margin-top: 0;
    }

    .alert-box.danger-box {
      background: #fef2f2;
      border: 1px solid #fecaca;
      color: #991b1b;
      padding: 0.85rem 1rem;
      border-radius: 8px;
      font-size: 0.875rem;
      display: flex;
      align-items: flex-start;
      gap: 0.65rem;
      margin: 1rem 0;
    }

    .sub-warning {
      color: #64748b;
      font-size: 0.85rem;
      margin: 0.5rem 0 0;
    }
  `]
})
export class AdminCategoriesComponent implements OnInit {
  categories = signal<CategoryDto[]>([]);
  isLoading = signal<boolean>(false);
  isSubmitting = signal<boolean>(false);
  searchQuery: string = '';

  createForm!: FormGroup;
  editForm!: FormGroup;

  editingCategory = signal<CategoryDto | null>(null);
  deletingCategory = signal<CategoryDto | null>(null);

  totalProductsCount = computed(() => {
    return this.categories().reduce((sum, c) => sum + (c.productCount ?? 0), 0);
  });

  filteredCategories = computed(() => {
    const query = this.searchQuery.toLowerCase().trim();
    if (!query) return this.categories();
    return this.categories().filter(c =>
      c.name.toLowerCase().includes(query) ||
      (c.description && c.description.toLowerCase().includes(query)) ||
      c.id?.toString() === query
    );
  });

  constructor(
    private productService: ProductService,
    private toast: ToastService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.createForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      description: ['']
    });

    this.editForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      description: ['']
    });

    this.loadCategories();
  }

  loadCategories(): void {
    this.isLoading.set(true);
    this.productService.getAllCategories().subscribe({
      next: (cats) => {
        this.categories.set(cats);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  onCreateCategory(): void {
    if (this.createForm.invalid || this.isSubmitting()) return;

    this.isSubmitting.set(true);
    const payload = this.createForm.value;

    this.productService.createCategory(payload).subscribe({
      next: (created) => {
        this.isSubmitting.set(false);
        this.toast.success(`Category "${created.name}" created successfully!`);
        this.categories.update(list => [created, ...list]);
        this.createForm.reset();
      },
      error: (err) => {
        this.isSubmitting.set(false);
        const msg = err.error?.message || 'Failed to create category.';
        this.toast.error(msg);
      }
    });
  }

  openEditModal(category: CategoryDto): void {
    this.editingCategory.set(category);
    this.editForm.patchValue({
      name: category.name,
      description: category.description || ''
    });
  }

  closeEditModal(): void {
    this.editingCategory.set(null);
    this.editForm.reset();
  }

  onUpdateCategory(): void {
    const current = this.editingCategory();
    if (!current || !current.id || this.editForm.invalid || this.isSubmitting()) return;

    this.isSubmitting.set(true);
    const payload = this.editForm.value;

    this.productService.updateCategory(current.id, payload).subscribe({
      next: (updated) => {
        this.isSubmitting.set(false);
        this.toast.success(`Category "${updated.name}" updated successfully!`);
        this.categories.update(list =>
          list.map(c => c.id === current.id ? { ...c, ...updated } : c)
        );
        this.closeEditModal();
      },
      error: (err) => {
        this.isSubmitting.set(false);
        const msg = err.error?.message || 'Failed to update category.';
        this.toast.error(msg);
      }
    });
  }

  openDeleteModal(category: CategoryDto): void {
    this.deletingCategory.set(category);
  }

  closeDeleteModal(): void {
    this.deletingCategory.set(null);
  }

  onConfirmDelete(): void {
    const current = this.deletingCategory();
    if (!current || !current.id || this.isSubmitting()) return;

    this.isSubmitting.set(true);
    this.productService.deleteCategory(current.id).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.toast.success(`Category "${current.name}" deleted successfully.`);
        this.categories.update(list => list.filter(c => c.id !== current.id));
        this.closeDeleteModal();
      },
      error: (err) => {
        this.isSubmitting.set(false);
        const msg = err.error?.message || 'Failed to delete category.';
        this.toast.error(msg);
        this.closeDeleteModal();
      }
    });
  }
}
