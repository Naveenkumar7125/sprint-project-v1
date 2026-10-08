import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../../core/services/product.service';
import { InventoryService } from '../../../core/services/inventory.service';
import { ToastService } from '../../../core/services/toast.service';
import { ProductDto } from '../../../core/models/product.models';

interface InventoryItemView {
  product: ProductDto;
  availableQuantity: number;
  reservedQuantity: number;
  soldQuantity: number;
  isLoading: boolean;
}

@Component({
  selector: 'app-merchant-inventory',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="inventory-page">
      <div class="page-top">
        <div>
          <h2>Stock & Inventory Console</h2>
          <p>Real-time distributed stock allocation across available, reserved, and sold inventory</p>
        </div>
      </div>

      <div class="card table-card">
        <div class="table-responsive">
          <table class="table" *ngIf="items().length > 0; else loadingTpl">
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Price</th>
                <th>Available Units</th>
                <th>Reserved (In Cart/Saga)</th>
                <th>Units Sold</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let item of items()">
                <td>
                  <div class="prod-cell">
                    <img
                      [src]="item.product.imageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=80'"
                      [alt]="item.product.name"
                      class="thumb"
                    />
                    <div>
                      <strong>{{ item.product.name }}</strong>
                      <small>SKU: PROD-{{ item.product.id }}</small>
                    </div>
                  </div>
                </td>
                <td>{{ item.product.categoryName || 'General' }}</td>
                <td>₹{{ item.product.price | number:'1.2-2' }}</td>
                <td>
                  <span class="badge" [ngClass]="item.availableQuantity > 5 ? 'badge-success' : (item.availableQuantity > 0 ? 'badge-warning' : 'badge-danger')">
                    {{ item.availableQuantity }} in stock
                  </span>
                </td>
                <td>
                  <span class="badge" [ngClass]="item.reservedQuantity > 0 ? 'badge-warning' : 'badge-subtle'">
                    {{ item.reservedQuantity }} reserved
                  </span>
                </td>
                <td>
                  <span class="badge badge-info" *ngIf="item.soldQuantity > 0; else zeroSold">
                    {{ item.soldQuantity }} sold
                  </span>
                  <ng-template #zeroSold>
                    <span style="color: var(--text-muted); font-size: 0.875rem;">0 sold</span>
                  </ng-template>
                </td>
                <td>
                  <button class="btn btn-secondary btn-sm" (click)="openUpdateStockModal(item)">
                    <i class="bi bi-sliders me-1"></i> Adjust Stock
                  </button>
                </td>
              </tr>
            </tbody>
          </table>

          <ng-template #loadingTpl>
            <div style="padding: 3rem; text-align: center; color: var(--text-muted);">
              <p>Loading merchant inventory...</p>
            </div>
          </ng-template>
        </div>
      </div>

      <!-- Quick Adjust Stock Modal -->
      <div class="modal-overlay" *ngIf="selectedItem" (click)="selectedItem = null">
        <div class="modal-box animate-fade-in" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>Adjust Stock for {{ selectedItem.product.name }}</h3>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">New Total Stock Quantity</label>
              <input
                type="number"
                [(ngModel)]="newStockQuantity"
                min="0"
                class="form-control"
              />
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="selectedItem = null">Cancel</button>
            <button class="btn btn-primary" (click)="saveStock()" [disabled]="isSaving">
              {{ isSaving ? 'Saving...' : 'Update Stock' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .inventory-page { display: flex; flex-direction: column; gap: 1.5rem; }
    .page-top h2 { font-size: 1.85rem; font-weight: 800; }
    .table-card { background: #ffffff; }
    .prod-cell { display: flex; align-items: center; gap: 0.75rem; }
    .thumb { width: 44px; height: 44px; object-fit: cover; border-radius: var(--radius-sm); }

    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.6);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      padding: 1rem;
    }
    .modal-box {
      background: #ffffff;
      border-radius: var(--radius-xl);
      max-width: 440px;
      width: 100%;
      box-shadow: var(--shadow-xl);
      overflow: hidden;
    }
    .modal-header { padding: 1.5rem 1.5rem 1rem; }
    .modal-body { padding: 0 1.5rem 1.5rem; }
    .modal-footer {
      padding: 1rem 1.5rem;
      background: var(--bg-subtle);
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem;
    }
  `]
})
export class MerchantInventoryComponent implements OnInit {
  items = signal<InventoryItemView[]>([]);
  selectedItem: InventoryItemView | null = null;
  newStockQuantity: number = 0;
  isSaving: boolean = false;

  constructor(
    private productService: ProductService,
    private inventoryService: InventoryService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.loadInventory();
  }

  loadInventory(): void {
    this.productService.getAllProducts(0, 50).subscribe({
      next: (page) => {
        const views: InventoryItemView[] = page.content.map(p => ({
          product: p,
          availableQuantity: 0,
          reservedQuantity: 0,
          soldQuantity: 0,
          isLoading: true
        }));
        this.items.set(views);

        // Fetch real-time stock and sold count for each product from InventoryService
        page.content.forEach((p) => {
          this.inventoryService.getInventory(p.id).subscribe({
            next: (inv) => {
              const available = inv.availableStock ?? inv.availableQuantity ?? 0;
              const reserved = inv.reservedStock ?? inv.reservedQuantity ?? 0;
              const sold = inv.soldStock ?? inv.soldQuantity ?? 0;

              this.items.update(list => list.map(item => {
                if (item.product.id === p.id) {
                  return {
                    ...item,
                    availableQuantity: available,
                    reservedQuantity: reserved,
                    soldQuantity: sold,
                    isLoading: false
                  };
                }
                return item;
              }));
            },
            error: (err) => {
              console.warn(`Could not load inventory for product ${p.id}:`, err);
              this.items.update(list => list.map(item => {
                if (item.product.id === p.id) {
                  return { ...item, isLoading: false };
                }
                return item;
              }));
            }
          });
        });
      },
      error: () => {}
    });
  }

  openUpdateStockModal(item: InventoryItemView): void {
    this.selectedItem = item;
    this.newStockQuantity = item.availableQuantity;
  }

  saveStock(): void {
    if (!this.selectedItem) return;

    const prodId = this.selectedItem.product.id;
    this.isSaving = true;
    this.inventoryService.updateStock(prodId, this.newStockQuantity).subscribe({
      next: (updatedInv) => {
        this.isSaving = false;
        this.toast.success('Stock quantity updated successfully.');
        const avail = updatedInv.availableStock ?? updatedInv.availableQuantity ?? this.newStockQuantity;
        const resv = updatedInv.reservedStock ?? updatedInv.reservedQuantity ?? 0;
        const sold = updatedInv.soldStock ?? updatedInv.soldQuantity ?? 0;
        this.items.update(list => list.map(item => 
          item.product.id === prodId ? { ...item, availableQuantity: avail, reservedQuantity: resv, soldQuantity: sold } : item
        ));
        this.selectedItem = null;
      },
      error: () => {
        this.isSaving = false;
        this.toast.error('Failed to update stock quantity.');
      }
    });
  }
}
