import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type BadgeVariant =
  | 'Low'
  | 'Medium'
  | 'High'
  | 'Completed'
  | 'In Progress'
  | 'Not Started'
  | 'Pending';

@Component({
  selector: 'app-status-badge',
  imports: [CommonModule],
  template: `
    <span class="badge" [ngClass]="'badge--' + variantSlug" [attr.aria-label]="label || variant">
      {{ label || variant }}
    </span>
  `,
  styles: [`
    .badge {
      display: inline-flex;
      align-items: center;
      padding: 0.2rem 0.6rem;
      border-radius: 999px;
      font-size: 0.75rem;
      font-weight: 600;
      line-height: 1.2;
      white-space: nowrap;
    }
    .badge--low, .badge--not-started {
      background: #e2e8f0;
      color: #334155;
    }
    .badge--medium, .badge--in-progress, .badge--pending {
      background: #fef3c7;
      color: #92400e;
    }
    .badge--high {
      background: #fee2e2;
      color: #991b1b;
    }
    .badge--completed {
      background: #dcfce7;
      color: #166534;
    }
  `],
})
export class StatusBadge {
  @Input({ required: true }) variant!: BadgeVariant;
  @Input() label?: string;

  get variantSlug(): string {
    return this.variant.toLowerCase().replace(/\s+/g, '-');
  }
}