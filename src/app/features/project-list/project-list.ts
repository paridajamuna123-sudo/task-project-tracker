import { Component, OnInit, inject } from '@angular/core';
import { AsyncPipe, CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TaskProjectService } from '../../core/services/task-project.service';
import { StatusBadge } from '../../shared/components/status-badge/status-badge';
import { ScopedStatus } from '../../shared/components/scoped-status/scoped-status';


@Component({
  selector: 'app-project-list',
  imports: [CommonModule, AsyncPipe, RouterLink, StatusBadge, ScopedStatus],
  template: `
    <section>
      <h1>Projects</h1>

      <app-scoped-status
        [loading]="(loading$ | async) ?? false"
        loadingText="Loading projects..."
        [error]="error$ | async"
        actionLabel="Retry"
        (actionClick)="service.loadProjects(true)"
      />

      <div class="project-list" *ngIf="projects$ | async as projects">
        <a
          *ngFor="let project of projects"
          [routerLink]="['/projects', project.userId]"
          class="project-card"
        >
          <div class="project-card__top">
            <h2 class="project-card__title">{{ project.title }}</h2>
            <app-status-badge [variant]="project.status" />
          </div>
          <p class="project-card__meta">
            {{ project.taskCount }} tasks · {{ project.completedCount }} completed · {{ project.pendingCount }} pending
          </p>
        </a>
      </div>
    </section>
  `,
  styles: [`
    h1 {
      margin-bottom: 1.25rem;
    }
    .project-list {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: 1rem;
    }
    .project-card {
      display: block;
      padding: 1rem;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      background: #fff;
      text-decoration: none;
      color: inherit;
      transition: border-color 0.15s ease;
    }
    .project-card:hover {
      border-color: #2563eb;
    }
    .project-card__top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 0.5rem;
    }
    .project-card__title {
      margin: 0;
      font-size: 1rem;
    }
    .project-card__meta {
      margin: 0.6rem 0 0;
      font-size: 0.85rem;
      color: #64748b;
    }
  `],
})
export class ProjectList implements OnInit {
  readonly service = inject(TaskProjectService);
  readonly projects$ = this.service.projects$;
  readonly loading$ = this.service.projectsLoading$;
  readonly error$ = this.service.projectsError$;

  ngOnInit(): void {
    this.service.loadProjects();
  }
}