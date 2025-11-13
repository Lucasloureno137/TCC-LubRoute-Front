import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormPtLubrificacaoComponent } from './form-pt-lubrificacao.component';

describe('FormPtLubrificacaoComponent', () => {
  let component: FormPtLubrificacaoComponent;
  let fixture: ComponentFixture<FormPtLubrificacaoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [FormPtLubrificacaoComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(FormPtLubrificacaoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
