import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router, ActivatedRoute } from '@angular/router';
import { ConfigService } from '../services/config.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BreadcrumbItem } from '../breadcrumb/breadcrumb.component';
import { UserService } from '../services/user.service';
import { combineLatest } from 'rxjs';

interface EstoqueItem {
  id: number;
  publicId: string;
  produtoNome: string;
  referencia: string;
  tipo: string;
  quantidadeDisponivel: string;
  estoqueMinimo: string;
  tpLub: string;
  qtd: number;
}

@Component({
  selector: 'app-lista-estoque',
  templateUrl: './lista-estoque.component.html',
  styleUrls: ['./lista-estoque.component.css']
})
export class ListaEstoqueComponent implements OnInit {

  userManager: boolean = false;
  isAdmin: boolean = false;

  estoqueItens: EstoqueItem[] = [];
  filteredEstoque: EstoqueItem[] = [];
  searchQuery: string = '';
  tipoSelecionado: string = '';
  currentPage: number = 1;
  itemsPerPage: number = 9;
  totalPages: number = 0;
  selectedItem: EstoqueItem | null = null;
  isLoading: boolean = false;
  baixoEstoque: boolean = false;
  tipos: string[] = ['LIQUIDO', 'GRAXA', 'PEÇA'];

  breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Início', route: '/' },
    { label: 'Estoque', active: true }
  ];

  constructor(
    private http: HttpClient,
    private router: Router,
    private configService: ConfigService,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar,
    private userService: UserService
  ) { }

  ngOnInit(): void {
    combineLatest([
      this.userService.currentIsAdmin,
      this.userService.currentIsUserManager
    ]).subscribe(([isAdmin, isUserManager]) => {
      this.isAdmin = isAdmin;
      this.userManager = isUserManager === 'true';
    });

    this.route.url.subscribe(url => {
      if (url && url.length > 1 && url[1].path) {
        this.baixoEstoque = url[1].path === 'baixo-estoque';
      } else {
        this.baixoEstoque = false;
      }
      this.updateBreadcrumb();
    });
    this.loadEstoque();
  }

  private updateBreadcrumb(): void {
    this.breadcrumbItems = [
      { label: 'Início', route: '/' },
      { label: this.baixoEstoque ? 'Produtos em baixo estoque' : 'Estoque', active: true }
    ];
  }

  loadEstoque(): void {
    this.isLoading = true;
    let headers = new HttpHeaders().set('Authorization', 'Bearer ' + localStorage.getItem('token'));
    const cliente_id = localStorage.getItem('cliente_id');
    if (cliente_id) {
      headers = headers.set('user-id', cliente_id);
    }
    const baseUrl = this.configService.getBaseUrl();
    const url = baseUrl + '/lubvel/estoque' + (this.baixoEstoque ? '/baixo-estoque' : '');

    this.http.get(url, { headers }).subscribe(
      (response: any) => {
        this.estoqueItens = response.data.map((item: any, index: number) => ({
          id: index + 1,
          publicId: item.publicId,
          produtoNome: item.produtoNome,
          referencia: item.referencia || 'N/A',
          tipo: this.getTipoFromTpLub(item.tpLub),
          quantidadeDisponivel: this.formatarQuantidade(item.qtd, item.tpLub),
          estoqueMinimo: this.formatarQuantidade(item.estoqueMinimo || 0, item.tpLub),
          tpLub: item.tpLub,
          qtd: item.qtd
        }));
        this.applyFilter();
        this.isLoading = false;
      },
      error => {
        console.log(error);
        this.snackBar.open('Erro ao buscar estoque!', 'Fechar', {
          duration: 3000,
        });
        this.isLoading = false;
      }
    );
  }

  limparFiltro() {
    this.tipoSelecionado = '';
    this.searchQuery = '';
    this.loadEstoque();
  }

  onTipoChange(tipo: string): void {
    this.tipoSelecionado = tipo;
    this.currentPage = 1;
    this.applyFilter();
  }

  onSearch(): void {
    this.currentPage = 1;
    this.applyFilter();
  }

  applyFilter(): void {
    let filtered = [...this.estoqueItens];

    if (this.tipoSelecionado) {
      filtered = filtered.filter(item => item.tipo === this.tipoSelecionado);
    }

    if (this.searchQuery.trim()) {
      filtered = filtered.filter(item =>
        item.produtoNome.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        item.referencia.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        item.tipo.toLowerCase().includes(this.searchQuery.toLowerCase())
      );
    }

    this.filteredEstoque = filtered;
    this.updatePagination();
  }

  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredEstoque.length / this.itemsPerPage);
  }

  getPaginatedEstoque(): EstoqueItem[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.filteredEstoque.slice(start, end);
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

  onAddEstoque(): void {
    this.router.navigate(['/app-form-estoque']);
  }

  onEditEstoque(): void {
    if (!this.selectedItem) {
      this.showError('Selecione um item primeiro');
      return;
    }
    this.router.navigate([`/app-form-estoque/${this.selectedItem.publicId}`]);
  }

  onDeleteEstoque(): void {
    if (!this.selectedItem) {
      this.showError('Selecione um item primeiro');
      return;
    }

    this.router.navigate([`/app-exclusion-modal/${this.selectedItem.publicId}/estoque`]);
  }

  onImportXML(): void {
    this.router.navigate(['/import-xml']);
  }

  onRowClick(item: EstoqueItem): void {
    this.selectedItem = this.selectedItem === item ? null : item;
  }

  isSelected(item: EstoqueItem): boolean {
    return this.selectedItem === item;
  }

  private getTipoFromTpLub(tpLub: string): string {
    switch (tpLub) {
      case 'LIQUIDO':
        return 'LIQUIDO';
      case 'GRAXA':
        return 'GRAXA';
      case 'PECA':
        return 'PEÇA';
      default:
        return tpLub;
    }
  }

  private recuperaUnidadeMedida(tpLub: string, qtd: number): string {
    switch (tpLub) {
      case 'LIQUIDO':
        return qtd / 1000 >= 1 ? 'L' : 'ml';
      case 'GRAXA':
        return qtd / 1000 >=1 ? 'Kg' : 'g';
      case 'PECA':
        return 'UN';
      default:
        return 'UN';
    }
  }

  private formatarQuantidade(qtd: number, tpLub: string): string {

    let qtdFormatted;
    if (tpLub === 'PECA') {
      qtdFormatted = qtd;
    } else {
      qtdFormatted = qtd / 1000 >= 1 ? qtd / 1000 : qtd
    };


    return qtdFormatted.toString().replace('.', ',') + ' ' + this.recuperaUnidadeMedida(tpLub, qtd);
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Fechar', {
      duration: 3000,
    });
  }
}
