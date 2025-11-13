import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminPreferenciasClientesComponent } from './admin-preferencias-clientes.component';

describe('AdminPreferenciasClientesComponent', () => {
  let component: AdminPreferenciasClientesComponent;
  let fixture: ComponentFixture<AdminPreferenciasClientesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AdminPreferenciasClientesComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AdminPreferenciasClientesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
