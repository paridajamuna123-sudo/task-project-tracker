import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { AsyncPipe, CommonModule } from '@angular/common';




import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TaskProjectService } from '../../core/services/task-project.service';
import { Task, TaskPriority } from '../../core/models/task.model';
import { TaskCard } from '../../shared/components/task-card/task-card';
import { PaginationControls } from '../../shared/components/pagination-controls/pagination-controls';
import { ConfirmDialog } from '../../shared/components/confirm-dialog/confirm-dialog';
import { ScopedStatus } from '../../shared/components/scoped-status/scoped-status';


function getLocalTodayStr(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function notPastDateValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value as string | null;
  if (!value) {
    return null;
  }
  return value < getLocalTodayStr() ? { pastDate: true } : null;
}



@Component({
  selector: 'app-project-detail',
  imports: [
    CommonModule,
    AsyncPipe,
    RouterLink,
    ReactiveFormsModule,
    TaskCard,
    PaginationControls,
    ConfirmDialog,
    ScopedStatus,
  ],
  template: `
    <section>
      <div class="top-bar">
        <div>
          <a routerLink="/projects" class="back-link">&larr; Back to Projects</a>
          <h1>Project - User {{ userId }}</h1>
        </div>

        <label class="sim-toggle">
          <input
            type="checkbox"
            [checked]="(service.simulateFailure$ | async) ?? false"
            (change)="onToggleSimulateFailure($event)"
          />
          Simulate API failure (500)
        </label>
      </div>

      <form class="task-form" [formGroup]="taskForm" (ngSubmit)="onCreateTask()">
        <h2>Add New Task</h2>

        <div class="form-grid">
          <div class="field">
            <label for="todo">Task Title</label>
            <input id="todo" type="text" formControlName="todo" placeholder="e.g., Review PR" />
            <small class="error-text" *ngIf="taskForm.controls.todo.touched && taskForm.controls.todo.hasError('required')">
              Task title is required.
            </small>
            <small class="error-text" *ngIf="taskForm.controls.todo.touched && taskForm.controls.todo.hasError('minlength')">
              Task title must be at least 3 characters.
            </small>
          </div>

          <div class="field">
            <label for="dueDate">Due Date</label>
            <input id="dueDate" type="date" formControlName="dueDate" [min]="todayStr" />
            <small class="error-text" *ngIf="taskForm.controls.dueDate.touched && taskForm.controls.dueDate.hasError('required')">
              Due date is required.
            </small>
            <small class="error-text" *ngIf="taskForm.controls.dueDate.touched && taskForm.controls.dueDate.hasError('pastDate')">
              Due date cannot be in the past.
            </small>
          </div>

          <div class="field">
            <label for="priority">Priority</label>
            <select id="priority" formControlName="priority">
              <option *ngFor="let p of priorities" [value]="p">{{ p }}</option>
            </select>
          </div>
        </div>

        <button
          type="submit"
          class="btn-submit"
          [disabled]="taskForm.invalid || ((service.mutationLoading$ | async) ?? false)"
        >
          {{ ((service.mutationLoading$ | async) ?? false) ? 'Adding...' : 'Add Task' }}
        </button>
      </form>

      <app-scoped-status
        [error]="service.mutationError$ | async"
        actionLabel="Dismiss"
        (actionClick)="service.clearMutationError()"
      />

      <app-scoped-status
        [loading]="(service.tasksLoading$ | async) ?? false"
        loadingText="Loading tasks from server..."
        [error]="service.tasksError$ | async"
        actionLabel="Retry"
        (actionClick)="reloadCurrentPage()"
      />

      <ng-container *ngIf="!(service.tasksLoading$ | async) && !(service.tasksError$ | async)">
        <ng-container *ngIf="(service.tasks$ | async) as tasks">
          <div class="empty-state" *ngIf="tasks.length === 0">
            No tasks found for this project yet. Add one above!
          </div>

          <div class="task-list" *ngIf="tasks.length > 0">
            <app-task-card
              *ngFor="let task of tasks; trackBy: trackByLocalId"
              [task]="task"
              (toggleComplete)="service.toggleTaskCompletion($event)"
              (requestDelete)="openDeleteConfirm($event)"
            />
          </div>
        </ng-container>

        <app-pagination-controls
          [total]="(service.totalTasks$ | async) ?? 0"
          [limit]="pageSize"
          [skip]="skip"
          [disabled]="(service.tasksLoading$ | async) ?? false"
          (pageChange)="onPageChange($event)"
        />
      </ng-container>

      <app-confirm-dialog
        [open]="!!pendingDeleteTask"
        title="Delete Task"
        [message]="pendingDeleteTask ? 'Are you sure you want to delete &quot;' + pendingDeleteTask.todo + '&quot;?' : ''"
        confirmText="Delete"
        (confirm)="confirmDelete()"
        (cancel)="cancelDelete()"
      />
    </section>
  `,
  styles: [`
    .top-bar {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 1rem;
      margin-bottom: 1.25rem;
    }
    .back-link {
      font-size: 0.85rem;
      color: #2563eb;
      text-decoration: none;
    }
    h1 {
      margin: 0.25rem 0 0;
    }
    .sim-toggle {
      display: flex;
      align-items: center;
      gap: 0.45rem;
      font-size: 0.85rem;
      padding: 0.45rem 0.75rem;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      background: #f8fafc;
      cursor: pointer;
    }
    .task-form {
      padding: 1rem 1.25rem;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      background: #fff;
      margin-bottom: 1.25rem;
    }
    .task-form h2 {
      margin: 0 0 0.85rem;
      font-size: 1rem;
    }
    .form-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 0.9rem;
      margin-bottom: 1rem;
    }
    .field {
      display: flex;
      flex-direction: column;
      gap: 0.3rem;
    }
    .field label {
      font-size: 0.85rem;
      font-weight: 500;
    }
    .field input, .field select {
      padding: 0.45rem 0.6rem;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      font-size: 0.9rem;
    }
    .error-text {
      color: #dc2626;
      font-size: 0.78rem;
    }
    .btn-submit {
      padding: 0.5rem 1rem;
      border: none;
      border-radius: 6px;
      background: #2563eb;
      color: #fff;
      font-size: 0.9rem;
      cursor: pointer;
    }
    .btn-submit:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .task-list {
      display: flex;
      flex-direction: column;
      gap: 0.65rem;
    }
    .empty-state {
      padding: 2rem;
      text-align: center;
      border: 1px dashed #cbd5e1;
      border-radius: 8px;
      color: #64748b;
    }
  `],
})
export class ProjectDetail implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  readonly service = inject(TaskProjectService);

  readonly pageSize = 5;
  readonly priorities: TaskPriority[] = ['Low', 'Medium', 'High'];
  readonly todayStr = getLocalTodayStr();

  userId = 0;
  skip = 0;
  pendingDeleteTask: Task | null = null;

  readonly taskForm = this.fb.nonNullable.group({
    todo: ['', [Validators.required, Validators.minLength(3)]],
    dueDate: [this.todayStr, [Validators.required, notPastDateValidator]],
    priority: ['Medium' as TaskPriority, [Validators.required]],
  });

  ngOnInit(): void {
    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        this.userId = Number(params.get('userId')) || 0;
        this.skip = 0;
        this.reloadCurrentPage();
      });
  }

  reloadCurrentPage(): void {
    if (!this.userId) {
      return;
    }
    this.service.requestProjectTasks({
      userId: this.userId,
      limit: this.pageSize,
      skip: this.skip,
    });
  }

  onPageChange(newPage: number): void {
    const nextSkip = Math.max(0, (newPage - 1) * this.pageSize);
    this.skip = nextSkip;
    this.reloadCurrentPage();
  }

  onCreateTask(): void {
    if (this.taskForm.invalid || !this.userId) {
      this.taskForm.markAllAsTouched();
      return;
    }

    const { todo, dueDate, priority } = this.taskForm.getRawValue();
    this.service
      .createTask({
        todo: todo.trim(),
        dueDate,
        priority,
        userId: this.userId,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((created) => {
        if (created) {
          this.taskForm.reset({
            todo: '',
            dueDate: this.todayStr,
            priority: 'Medium',
          });
        }
      });
  }

  onToggleSimulateFailure(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.service.setSimulateFailure(checked);
  }

  openDeleteConfirm(task: Task): void {
    this.pendingDeleteTask = task;
  }

  cancelDelete(): void {
    this.pendingDeleteTask = null;
  }

  confirmDelete(): void {
    if (this.pendingDeleteTask) {
      this.service.deleteTask(this.pendingDeleteTask);
      this.pendingDeleteTask = null;
    }
  }

  trackByLocalId(_index: number, task: Task): string {
    return task.localId;
  }
}