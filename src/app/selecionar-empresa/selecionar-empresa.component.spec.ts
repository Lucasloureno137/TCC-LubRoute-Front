import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SelecionarEmpresaComponent } from './selecionar-empresa.component';

describe('SelecionarEmpresaComponent', () => {
  let component: SelecionarEmpresaComponent;
  let fixture: ComponentFixture<SelecionarEmpresaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SelecionarEmpresaComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SelecionarEmpresaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
