import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { ConfigService } from '../services/config.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BreadcrumbItem } from '../breadcrumb/breadcrumb.component';
import { combineLatest } from 'rxjs';
import { UserService } from '../services/user.service';

interface Produto {
  id: number;
  nome: string;
  quantidadeSubprodutos: number;
  publicId: string;
}

@Component({
  selector: 'app-lista-produto',
  templateUrl: './lista-produto.component.html',
  styleUrls: ['./lista-produto.component.css']
})
export class ListaProdutoComponent implements OnInit {

  userManager: boolean = false;
  isAdmin: boolean = false;

  produtos: Produto[] = [];
  filteredProdutos: Produto[] = [];
  searchQuery: string = '';
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalPages: number = 0;
  selectedProduct: Produto | null = null;

  breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Cadastros', route: '/cadastros' },
    { label: 'Produtos', active: true }
  ];

  constructor(
    private http: HttpClient,
    private router: Router,
    private configService: ConfigService,
    private snackBar: MatSnackBar,
    private userService: UserService,
  ) { }

  ngOnInit(): void {
    combineLatest([
      this.userService.currentIsAdmin,
      this.userService.currentIsUserManager
    ]).subscribe(([isAdmin, isUserManager]) => {
      this.isAdmin = isAdmin;
      this.userManager = isUserManager === 'true';
    });

    this.loadProducts();
  }

  loadProducts(): void {
    let headers = new HttpHeaders().set('Authorization', 'Bearer ' + localStorage.getItem('token'));
    const cliente_id = localStorage.getItem('cliente_id');
    if (cliente_id) {
      headers = headers.set('user-id', cliente_id);
    }
    const baseUrl = this.configService.getBaseUrl();

    this.http.get(baseUrl + '/lubvel/produtos-base', { headers }).subscribe(
      (response: any) => {
        if (response.success && response.data) {
          this.produtos = response.data.map((item: any, index: number) => ({
            id: index + 1,
            nome: item.nome,
            quantidadeSubprodutos: item.quantidadeSubprodutos || 0,
            publicId: item.publicId
          }));
          this.applyFilter();
        } else {
          this.snackBar.open('Erro ao carregar produtos', 'Fechar', { duration: 3000 });
        }
      },
      error => {
        console.log(error);
        this.snackBar.open('Erro ao carregar produtos', 'Fechar', {
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
      this.filteredProdutos = [...this.produtos];
    } else {
      this.filteredProdutos = this.produtos.filter(product =>
        product.nome.toLowerCase().includes(this.searchQuery.toLowerCase())
      );
    }
    this.updatePagination();
  }

  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredProdutos.length / this.itemsPerPage);
  }

  getPaginatedProducts(): Produto[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.filteredProdutos.slice(start, end);
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

  onAddProduct(): void {
    this.router.navigate(['/admin/app-form-produto']);
  }

  onEditProduct(): void {
    if (!this.selectedProduct) {
      this.showError('Selecione um produto primeiro');
      return;
    }
    this.router.navigate(['/admin/app-edit-produto', this.selectedProduct.publicId]);
  }

  onDeleteProduto(): void {
    if (!this.selectedProduct) {
      this.showError('Selecione um item primeiro');
      return;
    }

    this.router.navigate([`/app-exclusion-modal/${this.selectedProduct.publicId}/produtos-base`]);
  }

  onRowClick(product: Produto): void {
    this.selectedProduct = this.selectedProduct === product ? null : product;
  }

  isSelected(product: Produto): boolean {
    return this.selectedProduct === product;
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Fechar', {
      duration: 3000,
    });
  }
}