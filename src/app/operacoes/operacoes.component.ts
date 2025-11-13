import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { ConfigService } from '../services/config.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BreadcrumbItem } from '../breadcrumb/breadcrumb.component';

interface Operacao {
  id: number;
  publicId: string;
  pontoDeLubrificacaoTag: string;
  pontoDeLubrificacaoDescricaoComponente: string;
  usuarioClienteId: string;
  usuarioClienteNome: string;
  equipamentoNome: string;
  frequencia: string;
  atividade: string;
  dataHoraInicio: string;
  modoAplicacao: string;
  isSuspenso: boolean;
  setorPublicId: string;
}

interface Setor {
  publicId: string;
  nome: string;
}

@Component({
  selector: 'app-operacoes',
  templateUrl: './operacoes.component.html',
  styleUrls: ['./operacoes.component.css']
})
export class OperacoesComponent implements OnInit {
  operacoes: Operacao[] = [];
  filteredOperacoes: Operacao[] = [];
  searchQuery: string = '';
  currentPage: number = 1;
  itemsPerPage: number = 9;
  totalPages: number = 0;
  selectedOperacao: Operacao | null = null;
  setores: Setor[] = [];
  setorSelecionado: string = '';
  isLoading: boolean = false;

  breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Cadastros', route: '/cadastros' },
    { label: 'Operações', active: true }
  ];

  constructor(
    private http: HttpClient,
    private router: Router,
    private configService: ConfigService,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.isLoading = true;
    this.loadSetores();
    this.loadOperacoes();
  }

  loadSetores(): void {
    let headers = new HttpHeaders().set('Authorization', 'Bearer ' + localStorage.getItem('token'));
    const cliente_id = localStorage.getItem('cliente_id');
    if (cliente_id) {
      headers = headers.set('user-id', cliente_id);
    }
    const baseUrl = this.configService.getBaseUrl();

    this.http.get(baseUrl + '/lubvel/setor', { headers }).subscribe(
      (response: any) => {
        this.setores = response.data;
      },
      error => {
        console.log(error);
        this.snackBar.open('Erro ao carregar setores', 'Fechar', {
          duration: 3000,
        });
      }
    );
  }

  loadOperacoes(): void {
    let headers = new HttpHeaders().set('Authorization', 'Bearer ' + localStorage.getItem('token'));
    const cliente_id = localStorage.getItem('cliente_id');
    if (cliente_id) {
      headers = headers.set('user-id', cliente_id);
    }
    const baseUrl = this.configService.getBaseUrl();

    this.http.get(baseUrl + '/lubvel/operacoes', { headers }).subscribe(
      (response: any) => {
        this.operacoes = response.data.map((item: any, index: number) => ({
          id: index + 1,
          publicId: item.publicId,
          pontoDeLubrificacaoTag: item.pontoDeLubrificacaoTag,
          pontoDeLubrificacaoDescricaoComponente: item.pontoDeLubrificacaoDescricaoComponente,
          usuarioClienteId: item.usuarioClienteId,
          usuarioClienteNome: item.usuarioClienteNome,
          equipamentoNome: item.equipamentoNome,
          frequencia: item.frequencia,
          atividade: item.atividade,
          dataHoraInicio: this.formatarDataHoraDdMmYyyy(item.dataHoraInicio),
          modoAplicacao: item.modoAplicacao,
          isSuspenso: item.isSuspenso,
          setorPublicId: item.setorPublicId,
        }));
        this.applyFilter();
        this.isLoading = false;
      },
      error => {
        console.log(error);
        this.snackBar.open('Erro ao carregar operações', 'Fechar', {
          duration: 3000,
        });
        this.isLoading = false;
      }
    );
  }

  onSetorChange(setorPublicId: string): void {
    this.setorSelecionado = setorPublicId;
    this.currentPage = 1;
    this.applyFilter();
  }

  limparFiltro() {
    this.setorSelecionado = '';
    this.searchQuery = '';
    this.loadOperacoes();
  }

  onSearch(): void {
    this.currentPage = 1;
    this.applyFilter();
  }

  applyFilter(): void {
    let filtered = [...this.operacoes];

    if (this.setorSelecionado) {
      filtered = filtered.filter(operacao =>
        operacao.setorPublicId.includes(this.setorSelecionado)
      );
    }

    if (this.searchQuery.trim()) {
      filtered = filtered.filter(operacao =>
        operacao.pontoDeLubrificacaoTag.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        operacao.equipamentoNome.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        operacao.atividade.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        operacao.modoAplicacao.toLowerCase().includes(this.searchQuery.toLowerCase())
      );
    }

    this.filteredOperacoes = filtered;
    this.updatePagination();
  }

  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredOperacoes.length / this.itemsPerPage);
  }

  getPaginatedOperacoes(): Operacao[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.filteredOperacoes.slice(start, end);
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

  onAddOperacao(): void {
    this.router.navigate(['/app-form-filter-pt-lubrificacao']);
  }

  onEditOperacao(): void {
    if (!this.selectedOperacao) {
      this.showError('Selecione uma operação primeiro');
      return;
    }

    if (this.selectedOperacao.isSuspenso) {
      this.showError('Não é possível editar operação suspensa');
      return;
    }

    this.router.navigate([`/app-form-operacao/${this.selectedOperacao.publicId}`]);
  }

  onDeleteOperacao(): void {
    if (!this.selectedOperacao) {
      this.showError('Selecione uma operação primeiro');
      return;
    }

    if (this.selectedOperacao.isSuspenso) {
      this.showError('Não é possível excluir operação suspensa');
      return;
    }

    this.router.navigate([`/app-exclusion-modal/${this.selectedOperacao.publicId}/operacoes`]);
  }

  onRowClick(operacao: Operacao): void {
    this.selectedOperacao = this.selectedOperacao === operacao ? null : operacao;

    if (operacao && operacao.isSuspenso) {
      this.snackBar.open('Operação Suspensa', 'Fechar', {
        duration: 5000,
      });
    }
  }

  isSelected(operacao: Operacao): boolean {
    return this.selectedOperacao === operacao;
  }

  private formatarDataHoraDdMmYyyy(dataHoraInicio: any): string {
    const data = new Date(dataHoraInicio);
    const dia = data.getDate().toString().padStart(2, '0');
    const mes = (data.getMonth() + 1).toString().padStart(2, '0');
    const ano = data.getFullYear();
    const hora = data.getHours().toString().padStart(2, '0');
    const minuto = data.getMinutes().toString().padStart(2, '0');
    return `${dia}/${mes}/${ano} ${hora}:${minuto}`;
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Fechar', {
      duration: 3000,
    });
  }
}