import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../../core/services/product.service';
import { ToastService } from '../../../core/services/toast.service';
import { DialogService } from '../../../core/services/dialog.service';
import { ProductDto } from '../../../core/models/product.models';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';

@Component({
  selector: 'app-merchant-product-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, StatusBadgeComponent, PaginationComponent],
  template: `
    <div class="merchant-prods-page">
      <div class="page-top">
        <div>
          <h2>My Products Catalog</h2>
          <p>Create, update, activate/deactivate, and manage your inventory listings</p>
        </div>
        <a routerLink="/merchant/products/new" class="btn btn-accent">
          <i class="bi bi-plus-circle me-1"></i> Add New Product
        </a>
      </div>

      <div class="card table-card">
        <div class="table-responsive">
          <table class="table" *ngIf="products().length > 0; else noProds">
            <thead>
              <tr>
                <th>Product Details</th>
                <th>Category</th>
                <th>Price</th>
                <th>Listing Status</th>
                <th>Visibility Toggle</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let prod of products()">
                <td>
                  <div class="prod-info-cell">
                    <img
                      [src]="prod.imageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=80'"
                      [alt]="prod.name"
                      class="thumb"
                    />
                    <div>
                      <strong>{{ prod.name }}</strong>
                      <small>ID: #{{ prod.id }}</small>
                    </div>
                  </div>
                </td>
                <td>{{ prod.categoryName || 'General' }}</td>
                <td><strong>₹{{ prod.price | number:'1.2-2' }}</strong></td>
                <td>
                  <app-status-badge [status]="prod.active ? 'ACTIVE' : 'INACTIVE'"></app-status-badge>
                </td>
                <td>
                  <button
                    class="btn btn-sm"
                    [ngClass]="prod.active ? 'btn-secondary' : 'btn-primary'"
                    (click)="toggleStatus(prod)"
                  >
                    {{ prod.active ? 'Deactivate' : 'Activate' }}
                  </button>
                </td>
                <td>
                  <div class="action-btns">
                    <a [routerLink]="['/merchant/products', prod.id, 'edit']" class="btn btn-outline btn-sm">
                      <i class="bi bi-pencil me-1"></i> Edit
                    </a>
                    <button class="btn btn-danger btn-sm" (click)="deleteProduct(prod.id)">
                      <i class="bi bi-trash3 me-1"></i> Delete
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          <ng-template #noProds>
            <div style="padding: 3.5rem; text-align: center; color: var(--text-muted);">
              <p>No products found in your catalog. Click "Add New Product" to start selling!</p>
            </div>
          </ng-template>
        </div>

        <div style="padding: 1rem; display: flex; justify-content: center;">
          <app-pagination
            [currentPage]="currentPage()"
            [totalPages]="totalPages()"
            (pageChange)="loadProducts($event)"
          ></app-pagination>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .merchant-prods-page { display: flex; flex-direction: column; gap: 1.5rem; }
    .page-top { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; }
    .page-top h2 { font-size: 1.85rem; font-weight: 800; }
    .table-card { background: #ffffff; }
    .prod-info-cell { display: flex; align-items: center; gap: 0.75rem; }
    .thumb { width: 48px; height: 48px; object-fit: cover; border-radius: var(--radius-sm); }
    .action-btns { display: flex; gap: 0.5rem; }
  `]
})
export class MerchantProductListComponent implements OnInit {
  products = signal<ProductDto[]>([]);
  currentPage = signal<number>(0);
  totalPages = signal<number>(1);

  constructor(
    private productService: ProductService,
    private toast: ToastService,
    private dialog: DialogService
  ) {}

  ngOnInit(): void {
    this.loadProducts(0);
  }

  loadProducts(page: number): void {
    this.productService.getAllProducts(page, 15).subscribe({
      next: (res) => {
        this.products.set(res.content);
        this.currentPage.set(res.number);
        this.totalPages.set(res.totalPages);
      },
      error: () => {}
    });
  }

  toggleStatus(product: ProductDto): void {
    const newStatus = !product.active;
    this.productService.updateProductStatus(product.id, newStatus).subscribe({
      next: (updated) => {
        this.toast.success(`Product ${updated.active ? 'activated' : 'deactivated'}.`);
        this.products.update(l => l.map(p => p.id === product.id ? updated : p));
      },
      error: () => {}
    });
  }

  async deleteProduct(id: number): Promise<void> {
    const confirmed = await this.dialog.confirm({
      title: 'Delete Product Listing?',
      message: 'Are you sure you want to permanently delete this product listing? This action cannot be undone.',
      confirmText: 'Delete Permanently',
      type: 'danger'
    });

    if (confirmed) {
      this.productService.deleteProduct(id).subscribe({
        next: () => {
          this.toast.info('Product deleted.');
          this.products.update(l => l.filter(p => p.id !== id));
        },
        error: () => {}
      });
    }
  }
}
