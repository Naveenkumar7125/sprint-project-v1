import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-skeleton-loader',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="skeleton-grid" [ngSwitch]="type">
      <!-- Product Card Skeleton -->
      <ng-container *ngSwitchCase="'product'">
        <div class="product-skeleton-card" *ngFor="let item of countArray">
          <div class="skeleton img-placeholder"></div>
          <div class="skeleton-body">
            <div class="skeleton title-placeholder"></div>
            <div class="skeleton desc-placeholder"></div>
            <div class="skeleton price-placeholder"></div>
          </div>
        </div>
      </ng-container>

      <!-- Table Rows Skeleton -->
      <ng-container *ngSwitchCase="'table'">
        <div class="table-skeleton-row" *ngFor="let item of countArray">
          <div class="skeleton col-placeholder" style="width: 20%;"></div>
          <div class="skeleton col-placeholder" style="width: 35%;"></div>
          <div class="skeleton col-placeholder" style="width: 25%;"></div>
          <div class="skeleton col-placeholder" style="width: 15%;"></div>
        </div>
      </ng-container>

      <!-- Stats Card Skeleton -->
      <ng-container *ngSwitchCase="'stat'">
        <div class="stat-skeleton-card" *ngFor="let item of countArray">
          <div class="skeleton stat-title-placeholder"></div>
          <div class="skeleton stat-value-placeholder"></div>
        </div>
      </ng-container>
    </div>
  `,
  styles: [`
    .skeleton-grid {
      display: grid;
      gap: 1.5rem;
      width: 100%;
    }
    .product-skeleton-card {
      background: #ffffff;
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-lg);
      overflow: hidden;
    }
    .img-placeholder {
      width: 100%;
      padding-top: 80%;
    }
    .skeleton-body {
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    .title-placeholder { height: 1.25rem; width: 85%; }
    .desc-placeholder { height: 1rem; width: 65%; }
    .price-placeholder { height: 1.5rem; width: 40%; }

    .table-skeleton-row {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      background: #ffffff;
      border-bottom: 1px solid var(--border-subtle);
    }
    .col-placeholder { height: 1.25rem; }

    .stat-skeleton-card {
      background: #ffffff;
      padding: 1.5rem;
      border-radius: var(--radius-lg);
      border: 1px solid var(--border-subtle);
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    .stat-title-placeholder { height: 0.85rem; width: 50%; }
    .stat-value-placeholder { height: 2rem; width: 40%; }
  `]
})
export class SkeletonLoaderComponent {
  @Input() type: 'product' | 'table' | 'stat' = 'product';
  @Input() count: number = 4;

  get countArray(): number[] {
    return Array.from({ length: this.count }, (_, i) => i);
  }
}
