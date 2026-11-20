import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TaskCard } from './task-card';

describe('TaskCard', () => {
  let component: TaskCard;
  let fixture: ComponentFixture<TaskCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TaskCard],
    }).compileComponents();

    fixture = TestBed.createComponent(TaskCard);
    component = fixture.componentInstance;
    component.task = {
      localId: 'task-1',
      id: 1,
      todo: 'Sample task',
      completed: false,
      userId: 1,
      priority: 'High',
      dueDate: '2026-12-31',
    };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});