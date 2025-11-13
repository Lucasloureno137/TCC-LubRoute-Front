import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AcoesMarcosComponent } from './acoes-marcos.component';

describe('AcoesMarcosComponent', () => {
  let component: AcoesMarcosComponent;
  let fixture: ComponentFixture<AcoesMarcosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AcoesMarcosComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AcoesMarcosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
