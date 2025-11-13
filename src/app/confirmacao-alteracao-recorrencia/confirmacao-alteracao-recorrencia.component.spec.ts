import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfirmacaoAlteracaoRecorrenciaComponent } from './confirmacao-alteracao-recorrencia.component';

describe('ConfirmacaoAlteracaoRecorrenciaComponent', () => {
  let component: ConfirmacaoAlteracaoRecorrenciaComponent;
  let fixture: ComponentFixture<ConfirmacaoAlteracaoRecorrenciaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ConfirmacaoAlteracaoRecorrenciaComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ConfirmacaoAlteracaoRecorrenciaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
