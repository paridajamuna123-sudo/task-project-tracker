import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ScopedStatus } from './scoped-status';

describe('ScopedStatus', () => {
  let component: ScopedStatus;
  let fixture: ComponentFixture<ScopedStatus>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScopedStatus],
    }).compileComponents();

    fixture = TestBed.createComponent(ScopedStatus);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
