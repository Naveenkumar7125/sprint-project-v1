import { Component, Input, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CloudinaryService } from '../../../core/services/cloudinary.service';

@Component({
  selector: 'app-image-gallery',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="gallery-root">
      <!-- Main Featured Image -->
      <div class="main-image-wrap">
        <img
          [src]="activeImageUrl()"
          [alt]="altText"
          class="main-img"
          (error)="onMainImageError($event)"
        />
      </div>

      <!-- Thumbnail Strip -->
      <div class="thumbnails-strip" *ngIf="images && images.length > 1">
        <button
          *ngFor="let img of images; let i = index"
          class="thumb-btn"
          [class.active]="img === activeImageUrl()"
          (click)="setActiveImage(img)"
        >
          <img [src]="getThumbUrl(img)" [alt]="'Thumb ' + (i + 1)" />
        </button>
      </div>
    </div>
  `,
  styles: [`
    .gallery-root {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .main-image-wrap {
      position: relative;
      width: 100%;
      padding-top: 85%;
      background: #f8fafc;
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-xl);
      overflow: hidden;
      box-shadow: var(--shadow-sm);
    }
    .main-img {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      object-fit: contain;
      padding: 1rem;
      transition: transform 0.25s ease;
    }
    .main-image-wrap:hover .main-img {
      transform: scale(1.08);
    }
    .thumbnails-strip {
      display: flex;
      gap: 0.75rem;
      overflow-x: auto;
      padding-bottom: 0.5rem;
    }
    .thumb-btn {
      width: 72px;
      height: 72px;
      border-radius: var(--radius-md);
      border: 2px solid var(--border-subtle);
      padding: 2px;
      background: #ffffff;
      cursor: pointer;
      overflow: hidden;
      flex-shrink: 0;
      transition: all var(--transition-fast);
    }
    .thumb-btn.active {
      border-color: var(--primary-600);
      box-shadow: var(--shadow-glow);
    }
    .thumb-btn img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      border-radius: calc(var(--radius-md) - 2px);
    }
  `]
})
export class ImageGalleryComponent implements OnInit {
  @Input() images: string[] = [];
  @Input() primaryImage: string = '';
  @Input() altText: string = 'Product Image';

  activeImageUrl = signal<string>('');

  constructor(private cloudinaryService: CloudinaryService) {}

  ngOnInit(): void {
    if (this.primaryImage) {
      this.activeImageUrl.set(this.primaryImage);
    } else if (this.images && this.images.length > 0) {
      this.activeImageUrl.set(this.images[0]);
    } else {
      this.activeImageUrl.set('https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80');
    }
  }

  setActiveImage(url: string): void {
    this.activeImageUrl.set(url);
  }

  getThumbUrl(url: string): string {
    return this.cloudinaryService.getOptimizedUrl(url, 100, 100);
  }

  onMainImageError(event: any): void {
    event.target.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80';
  }
}
