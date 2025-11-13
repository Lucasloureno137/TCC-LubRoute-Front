import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { ConfigService } from '../services/config.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormControl } from '@angular/forms';
import { Observable, startWith, map } from 'rxjs';
import { BreadcrumbItem } from '../breadcrumb/breadcrumb.component';

interface PontoLubrificacao {
  id: number;
  equipamento: string;
  tag: string;
  tipoLubrificante: string;
  lubrificante: string;
  descricaoComponente: string;
  publicId: string;
  equipamentoPublicId: string;
  produtoPublicId: string;
}

@Component({
  selector: 'app-pt-lubrificacao',
  templateUrl: './pt-lubrificacao.component.html',
  styleUrls: ['./pt-lubrificacao.component.css']
})
export class PtLubrificacaoComponent implements OnInit {
  pontosLubrificacao: PontoLubrificacao[] = [];
  filteredPontos: PontoLubrificacao[] = [];
  searchQuery: string = '';
  currentPage: number = 1;
  itemsPerPage: number = 9;
  totalPages: number = 0;
  selectedPonto: PontoLubrificacao | null = null;

  setorSelecionado: string = '';
  equipamentoSelecionado: any;
  equipamentos: any[] = [];
  setores: any[] = [];
  equipamentoControl = new FormControl<string | any>('');
  filteredEquipamentos!: Observable<any[]>;

  breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Cadastros', route: '/cadastros' },
    { label: 'Pontos de Manutenção', active: true }
  ];

  constructor(
    private http: HttpClient, 
    private router: Router, 
    private configService: ConfigService, 
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.fetchSetores();
    this.setupEquipamentoFilter();
    
    const id_setor = this.router.url.split('/')[2];
    const id_eqp = this.router.url.split('/')[3];

    if (id_setor && id_eqp) {
      this.onSetorChange(id_setor).then(() => {
        setTimeout(() => {
          const equipamento = this.equipamentos.find(eq => eq.publicId === id_eqp);
          if (equipamento) {
            this.onEquipChange(id_eqp);
          }
        }, 500);
      });
    }

    this.loadPontosLubrificacao();    
  }

  setupEquipamentoFilter(): void {
    this.filteredEquipamentos = this.equipamentoControl.valueChanges.pipe(
      startWith(''),
      map(value => {
        const descricao = typeof value === 'string' ? value : value?.descricao;
        return descricao ? this._filterEquipamentos(descricao) : (this.equipamentos || []).slice();
      })
    );
  }

  private _filterEquipamentos(value: string): any[] {
    const filterValue = value.toLowerCase();
    return (this.equipamentos || []).filter((option: any) =>
      option.descricao.toLowerCase().includes(filterValue)
    );
  }

  displayEquipamentoFn(equipamento: any): string {
    return equipamento && equipamento.descricao ? equipamento.descricao : '';
  }

  fetchSetores(): void {
    let headers = new HttpHeaders().set('Authorization', 'Bearer ' + localStorage.getItem('token'));
    const cliente_id = localStorage.getItem('cliente_id');
    if(cliente_id){
      headers = headers.set('user-id', cliente_id);
    }
    const baseUrl = this.configService.getBaseUrl();
    
    this.http.get(baseUrl + '/lubvel/setor', { headers }).subscribe(
      (response: any) => {
        this.setores = response.data;
      },
      error => {
        console.log(error);
      }
    );
  }

  fetchEquipamentos(): void {
    if (!this.setorSelecionado) return;
    
    let headers = new HttpHeaders().set('Authorization', 'Bearer ' + localStorage.getItem('token'));
    const cliente_id = localStorage.getItem('cliente_id');
    if(cliente_id){
      headers = headers.set('user-id', cliente_id);
    }
    const baseUrl = this.configService.getBaseUrl();
    
    this.http.get(baseUrl + '/lubvel/equipamentos/setor/' + this.setorSelecionado, { headers }).subscribe(
      (response: any) => {
        this.equipamentos = response.data;
        this.setupEquipamentoFilter();
      },
      error => {
        console.log(error);
      }
    );
  }

  loadPontosLubrificacao(): void {
    let headers = new HttpHeaders().set('Authorization', 'Bearer ' + localStorage.getItem('token'));
    const cliente_id = localStorage.getItem('cliente_id');
    if(cliente_id){
      headers = headers.set('user-id', cliente_id);
    }
    const baseUrl = this.configService.getBaseUrl();

    let url = '';
    if (!this.setorSelecionado) {
      url = baseUrl + '/lubvel/pontos-de-lubrificacao';
    } else {
      url = baseUrl + '/lubvel/pontos-de-lubrificacao/' + this.setorSelecionado;
    }
    
    this.http.get(url, { headers }).subscribe(
      (response: any) => {
        this.pontosLubrificacao = response.data.map((item: any, index: number) => ({
          id: index + 1,
          equipamento: item.equipamento,
          tag: item.tag,
          tipoLubrificante: item.tipoLubrificante,
          lubrificante: item.lubrificante,
          descricaoComponente: item.descricaoComponente,
          publicId: item.publicId,
          equipamentoPublicId: item.equipamentoPublicId,
          produtoPublicId: item.produtoPublicId
        }));
        this.applyFilter();
      },
      error => {
        console.log(error);
        this.snackBar.open('Erro ao carregar pontos de manutenção', 'Fechar', {
          duration: 3000,
        });
      }
    );
  }

  onSetorChange(setorPublicId: string): Promise<void> {
    return new Promise((resolve) => {
      this.setorSelecionado = setorPublicId;
      this.equipamentoSelecionado = null;
      this.equipamentoControl.setValue('');
      this.selectedPonto = null;
      this.pontosLubrificacao = [];
      this.filteredPontos = [];
      
      this.loadPontosLubrificacao();
      this.fetchEquipamentos();
      resolve();
    });
  }

  onEquipChange(equipamento: any): void {
    if (!this.setorSelecionado) {
      this.snackBar.open('Selecione um setor primeiro!', 'Fechar', {
        duration: 2000,
      });
      return;
    }
    
    this.equipamentoSelecionado = equipamento;
    this.applyFilter();
  }

  limparFiltro() {
    this.setorSelecionado = '';
    this.searchQuery = '';
    this.equipamentoSelecionado = '';
    this.loadPontosLubrificacao();
  }

  onSearch(): void {
    this.currentPage = 1;
    this.applyFilter();
  }

  applyFilter(): void {
    let filtered = [...this.pontosLubrificacao];

    if (this.equipamentoSelecionado) {
      filtered = filtered.filter(ponto => ponto.equipamentoPublicId === this.equipamentoSelecionado.publicId);
    }

    if (this.searchQuery.trim()) {
      filtered = filtered.filter(ponto => 
        ponto.equipamento.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        ponto.tag.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        ponto.tipoLubrificante.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        ponto.lubrificante.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        ponto.descricaoComponente.toLowerCase().includes(this.searchQuery.toLowerCase())
      );
    }

    this.filteredPontos = filtered.map((item, index) => ({
      ...item,
      id: index + 1
    }));
    
    this.updatePagination();
  }

  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredPontos.length / this.itemsPerPage);
  }

  getPaginatedPontos(): PontoLubrificacao[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.filteredPontos.slice(start, end);
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

  onAddPonto(): void {
    this.router.navigate([`/app-form-pt-manutencao`]);
  }

  onEditPonto(): void {
    if (!this.selectedPonto) {
      this.showError('Selecione um ponto primeiro');
      return;
    }
    this.router.navigate([`/app-form-pt-manutencao/${this.selectedPonto.publicId}/${this.selectedPonto.equipamentoPublicId}/${this.selectedPonto.produtoPublicId}/${this.selectedPonto.tag}/${this.selectedPonto.descricaoComponente}`]);
  }

  onDeletePonto(): void {
    if (!this.selectedPonto) {
      this.showError('Selecione um ponto primeiro');
      return;
    }
    
    this.router.navigate([`/app-exclusion-modal/${this.selectedPonto.publicId}/pontos-de-lubrificacao`]);
  }

  onAddManutencao(): void {
    if (!this.selectedPonto) {
      this.showError('Selecione um ponto primeiro');
      return;
    }
    
    this.router.navigate([`/app-form-operacao/${this.selectedPonto.publicId}/${this.selectedPonto.equipamentoPublicId}`]);
  }

  onViewQRCode(): void {
    if (!this.selectedPonto) {
      this.showError('Selecione um ponto primeiro');
      return;
    }
    
    this.router.navigate([`/app-qr-code/pt_lubrificacao/${this.selectedPonto.tag}/${this.selectedPonto.tag}`]);
  }

  onRowClick(ponto: PontoLubrificacao): void {
    this.selectedPonto = this.selectedPonto === ponto ? null : ponto;
  }

  isSelected(ponto: PontoLubrificacao): boolean {
    return this.selectedPonto === ponto;
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Fechar', {
      duration: 3000,
    });
  }
}