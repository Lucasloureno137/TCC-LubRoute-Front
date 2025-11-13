import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormUsuarioClienteComponent } from './form-usuario-cliente.component';

describe('FormUsuarioClienteComponent', () => {
  let component: FormUsuarioClienteComponent;
  let fixture: ComponentFixture<FormUsuarioClienteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [FormUsuarioClienteComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(FormUsuarioClienteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
