import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-logo',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="logo-container" [style.height.px]="height">
      <svg
        [attr.height]="height"
        viewBox="0 0 420 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        class="logo-svg"
      >
        <!-- Motion Speed Lines -->
        <path d="M40 38H85" stroke="#F97316" stroke-width="6" stroke-linecap="round" />
        <path d="M25 54H95" stroke="#FB923C" stroke-width="6" stroke-linecap="round" />
        <path d="M35 70H75" stroke="#F97316" stroke-width="6" stroke-linecap="round" />

        <!-- Location Pin in Cart -->
        <path
          d="M125 18C108.431 18 95 31.4315 95 48C95 68 125 96 125 96C125 96 155 68 155 48C155 31.4315 141.569 18 125 18Z"
          fill="url(#pinGradient)"
        />
        <circle cx="125" cy="46" r="10" fill="#FFFFFF" opacity="0.9" />

        <!-- Shopping Cart Basket -->
        <path
          d="M80 62H170L158 92H102L80 62Z"
          fill="url(#cartGradient)"
          stroke="#EA580C"
          stroke-width="3.5"
          stroke-linejoin="round"
        />

        <!-- Wheels -->
        <circle cx="108" cy="104" r="8" fill="#F97316" stroke="#4338CA" stroke-width="3" />
        <circle cx="152" cy="104" r="8" fill="#F97316" stroke="#4338CA" stroke-width="3" />

        <!-- Sparks / Stars -->
        <path d="M92 20L95 28L103 31L95 34L92 42L89 34L81 31L89 28L92 20Z" fill="#FBBF24" />
        <path d="M165 32L167 37L172 39L167 41L165 46L163 41L158 39L163 37L165 32Z" fill="#38BDF8" />

        <!-- Text: eshopping -->
        <text
          x="190"
          y="70"
          font-family="'Outfit', 'Plus Jakarta Sans', sans-serif"
          font-weight="800"
          font-size="44"
          [attr.fill]="textColor"
          letter-spacing="-1"
        >
          eshopping
        </text>

        <!-- Text: zone -->
        <text
          x="190"
          y="108"
          font-family="'Outfit', 'Plus Jakarta Sans', sans-serif"
          font-weight="800"
          font-size="44"
          fill="#F97316"
          letter-spacing="-1"
        >
          zone
        </text>

        <!-- Sparkle next to zone -->
        <path d="M305 84L307 90L313 92L307 94L305 100L303 94L297 92L303 90L305 84Z" fill="#38BDF8" />

        <!-- Gradients -->
        <defs>
          <linearGradient id="pinGradient" x1="95" y1="18" x2="155" y2="96" gradientUnits="userSpaceOnUse">
            <stop stop-color="#38BDF8" />
            <stop offset="1" stop-color="#0284C7" />
          </linearGradient>
          <linearGradient id="cartGradient" x1="80" y1="62" x2="170" y2="92" gradientUnits="userSpaceOnUse">
            <stop stop-color="#FDBA74" />
            <stop offset="1" stop-color="#F97316" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  `,
  styles: [`
    .logo-container {
      display: inline-flex;
      align-items: center;
      user-select: none;
    }
    .logo-svg {
      width: auto;
      max-height: 100%;
      display: block;
    }
  `]
})
export class LogoComponent {
  @Input() height: number = 42;
  @Input() textColor: string = '#0F172A';
}
