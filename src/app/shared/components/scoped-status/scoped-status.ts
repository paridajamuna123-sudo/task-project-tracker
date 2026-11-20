import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-scoped-status',
  imports: [CommonModule],
  template: `
    <div class="status-box status-box--loading" *ngIf="loading" role="status">
      <span class="spinner" aria-hidden="true"></span>
      <span>{{ loadingText }}</span>
    </div>

    <div class="status-box status-box--error" *ngIf="!loading && error" role="alert">
      <span>{{ error }}</span>
      <button
        type="button"
        class="status-box__btn"
        *ngIf="actionLabel"
        (click)="actionClick.emit()"
      >
        {{ actionLabel }}
      </button>
    </div>
  `,
  styles: [`
    .status-box {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      padding: 0.75rem 1rem;
      border-radius: 8px;
      margin: 0.75rem 0;
      font-size: 0.9rem;
    }
    .status-box--loading {
      background: #f1f5f9;
      color: #334155;
    }
    .status-box--error {
      justify-content: space-between;
      background: #fef2f2;
      color: #991b1b;
      border: 1px solid #fecaca;
    }
    .status-box__btn {
      padding: 0.3rem 0.65rem;
      border: 1px solid #fca5a5;
      border-radius: 6px;
      background: #fff;
      color: #991b1b;
      cursor: pointer;
      font-size: 0.8rem;
    }
    .spinner {
      width: 1rem;
      height: 1rem;
      border: 2px solid #cbd5e1;
      border-top-color: #2563eb;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `],
})
export class ScopedStatus {
  @Input() loading = false;
  @Input() loadingText = 'Loading...';
  @Input() error: string | null = null;
  @Input() actionLabel?: string;

  @Output() actionClick = new EventEmitter<void>();
}