import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { TaskProjectService } from './task-project.service';
import { Task } from '../models/task.model';

describe('TaskProjectService', () => {
  let service: TaskProjectService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        TaskProjectService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(TaskProjectService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should group trimmed metadata by userId and derive project status and stats', async () => {
    service.loadProjects();

    const req = httpMock.expectOne(
      'https://dummyjson.com/todos?limit=0&select=userId,completed'
    );
    expect(req.request.method).toBe('GET');

    req.flush({
      todos: [
        { userId: 1, completed: true },
        { userId: 1, completed: true },
        { userId: 2, completed: false },
      ],
      total: 3,
      skip: 0,
      limit: 3,
    });

    const projects = await firstValueFrom(service.projects$);
    expect(projects.length).toBe(2);
    expect(projects[0]).toMatchObject({
      userId: 1,
      title: 'Project - User 1',
      taskCount: 2,
      completedCount: 2,
      pendingCount: 0,
      status: 'Completed',
    });

    const stats = await firstValueFrom(service.dashboardStats$);
    expect(stats).toEqual({
      totalProjects: 2,
      totalTasks: 3,
      completedTasks: 2,
      pendingTasks: 1,
    });
  });

  it('should assign distinct localId values even when POST /todos/add returns duplicate id 151', async () => {
    const firstPromise = firstValueFrom(
      service.createTask({
        todo: 'First task',
        userId: 5,
        priority: 'High',
        dueDate: '2026-12-01',
      })
    );

    const req1 = httpMock.expectOne('https://dummyjson.com/todos/add');
    req1.flush({ id: 151, todo: 'First task', completed: false, userId: 5 });
    const created1 = await firstPromise;

    const secondPromise = firstValueFrom(
      service.createTask({
        todo: 'Second task',
        userId: 5,
        priority: 'Low',
        dueDate: '2026-12-02',
      })
    );

    const req2 = httpMock.expectOne('https://dummyjson.com/todos/add');
    req2.flush({ id: 151, todo: 'Second task', completed: false, userId: 5 });
    const created2 = await secondPromise;

    expect(created1?.localId).toBeTruthy();
    expect(created2?.localId).toBeTruthy();
    expect(created1?.localId).not.toBe(created2?.localId);

    const tasks = await firstValueFrom(service.tasks$);
    expect(tasks.length).toBe(2);
    expect(tasks.map((t) => t.todo)).toEqual(['Second task', 'First task']);
  });

  it('should roll back optimistic toggle when PATCH fails', async () => {
    const initialTask: Task = {
      localId: 'api-10',
      id: 10,
      todo: 'Write unit tests',
      completed: false,
      userId: 1,
      priority: 'Medium',
      dueDate: '2026-12-10',
    };

    service.requestProjectTasks({ userId: 1, limit: 5, skip: 0 });
    const loadReq = httpMock.expectOne(
      'https://dummyjson.com/todos/user/1?limit=5&skip=0'
    );
    loadReq.flush({
      todos: [{ id: 10, todo: 'Write unit tests', completed: false, userId: 1 }],
      total: 1,
      skip: 0,
      limit: 5,
    });

    service.toggleTaskCompletion(initialTask);

    // Optimistically toggled immediately
    let currentTasks = await firstValueFrom(service.tasks$);
    expect(currentTasks[0].completed).toBe(true);

    const patchReq = httpMock.expectOne('https://dummyjson.com/todos/10');
    expect(patchReq.request.method).toBe('PATCH');
    patchReq.flush('Server error', { status: 500, statusText: 'Internal Server Error' });

    // Rolled back to false after failure
    currentTasks = await firstValueFrom(service.tasks$);
    expect(currentTasks[0].completed).toBe(false);

    const mutationError = await firstValueFrom(service.mutationError$);
    expect(mutationError).toContain('rolled back');
  });

  it('should cancel superseded request when switching pages rapidly (switchMap)', () => {
    service.requestProjectTasks({ userId: 1, limit: 5, skip: 0 });
    service.requestProjectTasks({ userId: 1, limit: 5, skip: 5 });

    const reqPage1 = httpMock.expectOne(
      'https://dummyjson.com/todos/user/1?limit=5&skip=0'
    );
    const reqPage2 = httpMock.expectOne(
      'https://dummyjson.com/todos/user/1?limit=5&skip=5'
    );

    expect(reqPage1.cancelled).toBe(true);
    reqPage2.flush({ todos: [], total: 10, skip: 5, limit: 5 });
  });
});