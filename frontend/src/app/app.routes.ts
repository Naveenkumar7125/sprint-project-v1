import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { guestGuard } from './core/guards/guest.guard';

// Layouts
import { PublicLayoutComponent } from './layouts/public-layout/public-layout.component';
import { MerchantLayoutComponent } from './layouts/merchant-layout/merchant-layout.component';
import { AdminLayoutComponent } from './layouts/admin-layout/admin-layout.component';
import { DeliveryLayoutComponent } from './layouts/delivery-layout/delivery-layout.component';

// Features - Public
import { HomeComponent } from './features/public/home/home.component';
import { ProductListComponent } from './features/public/product-list/product-list.component';
import { ProductDetailComponent } from './features/public/product-detail/product-detail.component';
import { TrackingComponent } from './features/public/tracking/tracking.component';

// Features - Auth
import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { ForgotPasswordComponent } from './features/auth/forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './features/auth/reset-password/reset-password.component';

// Features - Customer
import { CartComponent } from './features/customer/cart/cart.component';
import { CheckoutComponent } from './features/customer/checkout/checkout.component';
import { OrderSuccessComponent } from './features/customer/order-success/order-success.component';
import { OrdersComponent } from './features/customer/orders/orders.component';
import { WalletComponent } from './features/customer/wallet/wallet.component';
import { ProfileComponent } from './features/customer/profile/profile.component';
import { NotificationsComponent } from './features/customer/notifications/notifications.component';

// Features - Merchant
import { MerchantDashboardComponent } from './features/merchant/dashboard/merchant-dashboard.component';
import { MerchantProductListComponent } from './features/merchant/product-list/merchant-product-list.component';
import { MerchantProductFormComponent } from './features/merchant/product-form/merchant-product-form.component';
import { MerchantInventoryComponent } from './features/merchant/inventory/merchant-inventory.component';

// Features - Admin
import { AdminDashboardComponent } from './features/admin/dashboard/admin-dashboard.component';
import { AdminUsersComponent } from './features/admin/users/admin-users.component';
import { AdminProductsComponent } from './features/admin/products/admin-products.component';
import { AdminCategoriesComponent } from './features/admin/categories/admin-categories.component';
import { AdminOrdersComponent } from './features/admin/orders/admin-orders.component';
import { AdminDeliveryAssignmentComponent } from './features/admin/delivery-assignment/admin-delivery-assignment.component';
import { AdminNotificationsComponent } from './features/admin/notifications/admin-notifications.component';

// Features - Delivery
import { DeliveryDashboardComponent } from './features/delivery/dashboard/delivery-dashboard.component';
import { DeliveryListComponent } from './features/delivery/my-deliveries/delivery-list.component';
import { AvailableDeliveriesComponent } from './features/delivery/available/available-deliveries.component';

export const routes: Routes = [
  // Public & Customer Storefront
  {
    path: '',
    component: PublicLayoutComponent,
    children: [
      { path: '', component: HomeComponent },
      { path: 'products', component: ProductListComponent },
      { path: 'products/:id', component: ProductDetailComponent },
      { path: 'categories/:category', component: ProductListComponent },
      { path: 'track-delivery', component: TrackingComponent },

      // Cart & Checkout
      { path: 'cart', component: CartComponent },
      { path: 'checkout', component: CheckoutComponent, canActivate: [authGuard] },
      { path: 'order-success/:orderId', component: OrderSuccessComponent, canActivate: [authGuard] },

      // Customer Account
      { path: 'account/orders', component: OrdersComponent, canActivate: [authGuard] },
      { path: 'account/wallet', component: WalletComponent, canActivate: [authGuard] },
      { path: 'account/profile', component: ProfileComponent, canActivate: [authGuard] },
      { path: 'account/addresses', component: ProfileComponent, canActivate: [authGuard] },
      { path: 'account/notifications', component: NotificationsComponent, canActivate: [authGuard] }
    ]
  },

  // Auth Pages
  {
    path: '',
    component: PublicLayoutComponent,
    children: [
      { path: 'login', component: LoginComponent, canActivate: [guestGuard] },
      { path: 'register', component: RegisterComponent, canActivate: [guestGuard] },
      { path: 'forgot-password', component: ForgotPasswordComponent },
      { path: 'reset-password', component: ResetPasswordComponent }
    ]
  },

  // Merchant Portal
  {
    path: 'merchant',
    component: MerchantLayoutComponent,
    canActivate: [roleGuard],
    data: { roles: ['MERCHANT', 'ADMIN'] },
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: MerchantDashboardComponent },
      { path: 'products', component: MerchantProductListComponent },
      { path: 'products/new', component: MerchantProductFormComponent },
      { path: 'products/:id/edit', component: MerchantProductFormComponent },
      { path: 'inventory', component: MerchantInventoryComponent },
      { path: 'profile', component: ProfileComponent }
    ]
  },

  // Admin Portal
  {
    path: 'admin',
    component: AdminLayoutComponent,
    canActivate: [roleGuard],
    data: { roles: ['ADMIN'] },
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: AdminDashboardComponent },
      { path: 'users', component: AdminUsersComponent },
      { path: 'products', component: AdminProductsComponent },
      { path: 'categories', component: AdminCategoriesComponent },
      { path: 'orders', component: AdminOrdersComponent },
      { path: 'delivery-assignment', component: AdminDeliveryAssignmentComponent },
      { path: 'notifications', component: AdminNotificationsComponent }
    ]
  },

  // Delivery Agent Portal
  {
    path: 'delivery',
    component: DeliveryLayoutComponent,
    canActivate: [roleGuard],
    data: { roles: ['DELIVERY_AGENT', 'ADMIN'] },
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DeliveryDashboardComponent },
      { path: 'available', component: AvailableDeliveriesComponent },
      { path: 'my-deliveries', component: DeliveryListComponent }
    ]
  },

  // Wildcard fallback
  { path: '**', redirectTo: '' }
];
