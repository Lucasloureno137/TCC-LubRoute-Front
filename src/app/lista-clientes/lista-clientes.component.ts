import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { ConfigService } from '../services/config.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BreadcrumbItem } from '../breadcrumb/breadcrumb.component';

interface Cliente {
  n?: number;
  nome: string;
  cnpj: string;
  email: string;
  publicId: string;
}

@Component({
  selector: 'app-lista-clientes',
  templateUrl: './lista-clientes.component.html',
  styleUrl: './lista-clientes.component.css'
})
export class ListaClientesComponent implements OnInit {
  erroAlert() {
    this.snackBar.open('Selecione um registro primeiro', 'Fechar', {
      duration: 2000,
    });
  }
  selectedRow: Cliente | null = null;
  tabelaControle(funcao: string) {
    switch (funcao) {
      case 'ADD':
        this.router.navigate(['/admin/app-form-cliente']);
        break;
      case 'EDIT':
        this.router.navigate([montarUrl('editar', this.selectedRow, this.allData)]);
        break;
      case 'DELETE':
        this.router.navigate([montarUrl('excluir', this.selectedRow, this.allData)]);
        break;
      default:
        break;
    }
  }

  clientes: Cliente[] = [];
  filteredClientes: Cliente[] = [];

  searchQuery: string = '';
  breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Cadastros', route: '/cadastros' },
    { label: 'Clientes', active: true }
  ];

  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalPages: number = 0;

  displayedColumns: string[] = ['n', 'publicId', 'nome'];
  displayedColumnsCast: string[] = ['N', 'Tag ponto', 'Nome'];
  dataLayer: any[] = [];
  allData: any[] = [];

  constructor(private http: HttpClient, private router: Router, private configService: ConfigService, private snackBar: MatSnackBar) { }

  ngOnInit(): void {
    let headers = new HttpHeaders().set('Authorization', 'Bearer ' + localStorage.getItem('token'));
    const cliente_id = localStorage.getItem('cliente_id');
    if (cliente_id) {
      headers = headers.set('user-id', cliente_id);
    }
    const baseUrl = this.configService.getBaseUrl();
    this.http.get(baseUrl + '/lubvel/cliente', { headers }).subscribe(
      (response: any) => {

        this.clientes = response.data.map((item: any, index: number) => ({
          n: index + 1,
          nome: item.nome,
          cnpj: item.cnpj,
          email: item.email,
          publicId: item.publicId
        }));
        this.allData = response.data;
        this.applyFilter();
      },
      error => {
        console.log(error);
      }
    );
  }

  onSearch(): void {
    this.currentPage = 1;
    this.applyFilter();
  }

  applyFilter(): void {
    if (!this.searchQuery.trim()) {
      this.filteredClientes = [...this.clientes];
    } else {
      this.filteredClientes = this.clientes.filter(cliente =>
        cliente.nome.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        cliente.email.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        cliente.cnpj.includes(this.searchQuery)
      );
    }
    this.updatePagination();
  }

  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredClientes.length / this.itemsPerPage);
  }


  getPaginatedClientes(): Cliente[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.filteredClientes.slice(start, end);
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

  onRowClick(cliente: Cliente): void {
    this.selectedRow = this.selectedRow === cliente ? null : cliente;
  }

  isSelected(cliente: Cliente): boolean {
    return this.selectedRow === cliente;
  }
}
function montarUrl(str: string, selectedRow: any, allData: any[]): any {
  if (str === 'editar') {
    let baseUrl = '/admin/app-form-cliente';
    let id_usuario = selectedRow.publicId;
    return `${baseUrl}/${id_usuario}`;
  } else if (str === 'excluir') {
    let baseUrl = '/app-exclusion-modal';
    let id_usuario = selectedRow.publicId;
    let controller = 'cliente';
    return `${baseUrl}/${id_usuario}/${controller}`;
  }

}

