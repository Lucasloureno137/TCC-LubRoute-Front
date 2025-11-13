import { Component } from '@angular/core';
import { UserService } from '../services/user.service';
import { Router } from '@angular/router';
import { SidebarService } from '../services/sidebar.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent {
  constructor(
    private userService: UserService,
    private router: Router,
    private sidebarService: SidebarService
  ) { }

  ngOnInit(): void {
    this.userService.currentUserName.subscribe(name => {
      this.userName = name;
      this.userInitials = this.getInitials(name);
      this.selectedCompany = localStorage.getItem('cliente_nome') || '';
    });

    this.userService.currentCompanyName.subscribe(company => {
      this.selectedCompany = company;
    });
  }

  toggleSidebar() {
    this.sidebarService.toggleSidebar();
  }

  getInitials(name: string): string {
    if (!name) return "";
    const parts = name.split(" ");
    if (parts.length === 1) {
      return parts[0].charAt(0).toUpperCase();
    }
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }

  userName: string = '';
  userInitials: string = '';
  selectedCompany: string = '';

  onChangeCompany(): void {
    this.router.navigate([`/admin/app-selecionar-empresa`]);
  }

  onLogout(): void {
    this.userService.clearUser();
    localStorage.clear();
    this.clearData();
    this.router.navigate(['/app-login']);
  }

  clearData(): void {
    this.userName = '';
    this.userInitials = '';
    this.selectedCompany = '';
  }
}