import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="pagination-container" *ngIf="totalPages > 1">
      <button
        class="page-btn prev-btn"
        [disabled]="currentPage === 0"
        (click)="changePage(currentPage - 1)"
      >
        ‹ Prev
      </button>

      <div class="page-numbers">
        <button
          *ngFor="let p of pages"
          class="page-num-btn"
          [class.active]="p === currentPage"
          (click)="changePage(p)"
        >
          {{ p + 1 }}
        </button>
      </div>

      <button
        class="page-btn next-btn"
        [disabled]="currentPage >= totalPages - 1"
        (click)="changePage(currentPage + 1)"
      >
        Next ›
      </button>
    </div>
  `,
  styles: [`
    .pagination-container {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      margin: 2.5rem 0 1.5rem;
    }
    .page-btn, .page-num-btn {
      padding: 0.5rem 0.85rem;
      border: 1px solid var(--border-subtle);
      background: #ffffff;
      color: var(--text-primary);
      font-weight: 600;
      font-size: 0.875rem;
      border-radius: var(--radius-md);
      cursor: pointer;
      transition: all var(--transition-fast);
    }
    .page-btn:hover:not(:disabled), .page-num-btn:hover:not(.active) {
      background: var(--bg-subtle);
      border-color: var(--border-strong);
    }
    .page-btn:disabled {
      opacity: 0.45;
      cursor: not-allowed;
    }
    .page-num-btn.active {
      background: var(--primary-600);
      color: #ffffff;
      border-color: var(--primary-600);
      box-shadow: var(--shadow-sm);
    }
    .page-numbers {
      display: flex;
      gap: 0.35rem;
    }
  `]
})
export class PaginationComponent {
  @Input() currentPage: number = 0;
  @Input() totalPages: number = 1;
  @Output() pageChange = new EventEmitter<number>();

  get pages(): number[] {
    const visiblePages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(0, this.currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(this.totalPages, start + maxVisible);

    if (end - start < maxVisible) {
      start = Math.max(0, end - maxVisible);
    }

    for (let i = start; i < end; i++) {
      visiblePages.push(i);
    }
    return visiblePages;
  }

  changePage(page: number): void {
    if (page >= 0 && page < this.totalPages && page !== this.currentPage) {
      this.pageChange.emit(page);
    }
  }
}
