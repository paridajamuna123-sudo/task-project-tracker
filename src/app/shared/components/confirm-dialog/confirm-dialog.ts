import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirm-dialog',
  imports: [CommonModule],
  template: `
    <div class="backdrop" *ngIf="open" role="dialog" aria-modal="true">
      <div class="dialog">
        <h3 class="dialog__title">{{ title }}</h3>
        <p class="dialog__message">{{ message }}</p>
        <div class="dialog__actions">
          <button type="button" class="btn-cancel" (click)="cancel.emit()">
            {{ cancelText }}
          </button>
          <button type="button" class="btn-confirm" (click)="confirm.emit()">
            {{ confirmText }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .backdrop {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.45);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 50;
    }
    .dialog {
      background: #fff;
      padding: 1.25rem;
      border-radius: 10px;
      max-width: 400px;
      width: 90%;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
    }
    .dialog__title {
      margin: 0 0 0.5rem;
      font-size: 1.05rem;
    }
    .dialog__message {
      margin: 0 0 1.25rem;
      color: #475569;
      font-size: 0.9rem;
    }
    .dialog__actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem;
    }
    .btn-cancel {
      padding: 0.4rem 0.8rem;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      background: #fff;
      cursor: pointer;
    }
    .btn-confirm {
      padding: 0.4rem 0.8rem;
      border: none;
      border-radius: 6px;
      background: #dc2626;
      color: #fff;
      cursor: pointer;
    }
  `],
})
export class ConfirmDialog {
  @Input() open = false;
  @Input() title = 'Confirm Action';
  @Input() message = 'Are you sure you want to proceed?';
  @Input() confirmText = 'Confirm';
  @Input() cancelText = 'Cancel';

  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();
}