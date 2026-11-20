import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Task } from '../../../core/models/task.model';
import { StatusBadge } from '../status-badge/status-badge';

@Component({
  selector: 'app-task-card',
  imports: [CommonModule, StatusBadge],
  template: `
    <article class="task-card" [class.task-card--done]="task.completed">
      <div class="task-card__main">
        <label class="task-card__check">
          <input
            type="checkbox"
            [checked]="task.completed"
            [disabled]="disabled"
            (change)="toggleComplete.emit(task)"
          />
          <span class="task-card__title">{{ task.todo }}</span>
        </label>

        <div class="task-card__meta">
          <app-status-badge [variant]="task.priority" />
          <app-status-badge [variant]="task.completed ? 'Completed' : 'Pending'" />
          <span class="task-card__due">Due: {{ task.dueDate }}</span>
        </div>
      </div>

      <button
        type="button"
        class="btn-delete"
        [disabled]="disabled"
        (click)="requestDelete.emit(task)"
        aria-label="Delete task"
      >
        Delete
      </button>
    </article>
  `,
  styles: [`
    .task-card {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
      padding: 0.85rem 1rem;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      background: #fff;
    }
    .task-card--done .task-card__title {
      text-decoration: line-through;
      color: #64748b;
    }
    .task-card__main {
      display: flex;
      flex-direction: column;
      gap: 0.45rem;
    }
    .task-card__check {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      font-weight: 500;
      cursor: pointer;
    }
    .task-card__meta {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.8rem;
      color: #475569;
    }
    .btn-delete {
      padding: 0.35rem 0.75rem;
      border: 1px solid #fecaca;
      border-radius: 6px;
      background: #fff5f5;
      color: #b91c1c;
      font-size: 0.8rem;
      cursor: pointer;
    }
    .btn-delete:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  `],
})
export class TaskCard {
  @Input({ required: true }) task!: Task;
  @Input() disabled = false;

  @Output() toggleComplete = new EventEmitter<Task>();
  @Output() requestDelete = new EventEmitter<Task>();
}