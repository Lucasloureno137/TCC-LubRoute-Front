import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormFilterPtLubrificacaoComponent } from './form-filter-pt-lubrificacao.component';

describe('FormFilterPtLubrificacaoComponent', () => {
  let component: FormFilterPtLubrificacaoComponent;
  let fixture: ComponentFixture<FormFilterPtLubrificacaoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [FormFilterPtLubrificacaoComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(FormFilterPtLubrificacaoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
