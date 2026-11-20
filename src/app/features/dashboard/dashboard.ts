import { Component, OnInit, inject } from '@angular/core';
import { AsyncPipe, CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TaskProjectService } from '../../core/services/task-project.service';
import { ScopedStatus } from '../../shared/components/scoped-status/scoped-status';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, AsyncPipe, RouterLink, ScopedStatus],
  template: `
    <section>
      <div class="header-row">
        <h1>Dashboard Summary</h1>
        <a routerLink="/projects" class="btn-primary">View All Projects</a>
      </div>

      <app-scoped-status
        [loading]="(loading$ | async) ?? false"
        loadingText="Computing aggregate stats..."
        [error]="error$ | async"
        actionLabel="Retry"
        (actionClick)="service.loadProjects(true)"
      />

      <div class="stats-grid" *ngIf="stats$ | async as stats">
        <div class="stat-card">
          <span class="stat-card__label">Total Projects</span>
          <strong class="stat-card__value">{{ stats.totalProjects }}</strong>
        </div>
        <div class="stat-card">
          <span class="stat-card__label">Total Tasks</span>
          <strong class="stat-card__value">{{ stats.totalTasks }}</strong>
        </div>
        <div class="stat-card">
          <span class="stat-card__label">Completed Tasks</span>
          <strong class="stat-card__value stat-card__value--done">{{ stats.completedTasks }}</strong>
        </div>
        <div class="stat-card">
          <span class="stat-card__label">Pending Tasks</span>
          <strong class="stat-card__value stat-card__value--pending">{{ stats.pendingTasks }}</strong>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .header-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.25rem;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 1rem;
    }
    .stat-card {
      padding: 1.1rem;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      background: #fff;
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
    }
    .stat-card__label {
      font-size: 0.85rem;
      color: #64748b;
    }
    .stat-card__value {
      font-size: 1.6rem;
      color: #0f172a;
    }
    .stat-card__value--done {
      color: #15803d;
    }
    .stat-card__value--pending {
      color: #b45309;
    }
    .btn-primary {
      padding: 0.5rem 0.9rem;
      border-radius: 6px;
      background: #2563eb;
      color: #fff;
      text-decoration: none;
      font-size: 0.9rem;
    }
  `],
})
export class Dashboard implements OnInit {
  readonly service = inject(TaskProjectService);
  readonly stats$ = this.service.dashboardStats$;
  readonly loading$ = this.service.projectsLoading$;
  readonly error$ = this.service.projectsError$;

  ngOnInit(): void {
    this.service.loadProjects();
  }
}