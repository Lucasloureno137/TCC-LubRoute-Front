import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';

export interface BreadcrumbItem {
  label: string;
  route?: string;
  active?: boolean;
}

@Component({
  selector: 'app-breadcrumb',
  templateUrl: './breadcrumb.component.html',
  styleUrls: ['./breadcrumb.component.css']
})
export class BreadcrumbComponent {
  @Input() items: BreadcrumbItem[] = [];
  @Input() separator: string = '/';
  @Input() showContainer: boolean = true;
  @Input() centerAlign: boolean = false;

  constructor(private router: Router) { }

  onItemClick(item: BreadcrumbItem): void {
    if (item.route && !item.active) {
      this.router.navigate([item.route]);
    }
  }

  isClickable(item: BreadcrumbItem): boolean {
    return !!(item.route && !item.active);
  }
}