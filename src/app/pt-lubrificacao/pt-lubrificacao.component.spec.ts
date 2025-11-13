import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PtLubrificacaoComponent } from './pt-lubrificacao.component';

describe('PtLubrificacaoComponent', () => {
  let component: PtLubrificacaoComponent;
  let fixture: ComponentFixture<PtLubrificacaoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PtLubrificacaoComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PtLubrificacaoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
