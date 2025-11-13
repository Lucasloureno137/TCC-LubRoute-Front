import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfirmacaoOperacaoComponent } from './confirmacao-operacao.component';

describe('ConfirmacaoOperacaoComponent', () => {
  let component: ConfirmacaoOperacaoComponent;
  let fixture: ComponentFixture<ConfirmacaoOperacaoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ConfirmacaoOperacaoComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ConfirmacaoOperacaoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
