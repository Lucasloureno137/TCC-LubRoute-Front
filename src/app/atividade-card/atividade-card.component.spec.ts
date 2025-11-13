import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AtividadeCardComponent } from './atividade-card.component';

describe('AtividadeCardComponent', () => {
  let component: AtividadeCardComponent;
  let fixture: ComponentFixture<AtividadeCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AtividadeCardComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AtividadeCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
