import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  BehaviorSubject,
  EMPTY,
  Observable,
  Subject,
  catchError,
  finalize,
  map,
  of,
  switchMap,
  tap,
} from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CreateTaskInput,
  DummyJsonMetadataItem,
  DummyJsonMetadataResponse,
  DummyJsonTodoDto,
  DummyJsonTodosResponse,
  Task,
  TaskPriority,
} from '../models/task.model';
import {
  DashboardStats,
  Project,
  ProjectDerivedStatus,
} from '../models/project.model';

export interface PaginationQuery {
  userId: number;
  limit: number;
  skip: number;
}

@Injectable({ providedIn: 'root' })
export class TaskProjectService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;
  private readonly failureUrl = environment.failureEndpoint;


  private readonly simulateFailureSubject = new BehaviorSubject<boolean>(false);
  readonly simulateFailure$ = this.simulateFailureSubject.asObservable();

  private readonly projectsSubject = new BehaviorSubject<Project[]>([]);
  readonly projects$ = this.projectsSubject.asObservable();

  private readonly projectsLoadingSubject = new BehaviorSubject<boolean>(false);
  readonly projectsLoading$ = this.projectsLoadingSubject.asObservable();

  private readonly projectsErrorSubject = new BehaviorSubject<string | null>(null);
  readonly projectsError$ = this.projectsErrorSubject.asObservable();

  readonly dashboardStats$: Observable<DashboardStats> = this.projects$.pipe(
    map((projects) => {
      const totalProjects = projects.length;
      const totalTasks = projects.reduce((sum, p) => sum + p.taskCount, 0);
      const completedTasks = projects.reduce((sum, p) => sum + p.completedCount, 0);
      const pendingTasks = projects.reduce((sum, p) => sum + p.pendingCount, 0);
      return { totalProjects, totalTasks, completedTasks, pendingTasks };
    })
  );

  // Active Project Paginated Tasks Store
  private readonly tasksSubject = new BehaviorSubject<Task[]>([]);
  readonly tasks$ = this.tasksSubject.asObservable();

  private readonly totalTasksSubject = new BehaviorSubject<number>(0);
  readonly totalTasks$ = this.totalTasksSubject.asObservable();

  private readonly tasksLoadingSubject = new BehaviorSubject<boolean>(false);
  readonly tasksLoading$ = this.tasksLoadingSubject.asObservable();

  private readonly tasksErrorSubject = new BehaviorSubject<string | null>(null);
  readonly tasksError$ = this.tasksErrorSubject.asObservable();

  private readonly mutationLoadingSubject = new BehaviorSubject<boolean>(false);
  readonly mutationLoading$ = this.mutationLoadingSubject.asObservable();

  private readonly mutationErrorSubject = new BehaviorSubject<string | null>(null);
  readonly mutationError$ = this.mutationErrorSubject.asObservable();

  private readonly pageRequest$ = new Subject<PaginationQuery>();
  private metadataLoaded = false;

  constructor() {
    this.initPaginatedTasksStream();
  }

  setSimulateFailure(enabled: boolean): void {
    this.simulateFailureSubject.next(enabled);
  }

  clearMutationError(): void {
    this.mutationErrorSubject.next(null);
  }


  loadProjects(forceRefresh = false): void {
    if (this.metadataLoaded && !forceRefresh) {
      return;
    }

    this.projectsLoadingSubject.next(true);
    this.projectsErrorSubject.next(null);

    const url = this.simulateFailureSubject.value
      ? this.failureUrl
      : `${this.baseUrl}/todos?limit=0&select=userId,completed`;

    this.http
      .get<DummyJsonMetadataResponse>(url)
      .pipe(
        map((res) => this.groupMetadataIntoProjects(res.todos)),
        tap((projects) => {
          this.projectsSubject.next(projects);
          this.metadataLoaded = true;
        }),
        catchError(() => {
          this.projectsErrorSubject.next(
            'Failed to load projects. Please check your connection or retry.'
          );
          return of([]);
        }),
        finalize(() => this.projectsLoadingSubject.next(false))
      )
      .subscribe();
  }

  /**
   * 3.2 & 4.2: Trigger a server-paginated task fetch (cancelled if superseded)
   */
  requestProjectTasks(query: PaginationQuery): void {
    this.pageRequest$.next(query);
  }

  private initPaginatedTasksStream(): void {
    this.pageRequest$
      .pipe(
        tap(() => {
          this.tasksLoadingSubject.next(true);
          this.tasksErrorSubject.next(null);
        }),
        // switchMap cancels in-flight HTTP calls on rapid page/project switches
        switchMap(({ userId, limit, skip }) => {
          const url = this.simulateFailureSubject.value
            ? this.failureUrl
            : `${this.baseUrl}/todos/user/${userId}?limit=${limit}&skip=${skip}`;

          return this.http.get<DummyJsonTodosResponse>(url).pipe(
            tap((res) => {
              const mapped = res.todos.map((dto) => this.mapDtoToTask(dto));
              this.tasksSubject.next(mapped);
              this.totalTasksSubject.next(res.total);
            }),
            catchError(() => {
              this.tasksErrorSubject.next(
                'Unable to load tasks for this project. Please try again.'
              );
              return EMPTY;
            }),
            finalize(() => this.tasksLoadingSubject.next(false))
          );
        })
      )
      .subscribe();
  }

  /**
   * 3.2 & 4.1: Create a task with a guaranteed unique client-side localId
   */
  createTask(input: CreateTaskInput): Observable<Task | null> {
    this.mutationLoadingSubject.next(true);
    this.mutationErrorSubject.next(null);

    const url = this.simulateFailureSubject.value
      ? this.failureUrl
      : `${this.baseUrl}/todos/add`;

    const body = {
      todo: input.todo,
      completed: false,
      userId: input.userId,
    };

    return this.http.post<DummyJsonTodoDto>(url, body).pipe(
      map((res) => {
        const newTask: Task = {
          // Generate unique client ID so repeated API mock IDs (e.g. 151) never overwrite
          localId: this.generateLocalId(),
          id: res.id,
          todo: input.todo,
          completed: false,
          userId: input.userId,
          priority: input.priority,
          dueDate: input.dueDate,
        };

        // Prepend to current view & update project/dashboard counts
        this.tasksSubject.next([newTask, ...this.tasksSubject.value]);
        this.totalTasksSubject.next(this.totalTasksSubject.value + 1);
        this.adjustProjectCounts(input.userId, 1, 0);

        return newTask;
      }),
      catchError(() => {
        this.mutationErrorSubject.next('Failed to create task. Please try again.');
        return of(null);
      }),
      finalize(() => this.mutationLoadingSubject.next(false))
    );
  }

  /**
   * 3.2 & 4.3: Optimistic completion toggle with automatic rollback on failure
   */
  toggleTaskCompletion(task: Task): void {
    this.mutationErrorSubject.next(null);
    const previousTasks = this.tasksSubject.value;
    const nextCompleted = !task.completed;

    // 1. Optimistic UI update
    const updatedTasks = previousTasks.map((t) =>
      t.localId === task.localId ? { ...t, completed: nextCompleted } : t
    );
    this.tasksSubject.next(updatedTasks);
    this.adjustProjectCounts(task.userId, 0, nextCompleted ? 1 : -1);

    const url = this.simulateFailureSubject.value
      ? this.failureUrl
      : `${this.baseUrl}/todos/${task.id}`;

    // 2. HTTP call with rollback on failure
    this.http
      .patch<DummyJsonTodoDto>(url, { completed: nextCompleted })
      .pipe(
        catchError(() => {
          // Roll back both task list and project aggregate stats
          this.tasksSubject.next(previousTasks);
          this.adjustProjectCounts(task.userId, 0, nextCompleted ? -1 : 1);
          this.mutationErrorSubject.next(
            `Could not update "${task.todo}". Changes have been rolled back.`
          );
          return EMPTY;
        })
      )
      .subscribe();
  }

  /**
   * 3.2 & 4.3: Optimistic task deletion with automatic rollback on failure
   */
  deleteTask(task: Task): void {
    this.mutationErrorSubject.next(null);
    const previousTasks = this.tasksSubject.value;
    const previousTotal = this.totalTasksSubject.value;

    // 1. Optimistic UI removal
    this.tasksSubject.next(previousTasks.filter((t) => t.localId !== task.localId));
    this.totalTasksSubject.next(Math.max(0, previousTotal - 1));
    this.adjustProjectCounts(task.userId, -1, task.completed ? -1 : 0);

    const url = this.simulateFailureSubject.value
      ? this.failureUrl
      : `${this.baseUrl}/todos/${task.id}`;

    // 2. HTTP call with rollback on failure
    this.http
      .delete<DummyJsonTodoDto>(url)
      .pipe(
        catchError(() => {
          // Roll back task list, total count, and project aggregate stats
          this.tasksSubject.next(previousTasks);
          this.totalTasksSubject.next(previousTotal);
          this.adjustProjectCounts(task.userId, 1, task.completed ? 1 : 0);
          this.mutationErrorSubject.next(
            `Could not delete "${task.todo}". Task has been restored.`
          );
          return EMPTY;
        })
      )
      .subscribe();
  }

  private groupMetadataIntoProjects(items: DummyJsonMetadataItem[]): Project[] {
    const mapByUser = new Map<number, { total: number; completed: number }>();

    for (const item of items) {
      const current = mapByUser.get(item.userId) ?? { total: 0, completed: 0 };
      current.total += 1;
      if (item.completed) {
        current.completed += 1;
      }
      mapByUser.set(item.userId, current);
    }

    return Array.from(mapByUser.entries())
      .sort(([a], [b]) => a - b)
      .map(([userId, counts]) => {
        const pendingCount = counts.total - counts.completed;
        return {
          userId,
          title: `Project - User ${userId}`,
          taskCount: counts.total,
          completedCount: counts.completed,
          pendingCount,
          status: this.deriveProjectStatus(counts.total, counts.completed),
        };
      });
  }

  private deriveProjectStatus(total: number, completed: number): ProjectDerivedStatus {
    if (total > 0 && completed === total) {
      return 'Completed';
    }
    if (completed > 0) {
      return 'In Progress';
    }
    return 'Not Started';
  }

  private adjustProjectCounts(
    userId: number,
    totalDelta: number,
    completedDelta: number
  ): void {
    const updatedProjects = this.projectsSubject.value.map((project) => {
      if (project.userId !== userId) {
        return project;
      }
      const taskCount = Math.max(0, project.taskCount + totalDelta);
      const completedCount = Math.max(
        0,
        Math.min(taskCount, project.completedCount + completedDelta)
      );
      const pendingCount = taskCount - completedCount;

      return {
        ...project,
        taskCount,
        completedCount,
        pendingCount,
        status: this.deriveProjectStatus(taskCount, completedCount),
      };
    });

    this.projectsSubject.next(updatedProjects);
  }

  private mapDtoToTask(dto: DummyJsonTodoDto): Task {
    const priorities: TaskPriority[] = ['Low', 'Medium', 'High'];
    const priority = priorities[dto.id % 3];
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + ((dto.id % 14) + 1));

    return {
      localId: `api-${dto.id}`,
      id: dto.id,
      todo: dto.todo,
      completed: dto.completed,
      userId: dto.userId,
      priority,
      dueDate: futureDate.toISOString().split('T')[0],
    };
  }

  private generateLocalId(): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    return `local-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  }
}
