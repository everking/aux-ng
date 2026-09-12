import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TagInputComponent } from './tag-input.component';

describe('TagInputComponent', () => {
  let component: TagInputComponent;
  let fixture: ComponentFixture<TagInputComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TagInputComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(TagInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('adds multiple checked catalog tags at once', () => {
    const emitted: string[][] = [];
    component.tagsChange.subscribe((tags) => emitted.push(tags));
    component.checked = { men: true, retreat: true };
    component.confirmAdd();
    expect(component.tags).toEqual(['men', 'retreat']);
    expect(emitted[emitted.length - 1]).toEqual(['men', 'retreat']);
    expect(component.open).toBeFalse();
  });

  it('adds a custom other tag and ignores duplicates', () => {
    component.otherSelected = true;
    component.otherText = 'Family';
    component.confirmAdd();
    component.otherSelected = true;
    component.otherText = 'family';
    component.confirmAdd();
    expect(component.tags).toEqual(['Family']);
  });
});
