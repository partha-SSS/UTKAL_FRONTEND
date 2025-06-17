import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InterestRateMasterComponent } from './interest-rate-master.component';

describe('InterestRateMasterComponent', () => {
  let component: InterestRateMasterComponent;
  let fixture: ComponentFixture<InterestRateMasterComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [InterestRateMasterComponent]
    });
    fixture = TestBed.createComponent(InterestRateMasterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
