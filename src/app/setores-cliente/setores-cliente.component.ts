import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { ConfigService } from '../services/config.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BreadcrumbItem } from '../breadcrumb/breadcrumb.component';

interface Setor {
  id: number;
  nome: string;
  publicId: string;
}

@Component({
  selector: 'app-setores-cliente',
  templateUrl: './setores-cliente.component.html',
  styleUrls: ['./setores-cliente.component.css']
})
export class SetoresClienteComponent implements OnInit {
  setores: Setor[] = [];
  filteredSetores: Setor[] = [];
  searchQuery: string = '';
  currentPage: number = 1;
  itemsPerPage: number = 9;
  totalPages: number = 0;
  selectedSetor: Setor | null = null;

  breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Cadastros', route: '/cadastros' },
    { label: 'Setores', active: true }
  ];

  constructor(
    private http: HttpClient, 
    private router: Router, 
    private configService: ConfigService, 
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.loadSetores();
  }

  loadSetores(): void {
    let headers = new HttpHeaders().set('Authorization', 'Bearer ' + localStorage.getItem('token'));
    const cliente_id = localStorage.getItem('cliente_id');
    if(cliente_id){
      headers = headers.set('user-id', cliente_id);
    }
    const baseUrl = this.configService.getBaseUrl();
    
    this.http.get(baseUrl + '/lubvel/setor', { headers }).subscribe(
      (response: any) => {
        this.setores = response.data.map((item: any, index: number) => ({
          id: index + 1,
          nome: item.nome,
          publicId: item.publicId
        }));
        this.applyFilter();
      },
      error => {
        console.log(error);
        this.snackBar.open('Erro ao carregar setores', 'Fechar', {
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
      this.filteredSetores = [...this.setores];
    } else {
      this.filteredSetores = this.setores.filter(setor => 
        setor.nome.toLowerCase().includes(this.searchQuery.toLowerCase())
      );
    }
    this.updatePagination();
  }

  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredSetores.length / this.itemsPerPage);
  }

  getPaginatedSetores(): Setor[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.filteredSetores.slice(start, end);
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

  onAddSetor(): void {
    this.router.navigate(['/app-form-setor']);
  }

  onEditSetor(): void {
    if (!this.selectedSetor) {
      this.showError('Selecione um setor primeiro');
      return;
    }
    this.router.navigate([`/app-form-setor/${this.selectedSetor.publicId}/${this.selectedSetor.nome}`]);
  }

  onDeleteSetor(): void {
    if (!this.selectedSetor) {
      this.showError('Selecione um setor primeiro');
      return;
    }
    
    this.router.navigate([`/app-exclusion-modal/${this.selectedSetor.publicId}/setor`]);
  }

  onRowClick(setor: Setor): void {
    this.selectedSetor = this.selectedSetor === setor ? null : setor;
  }

  isSelected(setor: Setor): boolean {
    return this.selectedSetor === setor;
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Fechar', {
      duration: 3000,
    });
  }
}