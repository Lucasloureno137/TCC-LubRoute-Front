import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClientePreferenciasComponent } from './cliente-preferencias.component';

describe('ClientePreferenciasComponent', () => {
  let component: ClientePreferenciasComponent;
  let fixture: ComponentFixture<ClientePreferenciasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ClientePreferenciasComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ClientePreferenciasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
