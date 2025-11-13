import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExclusionModalComponent } from './exclusion-modal.component';

describe('ExclusionModalComponent', () => {
  let component: ExclusionModalComponent;
  let fixture: ComponentFixture<ExclusionModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ExclusionModalComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ExclusionModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
