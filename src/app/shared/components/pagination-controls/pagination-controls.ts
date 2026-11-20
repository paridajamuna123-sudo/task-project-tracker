import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-pagination-controls',
  imports: [CommonModule],
  template: `
    <nav class="pager" aria-label="Pagination" *ngIf="total > 0">
      <button
        type="button"
        class="pager__btn"
        [disabled]="disabled || isFirstPage"
        (click)="pageChange.emit(currentPage - 1)"
      >
        Previous
      </button>

      <span class="pager__info">
        Page {{ currentPage }} of {{ totalPages }} ({{ total }} total)
      </span>

      <button
        type="button"
        class="pager__btn"
        [disabled]="disabled || isLastPage"
        (click)="pageChange.emit(currentPage + 1)"
      >
        Next
      </button>
    </nav>
  `,
  styles: [`
    .pager {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
      margin-top: 1rem;
    }
    .pager__btn {
      padding: 0.4rem 0.85rem;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      background: #fff;
      cursor: pointer;
    }
    .pager__btn:disabled {
      opacity: 0.45;
      cursor: not-allowed;
    }
    .pager__info {
      font-size: 0.875rem;
      color: #475569;
    }
  `],
})
export class PaginationControls {
  @Input({ required: true }) total = 0;
  @Input({ required: true }) limit = 10;
  @Input({ required: true }) skip = 0;
  @Input() disabled = false;

  @Output() pageChange = new EventEmitter<number>();

  get totalPages(): number {
    if (this.total <= 0 || this.limit <= 0) {
      return 1;
    }
    return Math.ceil(this.total / this.limit);
  }

  get currentPage(): number {
    if (this.limit <= 0) {
      return 1;
    }
    return Math.min(this.totalPages, Math.floor(this.skip / this.limit) + 1);
  }

  get isFirstPage(): boolean {
    return this.skip <= 0 || this.currentPage <= 1;
  }

  get isLastPage(): boolean {
    return this.skip + this.limit >= this.total || this.currentPage >= this.totalPages;
  }
}