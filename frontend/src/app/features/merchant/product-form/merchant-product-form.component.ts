import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ProductService } from '../../../core/services/product.service';
import { InventoryService } from '../../../core/services/inventory.service';
import { AuthService } from '../../../core/auth/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { CategoryDto, ProductDto } from '../../../core/models/product.models';
import { ImageUploaderComponent } from '../../../shared/components/image-uploader/image-uploader.component';
import { SEED_CATEGORIES } from '../../../core/mocks/seed-products.data';

@Component({
  selector: 'app-merchant-product-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, ImageUploaderComponent],
  template: `
    <div class="product-form-page">
      <div class="form-header">
        <div>
          <h2>{{ isEditMode ? 'Edit Product Listing' : 'Create New Product Listing' }}</h2>
          <p>Provide detailed specifications and upload high-resolution Cloudinary images</p>
        </div>
        <a routerLink="/merchant/products" class="btn btn-secondary">← Back to Catalog</a>
      </div>

      <form [formGroup]="productForm" (ngSubmit)="onSubmit()" class="product-form-grid">
        <!-- Main Form Column -->
        <div class="form-main-col">
          <div class="card form-section-card">
            <h3>General Information</h3>

            <div class="form-group">
              <label class="form-label" for="name">Product Name *</label>
              <input
                id="name"
                type="text"
                formControlName="name"
                placeholder="e.g. Wireless Noise Cancelling Over-Ear Headphones"
                class="form-control"
              />
            </div>

            <div class="form-group">
              <label class="form-label" for="description">Detailed Description *</label>
              <textarea
                id="description"
                rows="5"
                formControlName="description"
                placeholder="Describe features, battery life, material, dimensions, package contents..."
                class="form-control"
              ></textarea>
            </div>
          </div>

          <!-- Cloudinary Multi-Image Uploader Section -->
          <div class="card form-section-card">
            <h3>Product Media & Cloudinary Gallery</h3>
            <p class="section-subtext">Upload multiple images. Click "Make Primary" to select the main catalog thumbnail.</p>

            <app-image-uploader
              folder="eshopping-zone/products"
              [initialImages]="existingImages"
              (imagesChange)="onImagesChange($event)"
              (primaryImageChange)="onPrimaryImageChange($event)"
            ></app-image-uploader>
          </div>

          <!-- Dynamic Specifications Builder -->
          <div class="card form-section-card">
            <div class="specs-header">
              <h3>Technical Specifications</h3>
              <button type="button" class="btn btn-secondary btn-sm" (click)="addSpecRow()">
                <i class="bi bi-plus-lg me-1"></i> Add Specification
              </button>
            </div>

            <div formArrayName="specificationsArray" class="specs-builder-list">
              <div
                *ngFor="let spec of specsArray.controls; let i = index"
                [formGroupName]="i"
                class="spec-builder-row"
              >
                <input type="text" formControlName="key" placeholder="Key (e.g. Battery Life)" class="form-control" />
                <input type="text" formControlName="value" placeholder="Value (e.g. 40 Hours)" class="form-control" />
                <button type="button" class="btn btn-danger btn-sm" (click)="removeSpecRow(i)"><i class="bi bi-trash"></i></button>
              </div>
            </div>
          </div>
        </div>

        <!-- Sidebar Options Column -->
        <div class="form-sidebar-col">
          <div class="card form-section-card">
            <h3>Pricing & Category</h3>

            <div class="form-group">
              <label class="form-label" for="price">Price (₹ INR) *</label>
              <input
                id="price"
                type="number"
                step="0.01"
                formControlName="price"
                placeholder="0.00"
                class="form-control"
              />
            </div>

            <div class="form-group">
              <label class="form-label" for="categoryId">Category *</label>
              <div *ngIf="isMerchantLocked()" class="merchant-lock-badge">
                <span class="lock-icon"><i class="bi bi-lock-fill"></i></span>
                <div>
                  <strong>Assigned: {{ assignedCategoryName() }}</strong>
                  <small class="d-block">Your merchant account is authorized for this category</small>
                </div>
              </div>
              <select
                id="categoryId"
                formControlName="categoryId"
                class="form-select"
                [attr.disabled]="isMerchantLocked() ? true : null"
              >
                <option value="">Select Category</option>
                <option *ngFor="let cat of displayedCategories()" [value]="cat.id">
                  {{ cat.name }}
                </option>
              </select>
            </div>

            <div class="form-group" *ngIf="!isEditMode">
              <label class="form-label" for="initialStock">Initial Stock Quantity</label>
              <input
                id="initialStock"
                type="number"
                formControlName="initialStock"
                placeholder="0"
                class="form-control"
              />
            </div>

            <div class="form-group">
              <label class="checkbox-label">
                <input type="checkbox" formControlName="active" />
                <span>Publish as Active Listing</span>
              </label>
            </div>

            <button type="submit" class="btn btn-accent btn-lg submit-btn" [disabled]="productForm.invalid || isSubmitting">
              <span *ngIf="!isSubmitting"><i class="bi bi-check-circle-fill me-1"></i> {{ isEditMode ? 'Update Product Listing' : 'Publish Product' }}</span>
              <span *ngIf="isSubmitting">Saving Product...</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .product-form-page { display: flex; flex-direction: column; gap: 2rem; }
    .form-header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; }
    .form-header h2 { font-size: 1.85rem; font-weight: 800; }

    .product-form-grid {
      display: grid;
      grid-template-columns: 1fr 340px;
      gap: 2rem;
      align-items: flex-start;
    }
    .form-main-col { display: flex; flex-direction: column; gap: 1.5rem; }
    .form-sidebar-col { display: flex; flex-direction: column; gap: 1.5rem; }

    .form-section-card {
      padding: 1.75rem;
      background: #ffffff;
      border: 1px solid var(--border-subtle);
    }
    .form-section-card h3 { font-size: 1.15rem; font-weight: 700; margin-bottom: 0.25rem; }
    .section-subtext { font-size: 0.8125rem; color: var(--text-muted); margin-bottom: 1.25rem; }

    .specs-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
    .specs-builder-list { display: flex; flex-direction: column; gap: 0.75rem; }
    .spec-builder-row { display: grid; grid-template-columns: 1fr 1fr 40px; gap: 0.5rem; align-items: center; }

    .merchant-lock-badge {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: #f0fdf4;
      border: 1px solid #86efac;
      padding: 0.5rem 0.75rem;
      border-radius: 8px;
      margin-bottom: 0.5rem;
      font-size: 0.8rem;
      color: #166534;
    }
    .lock-icon { font-size: 1rem; }

    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-weight: 600;
      font-size: 0.9rem;
      cursor: pointer;
    }
    .submit-btn { width: 100%; margin-top: 1rem; }

    @media (max-width: 900px) {
      .product-form-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class MerchantProductFormComponent implements OnInit {
  productForm!: FormGroup;
  isEditMode: boolean = false;
  productId?: number;
  categories = signal<CategoryDto[]>([]);
  isSubmitting: boolean = false;

  uploadedImages: string[] = [];
  primaryImage: string = '';
  existingImages: string[] = [];

  isMerchantLocked = computed(() => {
    const user = this.authService.currentUser();
    return user?.role === 'MERCHANT' && !!user?.assignedCategoryId;
  });

  assignedCategoryName = computed(() => {
    const user = this.authService.currentUser();
    return user?.assignedCategoryName || 'Assigned Domain';
  });

  displayedCategories = computed(() => {
    if (this.isMerchantLocked()) {
      const user = this.authService.currentUser();
      const filtered = this.categories().filter(c => c.id === user?.assignedCategoryId);
      if (filtered.length > 0) return filtered;
      if (user?.assignedCategoryId) {
        return [{
          id: user.assignedCategoryId,
          name: user.assignedCategoryName || 'Assigned Category',
          description: 'Merchant Authorized Category'
        }];
      }
    }
    return this.categories();
  });

  constructor(
    private fb: FormBuilder,
    private productService: ProductService,
    private inventoryService: InventoryService,
    private authService: AuthService,
    private toast: ToastService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    const user = this.authService.currentUser();
    const initialCategoryId = (user?.role === 'MERCHANT' && user?.assignedCategoryId) ? user.assignedCategoryId : '';

    this.productForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(150)]],
      description: ['', [Validators.required, Validators.maxLength(2000)]],
      price: ['', [Validators.required, Validators.min(0.01)]],
      categoryId: [initialCategoryId, [Validators.required]],
      initialStock: [10, [Validators.min(0)]],
      active: [true],
      specificationsArray: this.fb.array([])
    });

    this.productService.getAllCategories().subscribe({
      next: (cats) => {
        if (cats && cats.length > 0) {
          this.categories.set(cats);
        } else {
          this.categories.set(SEED_CATEGORIES);
        }
        if (this.isMerchantLocked() && user?.assignedCategoryId) {
          this.productForm.patchValue({ categoryId: user.assignedCategoryId });
        }
      },
      error: () => {
        this.categories.set(SEED_CATEGORIES);
        if (this.isMerchantLocked() && user?.assignedCategoryId) {
          this.productForm.patchValue({ categoryId: user.assignedCategoryId });
        }
      }
    });

    this.productId = +this.route.snapshot.params['id'];
    if (this.productId) {
      this.isEditMode = true;
      this.loadProductForEdit(this.productId);
    }
  }

  get specsArray(): FormArray {
    return this.productForm.get('specificationsArray') as FormArray;
  }

  addSpecRow(key: string = '', value: string = ''): void {
    this.specsArray.push(this.fb.group({
      key: [key, Validators.required],
      value: [value, Validators.required]
    }));
  }

  removeSpecRow(index: number): void {
    this.specsArray.removeAt(index);
  }

  private loadProductForEdit(id: number): void {
    this.productService.getProductById(id).subscribe({
      next: (prod) => {
        this.productForm.patchValue({
          name: prod.name,
          description: prod.description,
          price: prod.price,
          categoryId: prod.categoryId,
          active: prod.active
        });

        if (prod.imageUrl) {
          this.existingImages.push(prod.imageUrl);
          this.primaryImage = prod.imageUrl;
        }

        if (prod.specifications) {
          Object.entries(prod.specifications).forEach(([k, v]) => {
            if (k !== 'galleryImages') {
              this.addSpecRow(k, v);
            }
          });
        }
      },
      error: () => this.toast.error('Could not load product for editing')
    });
  }

  onImagesChange(urls: string[]): void {
    this.uploadedImages = urls;
  }

  onPrimaryImageChange(primaryUrl: string): void {
    this.primaryImage = primaryUrl;
  }

  onSubmit(): void {
    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      this.toast.error('Please fill in all required product fields.');
      return;
    }

    this.isSubmitting = true;

    // Convert specs array to Record<string, string>
    const specsMap: Record<string, string> = {};
    this.specsArray.controls.forEach(control => {
      const { key, value } = control.value;
      if (key && value) {
        specsMap[key] = value;
      }
    });

    // Store additional gallery images in specifications
    if (this.uploadedImages.length > 1) {
      specsMap['galleryImages'] = JSON.stringify(this.uploadedImages);
    }

    let mainImage = this.primaryImage || this.uploadedImages[0] || '';
    const user = this.authService.currentUser();
    const finalCatId = (this.isMerchantLocked() && user?.assignedCategoryId) ? user.assignedCategoryId : +this.productForm.value.categoryId;

    const payload: any = {
      name: this.productForm.value.name,
      description: this.productForm.value.description,
      price: this.productForm.value.price,
      categoryId: finalCatId,
      imageUrl: mainImage,
      specifications: specsMap,
      active: this.productForm.value.active
    };

    if (this.isEditMode && this.productId) {
      this.productService.updateProduct(this.productId, payload).subscribe({
        next: () => {
          this.isSubmitting = false;
          this.toast.success('Product updated successfully!');
          this.router.navigate(['/merchant/products']);
        },
        error: (err) => {
          this.isSubmitting = false;
          this.toast.error(err?.error?.message || err?.message || 'Failed to update product listing');
        }
      });
    } else {
      const stock = this.productForm.value.initialStock ?? 10;
      payload.initialStock = stock;
      this.productService.createProduct(payload).subscribe({
        next: (created) => {
          if (created && created.id && stock > 0) {
            this.inventoryService.updateStock(created.id, stock).subscribe({
              error: () => logNoop()
            });
          }
          this.isSubmitting = false;
          this.toast.success('Product created and published successfully!');
          this.router.navigate(['/merchant/products']);
        },
        error: (err) => {
          this.isSubmitting = false;
          this.toast.error(err?.error?.message || err?.message || 'Failed to publish product listing');
        }
      });
    }
  }
}

function logNoop() {}
