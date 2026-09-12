import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TagCatalogService } from '../../services/tag-catalog.service';

@Component({
  selector: 'app-tag-input',
  imports: [CommonModule, FormsModule],
  templateUrl: './tag-input.component.html',
  styleUrl: './tag-input.component.css'
})
export class TagInputComponent {
  @Input() tags: string[] = [];
  @Input() label = 'Tags';
  @Output() tagsChange = new EventEmitter<string[]>();

  open = false;
  checked: Record<string, boolean> = {};
  otherSelected = false;
  otherText = '';

  constructor(private tagCatalog: TagCatalogService) {}

  get availableTags(): string[] {
    return this.tagCatalog.getAvailable().filter((tag) => {
      return !this.tags.some((selected) => selected.toLowerCase() === tag.toLowerCase());
    });
  }

  get canAdd(): boolean {
    const hasChecked = this.availableTags.some((tag) => this.checked[tag]);
    const hasOther = this.otherSelected && !!this.otherText.trim();
    return hasChecked || hasOther;
  }

  openPopup(event: Event) {
    event.preventDefault();
    this.checked = {};
    this.otherSelected = false;
    this.otherText = '';
    this.open = true;
  }

  closePopup() {
    this.open = false;
    this.checked = {};
    this.otherSelected = false;
    this.otherText = '';
  }

  confirmAdd() {
    const selected = this.availableTags.filter((tag) => this.checked[tag]);
    if (this.otherSelected && this.otherText.trim()) {
      this.tagCatalog.remember(this.otherText);
      selected.push(this.otherText);
    }
    this.addTags(selected);
    this.closePopup();
  }

  remove(tag: string) {
    this.emit(this.tags.filter((item) => item.toLowerCase() !== tag.toLowerCase()));
  }

  private addTags(raws: string[]) {
    let next = [...this.tags];
    raws.forEach((raw) => {
      const tag = raw.trim();
      if (!tag) {
        return;
      }
      const exists = next.some((item) => item.toLowerCase() === tag.toLowerCase());
      if (!exists) {
        next = [...next, tag];
      }
    });
    if (next.length !== this.tags.length) {
      this.emit(next);
    }
  }

  private emit(tags: string[]) {
    this.tags = tags;
    this.tagsChange.emit(tags);
  }
}
