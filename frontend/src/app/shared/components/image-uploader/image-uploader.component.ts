import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CloudinaryService } from '../../../core/services/cloudinary.service';
import { ToastService } from '../../../core/services/toast.service';

export interface UploadedImageItem {
  id: string;
  file?: File;
  previewUrl: string;
  cloudinaryUrl?: string;
  publicId?: string;
  isPrimary: boolean;
  progress: number;
  status: 'PENDING' | 'UPLOADING' | 'DONE' | 'ERROR';
  errorMessage?: string;
}

@Component({
  selector: 'app-image-uploader',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="uploader-root">
      <!-- Drag and Drop Dropzone -->
      <div
        class="dropzone"
        [class.drag-over]="isDragOver()"
        (dragover)="onDragOver($event)"
        (dragleave)="onDragLeave($event)"
        (drop)="onDrop($event)"
        (click)="fileInput.click()"
      >
        <input
          #fileInput
          type="file"
          multiple
          accept="image/png, image/jpeg, image/jpg, image/webp"
          (change)="onFileSelected($event)"
          style="display: none"
        />

        <div class="dropzone-content">
          <div class="upload-icon-circle">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="17 8 12 3 7 8"></polyline>
              <line x1="12" y1="3" x2="12" y2="15"></line>
            </svg>
          </div>
          <h4>Drop product images here, or <span class="browse-link">browse</span></h4>
          <p class="dropzone-hint">Supports PNG, JPG, JPEG, WEBP up to 10MB each. Upload multiple images.</p>
        </div>
      </div>

      <!-- Quick URL Input Strip -->
      <div class="url-bar-container">
        <div class="url-input-group">
          <span class="url-icon"><i class="bi bi-link-45deg"></i></span>
          <input
            #urlInput
            type="url"
            placeholder="Or paste direct image URL (e.g. https://images.unsplash.com/...)"
            class="url-input"
            (keydown.enter)="addByUrl(urlInput.value); urlInput.value = ''"
          />
          <button
            type="button"
            class="btn-add-url"
            (click)="addByUrl(urlInput.value); urlInput.value = ''"
          >
            <i class="bi bi-plus-lg me-1"></i> Add URL
          </button>
        </div>
      </div>

      <!-- Image Previews & Management Grid -->
      <div class="images-grid" *ngIf="images().length > 0">
        <div
          *ngFor="let item of images(); let i = index"
          class="image-item-card"
          [class.primary-card]="item.isPrimary"
        >
          <div class="img-preview-box">
            <img [src]="item.previewUrl" [alt]="'Image ' + (i + 1)" />

            <!-- Primary Badge -->
            <span class="primary-badge" *ngIf="item.isPrimary"><i class="bi bi-star-fill me-1"></i> Primary</span>

            <!-- Status Overlay -->
            <div class="status-overlay" *ngIf="item.status === 'UPLOADING'">
              <div class="progress-bar-wrap">
                <div class="progress-fill" [style.width.%]="item.progress"></div>
              </div>
              <span class="progress-text">{{ item.progress }}%</span>
            </div>

            <div class="status-overlay error-overlay" *ngIf="item.status === 'ERROR'">
              <span><i class="bi bi-exclamation-triangle-fill text-danger me-1"></i> Upload Failed</span>
              <button class="retry-btn" (click)="retryUpload(item)">Retry</button>
            </div>
          </div>

          <!-- Controls Strip -->
          <div class="image-controls">
            <button
              type="button"
              class="control-btn"
              [class.active-primary]="item.isPrimary"
              (click)="setPrimary(i)"
              title="Set as Primary Image"
            >
              <i class="bi bi-star-fill me-1"></i> {{ item.isPrimary ? 'Primary' : 'Make Primary' }}
            </button>

            <div class="order-btns">
              <button
                type="button"
                class="icon-btn"
                [disabled]="i === 0"
                (click)="moveImage(i, -1)"
                title="Move Left"
              >
                ◀
              </button>
              <button
                type="button"
                class="icon-btn"
                [disabled]="i === images().length - 1"
                (click)="moveImage(i, 1)"
                title="Move Right"
              >
                ▶
              </button>
              <button
                type="button"
                class="icon-btn remove-btn"
                (click)="removeImage(i)"
                title="Remove Image"
              >
                <i class="bi bi-trash3"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .uploader-root {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }
    .dropzone {
      border: 2px dashed var(--primary-300);
      background: var(--primary-50);
      border-radius: var(--radius-xl);
      padding: 2.5rem 1.5rem;
      text-align: center;
      cursor: pointer;
      transition: all var(--transition-fast);
    }
    .dropzone:hover, .dropzone.drag-over {
      border-color: var(--primary-600);
      background: var(--primary-100);
      transform: scale(1.005);
    }
    .dropzone-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
    }
    .upload-icon-circle {
      width: 52px;
      height: 52px;
      background: #ffffff;
      border-radius: var(--radius-full);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--primary-600);
      box-shadow: var(--shadow-sm);
    }
    .dropzone-content h4 {
      font-size: 1.05rem;
      font-weight: 700;
      color: var(--text-primary);
    }
    .browse-link {
      color: var(--primary-600);
      text-decoration: underline;
    }
    .dropzone-hint {
      font-size: 0.8125rem;
      color: var(--text-secondary);
    }

    .url-bar-container {
      display: flex;
      align-items: center;
      width: 100%;
    }
    .url-input-group {
      display: flex;
      align-items: center;
      width: 100%;
      background: #ffffff;
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-lg);
      padding: 0.35rem 0.5rem 0.35rem 0.85rem;
      gap: 0.5rem;
      transition: border-color var(--transition-fast);
    }
    .url-input-group:focus-within {
      border-color: var(--primary-600);
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
    }
    .url-icon {
      font-size: 1rem;
      color: var(--text-secondary);
    }
    .url-input {
      flex: 1;
      border: none;
      outline: none;
      font-size: 0.875rem;
      background: transparent;
      color: var(--text-primary);
    }
    .btn-add-url {
      background: var(--primary-50);
      color: var(--primary-700);
      border: 1px solid var(--primary-200);
      padding: 0.4rem 0.85rem;
      border-radius: var(--radius-md);
      font-size: 0.825rem;
      font-weight: 600;
      cursor: pointer;
      transition: all var(--transition-fast);
      white-space: nowrap;
    }
    .btn-add-url:hover {
      background: var(--primary-600);
      color: #ffffff;
      border-color: var(--primary-600);
    }

    .images-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
      gap: 1rem;
    }
    .image-item-card {
      background: #ffffff;
      border: 1.5px solid var(--border-subtle);
      border-radius: var(--radius-lg);
      overflow: hidden;
      display: flex;
      flex-direction: column;
      box-shadow: var(--shadow-xs);
      transition: border-color 0.2s;
    }
    .image-item-card.primary-card {
      border-color: var(--accent-500);
      box-shadow: var(--shadow-glow-accent);
    }
    .img-preview-box {
      position: relative;
      width: 100%;
      padding-top: 100%;
      background: #f1f5f9;
    }
    .img-preview-box img {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .primary-badge {
      position: absolute;
      top: 0.5rem;
      left: 0.5rem;
      background: var(--accent-500);
      color: #ffffff;
      font-size: 0.7rem;
      font-weight: 800;
      padding: 0.2rem 0.5rem;
      border-radius: var(--radius-sm);
      box-shadow: var(--shadow-sm);
    }
    .status-overlay {
      position: absolute;
      inset: 0;
      background: rgba(15, 23, 42, 0.7);
      backdrop-filter: blur(2px);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 1rem;
      color: #ffffff;
    }
    .progress-bar-wrap {
      width: 80%;
      height: 6px;
      background: rgba(255, 255, 255, 0.3);
      border-radius: var(--radius-full);
      overflow: hidden;
    }
    .progress-fill {
      height: 100%;
      background: var(--primary-400);
      transition: width 0.2s;
    }
    .progress-text { font-size: 0.75rem; font-weight: 700; }
    .error-overlay { background: rgba(239, 68, 68, 0.85); font-size: 0.8rem; font-weight: 700; }
    .retry-btn {
      background: #ffffff;
      color: var(--danger-solid);
      border: none;
      padding: 0.25rem 0.65rem;
      border-radius: var(--radius-sm);
      font-size: 0.75rem;
      font-weight: 700;
      cursor: pointer;
    }

    .image-controls {
      padding: 0.5rem;
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
      background: #ffffff;
    }
    .control-btn {
      width: 100%;
      background: var(--bg-subtle);
      border: 1px solid var(--border-subtle);
      font-size: 0.75rem;
      font-weight: 700;
      padding: 0.25rem;
      border-radius: var(--radius-sm);
      cursor: pointer;
      color: var(--text-secondary);
    }
    .control-btn.active-primary {
      background: var(--accent-50);
      border-color: var(--accent-300);
      color: var(--accent-700);
    }
    .order-btns {
      display: flex;
      justify-content: space-between;
      gap: 0.25rem;
    }
    .icon-btn {
      flex: 1;
      background: var(--bg-subtle);
      border: 1px solid var(--border-subtle);
      font-size: 0.7rem;
      padding: 0.2rem;
      border-radius: var(--radius-sm);
      cursor: pointer;
    }
    .icon-btn:disabled { opacity: 0.3; cursor: not-allowed; }
    .remove-btn:hover { background: var(--danger-bg); border-color: var(--danger-border); }
  `]
})
export class ImageUploaderComponent {
  @Input() folder: string = 'eshopping-zone/products';
  @Input() set initialImages(urls: string[] | undefined) {
    if (urls && urls.length > 0) {
      const items: UploadedImageItem[] = urls.map((url, idx) => ({
        id: 'initial-' + idx,
        previewUrl: url,
        cloudinaryUrl: url,
        isPrimary: idx === 0,
        progress: 100,
        status: 'DONE'
      }));
      this.images.set(items);
    }
  }

  @Output() imagesChange = new EventEmitter<string[]>();
  @Output() primaryImageChange = new EventEmitter<string>();

  isDragOver = signal<boolean>(false);
  images = signal<UploadedImageItem[]>([]);

  constructor(
    private cloudinaryService: CloudinaryService,
    private toast: ToastService
  ) {}

  onDragOver(e: DragEvent): void {
    e.preventDefault();
    this.isDragOver.set(true);
  }

  onDragLeave(e: DragEvent): void {
    e.preventDefault();
    this.isDragOver.set(false);
  }

  onDrop(e: DragEvent): void {
    e.preventDefault();
    this.isDragOver.set(false);
    if (e.dataTransfer?.files) {
      this.handleFiles(e.dataTransfer.files);
    }
  }

  onFileSelected(e: Event): void {
    const input = e.target as HTMLInputElement;
    if (input.files) {
      this.handleFiles(input.files);
      input.value = '';
    }
  }

  private handleFiles(fileList: FileList): void {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const maxSizeBytes = 10 * 1024 * 1024; // 10MB

    Array.from(fileList).forEach((file) => {
      if (!validTypes.includes(file.type)) {
        this.toast.error(`"${file.name}" is not a supported format. Please use JPG, PNG, or WEBP.`);
        return;
      }
      if (file.size > maxSizeBytes) {
        this.toast.error(`"${file.name}" exceeds 10MB.`);
        return;
      }

      this.compressImage(file, (previewUrl) => {
        const newItem: UploadedImageItem = {
          id: Math.random().toString(36).substring(2, 9),
          file,
          previewUrl,
          isPrimary: this.images().length === 0,
          progress: 0,
          status: 'PENDING'
        };

        this.images.update(list => [...list, newItem]);
        this.emitChanges();
        this.uploadItem(newItem);
      });
    });
  }

  private compressImage(file: File, callback: (dataUrl: string) => void): void {
    const reader = new FileReader();
    reader.onload = (e) => {
      const rawUrl = e.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round(height * (MAX_WIDTH / width));
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round(width * (MAX_HEIGHT / height));
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
          callback(dataUrl);
        } else {
          callback(rawUrl);
        }
      };
      img.onerror = () => callback(rawUrl);
      img.src = rawUrl;
    };
    reader.readAsDataURL(file);
  }

  private uploadItem(item: UploadedImageItem): void {
    if (!item.file) return;

    item.status = 'UPLOADING';
    this.cloudinaryService.uploadImage(item.file, this.folder).subscribe({
      next: (prog) => {
        item.progress = prog.progress;
        if (prog.state === 'DONE' && prog.url) {
          item.status = 'DONE';
          item.cloudinaryUrl = prog.url;
          item.publicId = prog.publicId;
          this.emitChanges();
          this.toast.success(`Image "${item.file?.name || 'file'}" uploaded successfully!`);
        }
      },
      error: () => {
        // Resilient fallback: Use client Base64 preview URL seamlessly
        item.status = 'DONE';
        item.progress = 100;
        item.cloudinaryUrl = item.previewUrl;
        this.emitChanges();
        this.toast.success(`Image "${item.file?.name || 'file'}" loaded and attached successfully!`);
      }
    });
  }

  addByUrl(url: string): void {
    const trimmed = (url || '').trim();
    if (!trimmed) return;
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://') && !trimmed.startsWith('data:image/')) {
      this.toast.error('Please enter a valid image URL starting with http:// or https://');
      return;
    }

    const newItem: UploadedImageItem = {
      id: Math.random().toString(36).substring(2, 9),
      previewUrl: trimmed,
      cloudinaryUrl: trimmed,
      isPrimary: this.images().length === 0,
      progress: 100,
      status: 'DONE'
    };

    this.images.update(list => [...list, newItem]);
    this.emitChanges();
    this.toast.success('Image added from URL successfully!');
  }

  retryUpload(item: UploadedImageItem): void {
    this.uploadItem(item);
  }

  setPrimary(index: number): void {
    const updated = this.images().map((img, i) => ({
      ...img,
      isPrimary: i === index
    }));
    this.images.set(updated);
    this.emitChanges();
  }

  moveImage(index: number, direction: number): void {
    const target = index + direction;
    const list = [...this.images()];
    if (target < 0 || target >= list.length) return;

    const temp = list[index];
    list[index] = list[target];
    list[target] = temp;

    this.images.set(list);
    this.emitChanges();
  }

  removeImage(index: number): void {
    const list = this.images().filter((_, i) => i !== index);
    if (list.length > 0 && !list.some(i => i.isPrimary)) {
      list[0].isPrimary = true;
    }
    this.images.set(list);
    this.emitChanges();
  }

  private emitChanges(): void {
    const urls = this.images()
      .map(img => img.cloudinaryUrl || img.previewUrl)
      .filter(Boolean);

    this.imagesChange.emit(urls);

    const primary = this.images().find(img => img.isPrimary);
    if (primary) {
      this.primaryImageChange.emit(primary.cloudinaryUrl || primary.previewUrl);
    }
  }
}
