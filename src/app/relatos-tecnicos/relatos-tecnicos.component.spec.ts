import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RelatosTecnicosComponent } from './relatos-tecnicos.component';

describe('RelatosTecnicosComponent', () => {
  let component: RelatosTecnicosComponent;
  let fixture: ComponentFixture<RelatosTecnicosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [RelatosTecnicosComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(RelatosTecnicosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
