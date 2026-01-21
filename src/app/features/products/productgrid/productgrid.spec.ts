import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Productgrid } from './productgrid';

describe('Productgrid', () => {
  let component: Productgrid;
  let fixture: ComponentFixture<Productgrid>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Productgrid]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Productgrid);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
