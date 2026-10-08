import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-star-rating',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="stars-wrap" [class.interactive]="interactive">
      <span
        *ngFor="let star of [1, 2, 3, 4, 5]"
        class="star"
        [class.filled]="star <= (hoverRating || rating)"
        (click)="setRating(star)"
        (mouseenter)="hoverRating = interactive ? star : 0"
        (mouseleave)="hoverRating = 0"
      >
        <i class="bi" [ngClass]="star <= (hoverRating || rating) ? 'bi-star-fill' : 'bi-star'"></i>
      </span>
      <span *ngIf="showValue" class="rating-text">
        {{ rating > 0 ? rating.toFixed(1) : 'No ratings' }}
      </span>
    </div>
  `,
  styles: [`
    .stars-wrap {
      display: inline-flex;
      align-items: center;
      gap: 2px;
      color: #cbd5e1;
      font-size: 1.15rem;
      user-select: none;
    }
    .star {
      transition: color 0.15s, transform 0.15s;
    }
    .star.filled {
      color: #f59e0b;
    }
    .interactive .star {
      cursor: pointer;
    }
    .interactive .star:hover {
      transform: scale(1.2);
      color: #fbbf24;
    }
    .rating-text {
      font-size: 0.85rem;
      font-weight: 700;
      color: var(--text-primary);
      margin-left: 0.35rem;
    }
  `]
})
export class StarRatingComponent {
  @Input() rating: number = 0;
  @Input() showValue: boolean = false;
  @Input() interactive: boolean = false;
  @Output() ratingChange = new EventEmitter<number>();

  hoverRating: number = 0;

  setRating(value: number): void {
    if (this.interactive) {
      this.rating = value;
      this.ratingChange.emit(value);
    }
  }
}
