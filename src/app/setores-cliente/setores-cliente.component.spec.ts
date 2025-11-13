import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SetoresClienteComponent } from './setores-cliente.component';

describe('SetoresClienteComponent', () => {
  let component: SetoresClienteComponent;
  let fixture: ComponentFixture<SetoresClienteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SetoresClienteComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SetoresClienteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
