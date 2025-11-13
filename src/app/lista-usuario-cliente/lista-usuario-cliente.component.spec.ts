import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListaUsuarioClienteComponent } from './lista-usuario-cliente.component';

describe('ListaUsuarioClienteComponent', () => {
  let component: ListaUsuarioClienteComponent;
  let fixture: ComponentFixture<ListaUsuarioClienteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ListaUsuarioClienteComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ListaUsuarioClienteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
