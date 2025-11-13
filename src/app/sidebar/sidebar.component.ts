import { Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { Params } from '@angular/router';
import { UserService } from '../services/user.service';
import { combineLatest, Subject, takeUntil } from 'rxjs';
import { SidebarService } from '../services/sidebar.service';

interface MenuItem {
  label: string;
  icon: string;
  route?: string;
  queryParams?: Params;
  visible?: boolean;
  children?: MenuItem[];
}

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit, OnDestroy {

  isMobile = false;
  isOpen = false;
  isCollapsed = false;
  private destroy$ = new Subject<void>();

  @Output() toggleSidebar = new EventEmitter<boolean>();

  userManager: boolean = false;
  isAdmin: boolean = false;

  menuItems: MenuItem[] = []

  constructor(
    private userService: UserService,
    private sidebarService: SidebarService,
  ) { }

  ngOnInit(): void {
    this.sidebarService.sidebarOpen$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(isOpen => {
      this.isOpen = isOpen;
    });

    this.updateSidebarMode();
    window.addEventListener('resize', this.updateSidebarMode.bind(this));

    combineLatest([
      this.userService.currentIsAdmin,
      this.userService.currentIsUserManager
    ]).subscribe(([isAdmin, isUserManager]) => {
      this.isAdmin = isAdmin;
      this.userManager = isUserManager === 'true';

      this.updateSidebarItems();
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private updateSidebarMode() {
    this.isMobile = window.innerWidth <= 768;
  }

  toggleCollapse() {
    this.isCollapsed = !this.isCollapsed;
    this.toggleSidebar.emit(this.isCollapsed);
  }

  closeSidebar() {
    this.sidebarService.closeSidebar();
  }

  updateSidebarItems(): void {
    this.menuItems = [
      {
        label: 'PAINEL',
        icon: '',
        children: [
          { label: 'Dashboard', icon: 'dashboard', route: '/dashboard', visible: true },
          { label: 'Atividades', icon: 'assignment', route: '/app-lista-atividades', visible: true },
          { label: 'Calendário', icon: 'calendar_today', route: '/app-calendario', visible: true }
        ]
      },
      {
        label: 'CADASTROS',
        icon: '',
        children: [
          { label: 'Equipamentos', icon: 'precision_manufacturing', route: '/app-equipamentos-cliente', visible: this.isAdmin || this.userManager },
          { label: 'Operações', icon: 'build', route: '/app-operacoes', visible: this.isAdmin || this.userManager },
          { label: 'Pontos de Manutenção', icon: 'location_on', route: '/app-pt-manutencao', visible: this.isAdmin || this.userManager },
          { label: 'Setores', icon: 'business', route: '/app-setores-cliente', visible: this.isAdmin || this.userManager },
          { label: 'Administradores', icon: 'people', route: '/admin/app-lista-usuarios', visible: this.isAdmin },
          { label: 'Técnicos', icon: 'people', route: '/app-lista-usuarios-cliente', visible: this.isAdmin || this.userManager },
          { label: 'Clientes', icon: 'business', route: '/admin/app-lista-clientes', visible: this.isAdmin },
          { label: 'Produtos', icon: 'science', route: 'admin/app-lista-produto', visible: this.isAdmin || this.userManager },
        ],
        visible: this.isAdmin || this.userManager,
      },
      {
        label: 'CONTROLES',
        icon: '',
        children: [
          { label: 'Estoque', icon: 'inventory', route: '/app-lista-estoque', visible: true },
          { label: 'Produtos Baixo Estoque', icon: 'warning', route: '/app-lista-estoque/baixo-estoque', visible: true }
        ]
      },
      {
        label: 'RELATÓRIOS',
        icon: '',
        children: [
          { label: 'Meus Relatórios', icon: 'assessment', route: '/app-relatorios', visible: this.isAdmin || this.userManager },
          { label: 'Relatos Técnicos', icon: 'description', route: '/app-relatos-tecnicos', visible: this.isAdmin || this.userManager }
        ],
        visible: this.isAdmin || this.userManager,
      },
      {
        label: 'CONFIGURAÇÕES',
        icon: '',
        children: [
          { label: 'Configurar Sistemática', icon: 'settings', route: '/app-cliente-preferencias', visible: this.isAdmin || this.userManager },
          { label: 'Logs do Sistema', icon: 'history', route: '/app-acoes-marcos', visible: this.isAdmin }
        ],
        visible: this.isAdmin || this.userManager
      }
    ]
  }

  getVisibleItems(items: MenuItem[]): MenuItem[] {
    return items.filter(item => item.visible !== false);
  }
}
