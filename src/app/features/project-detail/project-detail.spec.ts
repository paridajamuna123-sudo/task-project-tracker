import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ProjectDetail } from './project-detail';

describe('ProjectDetailComponent Form Validation', () => {
  let component: ProjectDetail;
  let fixture: ComponentFixture<ProjectDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectDetail],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProjectDetail);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should mark todo invalid when empty or shorter than 3 characters', () => {
    const todoCtrl = component.taskForm.controls.todo;

    todoCtrl.setValue('');
    expect(todoCtrl.hasError('required')).toBe(true);
    expect(component.taskForm.invalid).toBe(true);

    todoCtrl.setValue('ab');
    expect(todoCtrl.hasError('minlength')).toBe(true);
    expect(component.taskForm.invalid).toBe(true);

    todoCtrl.setValue('Valid Task');
    expect(todoCtrl.valid).toBe(true);
  });

it('should reject a dueDate in the past', () => {
    const dueDateCtrl = component.taskForm.controls.dueDate;

    dueDateCtrl.setValue('2000-01-01');
    expect(dueDateCtrl.hasError('pastDate')).toBe(true);
    expect(component.taskForm.invalid).toBe(true);

    dueDateCtrl.setValue(component.todayStr);
    expect(dueDateCtrl.hasError('pastDate')).toBeFalsy();
  });
});