import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EquipamentosClienteComponent } from './equipamentos-cliente.component';

describe('EquipamentosClienteComponent', () => {
  let component: EquipamentosClienteComponent;
  let fixture: ComponentFixture<EquipamentosClienteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EquipamentosClienteComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(EquipamentosClienteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
