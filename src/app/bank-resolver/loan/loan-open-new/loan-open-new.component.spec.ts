import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LoanOpenNewComponent } from './loan-open-new.component';

describe('LoanOpenNewComponent', () => {
  let component: LoanOpenNewComponent;
  let fixture: ComponentFixture<LoanOpenNewComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [LoanOpenNewComponent]
    });
    fixture = TestBed.createComponent(LoanOpenNewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
