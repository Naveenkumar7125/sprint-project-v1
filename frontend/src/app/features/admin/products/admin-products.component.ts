import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductService } from '../../../core/services/product.service';
import { ToastService } from '../../../core/services/toast.service';
import { DialogService } from '../../../core/services/dialog.service';
import { ProductDto } from '../../../core/models/product.models';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';

@Component({
  selector: 'app-admin-products',
  standalone: true,
  imports: [CommonModule, StatusBadgeComponent, PaginationComponent],
  template: `
    <div class="admin-products-page">
      <div class="page-top">
        <div>
          <h2>Global Product Moderation</h2>
          <p>Inspect, moderate, and manage all listings across all merchants</p>
        </div>
      </div>

      <div class="card table-card">
        <div class="table-responsive">
          <table class="table" *ngIf="products().length > 0; else noProds">
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Merchant ID</th>
                <th>Price</th>
                <th>Status</th>
                <th>Moderate</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let p of products()">
                <td>
                  <div class="prod-cell">
                    <img
                      [src]="p.imageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=80'"
                      [alt]="p.name"
                      class="thumb"
                    />
                    <div>
                      <strong>{{ p.name }}</strong>
                      <small>ID: #{{ p.id }}</small>
                    </div>
                  </div>
                </td>
                <td>{{ p.categoryName || 'General' }}</td>
                <td><code>#{{ p.merchantId }}</code></td>
                <td><strong>₹{{ p.price | number:'1.2-2' }}</strong></td>
                <td>
                  <app-status-badge [status]="p.active ? 'ACTIVE' : 'INACTIVE'"></app-status-badge>
                </td>
                <td>
                  <button
                    class="btn btn-sm"
                    [ngClass]="p.active ? 'btn-secondary' : 'btn-primary'"
                    (click)="toggleActive(p)"
                  >
                    {{ p.active ? 'Deactivate' : 'Approve & Activate' }}
                  </button>
                </td>
                <td>
                  <button class="btn btn-danger btn-sm" (click)="deleteProduct(p.id)">
                    Delete
                  </button>
                </td>
              </tr>
            </tbody>
          </table>

          <ng-template #noProds>
            <p style="text-align: center; padding: 3rem; color: var(--text-muted);">No products found.</p>
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
    .admin-products-page { display: flex; flex-direction: column; gap: 1.5rem; }
    .page-top h2 { font-size: 1.85rem; font-weight: 800; }
    .table-card { background: #ffffff; }
    .prod-cell { display: flex; align-items: center; gap: 0.75rem; }
    .thumb { width: 44px; height: 44px; object-fit: cover; border-radius: var(--radius-sm); }
  `]
})
export class AdminProductsComponent implements OnInit {
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

  toggleActive(p: ProductDto): void {
    this.productService.updateProductStatus(p.id, !p.active).subscribe({
      next: (up) => {
        this.toast.success(`Product ${up.active ? 'activated' : 'deactivated'}.`);
        this.products.update(l => l.map(prod => prod.id === p.id ? up : prod));
      },
      error: () => {}
    });
  }

  async deleteProduct(id: number): Promise<void> {
    const confirmed = await this.dialog.confirm({
      title: 'Admin Moderation: Delete Product',
      message: 'Are you sure you want to permanently delete this product from the platform?',
      confirmText: 'Delete Listing',
      type: 'danger'
    });

    if (confirmed) {
      this.productService.deleteProduct(id).subscribe({
        next: () => {
          this.toast.info('Product removed.');
          this.products.update(l => l.filter(p => p.id !== id));
        },
        error: () => {}
      });
    }
  }
}
