import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { ConfigService } from '../services/config.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BreadcrumbItem } from '../breadcrumb/breadcrumb.component';

interface Usuario {
  n: number;
  nome: string;
  cpf: string;
  email: string;
  telefone: string;
  publicId: string;
  usuarioAtual: boolean;
  endereco: string;
}

@Component({
  selector: 'app-lista-usuarios',
  templateUrl: './lista-usuarios.component.html',
  styleUrls: ['./lista-usuarios.component.css']
})
export class ListaUsuariosComponent implements OnInit {
  usuarios: Usuario[] = [];
  filteredUsuarios: Usuario[] = [];
  searchQuery: string = '';
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalPages: number = 0;
  selectedUser: Usuario | null = null;

  breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Cadastros', route: '/cadastros' },
    { label: 'Usuários ADM', active: true }
  ];

  constructor(
    private http: HttpClient,
    private router: Router,
    private configService: ConfigService,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    let headers = new HttpHeaders().set('Authorization', 'Bearer ' + localStorage.getItem('token'));
    const cliente_id = localStorage.getItem('cliente_id');
    if (cliente_id) {
      headers = headers.set('user-id', cliente_id);
    }
    const baseUrl = this.configService.getBaseUrl();

    this.http.get(baseUrl + '/lubvel/user', { headers }).subscribe(
      (response: any) => {
        this.usuarios = response.data.map((item: any, index: number) => ({
          n: index + 1,
          nome: item.nome,
          email: item.email,
          cpf: item.cpf,
          endereco: item.endereco,
          usuarioAtual: item.usuarioAtual,
          publicId: item.publicId
        }));
        this.applyFilter();
      },
      error => {
        console.log(error);
        this.snackBar.open('Erro ao carregar usuários', 'Fechar', {
          duration: 3000,
        });
      }
    );
  }

  onSearch(): void {
    this.currentPage = 1;
    this.applyFilter();
  }

  applyFilter(): void {
    if (!this.searchQuery.trim()) {
      this.filteredUsuarios = [...this.usuarios];
    } else {
      this.filteredUsuarios = this.usuarios.filter(user =>
        user.nome.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        user.cpf.includes(this.searchQuery)
      );
    }
    this.updatePagination();
  }

  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredUsuarios.length / this.itemsPerPage);
  }

  getPaginatedUsers(): Usuario[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.filteredUsuarios.slice(start, end);
  }

  onPageChange(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(this.totalPages, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }

  onAddUser(): void {
    this.router.navigate(['/admin/app-form-usuarios']);
  }

  onEditUser(): void {
    if (!this.selectedUser) {
      this.showError('Selecione um usuário primeiro');
      return;
    }
    this.router.navigate([montarUrl('editar', this.selectedUser)]);
  }

  onDeleteUser(): void {
    if (!this.selectedUser) {
      this.showError('Selecione um usuário primeiro');
      return;
    }

    if (this.selectedUser.usuarioAtual) {
      this.showError('Não é possível excluir o próprio usuário');
      return;
    }


    this.router.navigate([montarUrl('excluir', this.selectedUser)]);
  }

  onRowClick(user: Usuario): void {
    this.selectedUser = this.selectedUser === user ? null : user;
  }

  isSelected(user: Usuario): boolean {
    return this.selectedUser === user;
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Fechar', {
      duration: 3000,
    });
  }
}

function montarUrl(str: string, selectedRow: any): any {
  if (str === 'editar') {
    let baseUrl = '/admin/app-form-usuarios';
    let id_usuario = selectedRow.publicId;
    return `${baseUrl}/${id_usuario}`;
  } else if (str === 'excluir') {
    let baseUrl = '/app-exclusion-modal';
    let id_usuario = selectedRow.publicId;
    let controller = 'user';
    return `${baseUrl}/${id_usuario}/${controller}`;
  }

}
