import { Component, OnInit, ViewChild } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { ConfigService } from '../services/config.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { BreadcrumbItem } from '../breadcrumb/breadcrumb.component';
import { TabelaComponent } from '../tabela/tabela.component';
import { DateRangeModalComponent } from '../date-range-modal/date-range-modal.component';

interface AcaoMarco {
  id: number;
  marco: string;
  tabela: string;
  dataHora: string;
  usuario: string;
  observacao: string;
}

@Component({
  selector: 'app-acoes-marcos',
  templateUrl: './acoes-marcos.component.html',
  styleUrls: ['./acoes-marcos.component.css']
})
export class AcoesMarcosComponent implements OnInit {
  @ViewChild(TabelaComponent) tabelaComponent!: TabelaComponent;
  
  acoesMarcos: AcaoMarco[] = [];
  filteredAcoesMarcos: AcaoMarco[] = [];
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalPages: number = 0;
  isLoading: boolean = false;
  searchQuery: string = '';
  
  displayedColumns: string[] = ['id', 'marco', 'tabela', 'dataHora', 'usuario', 'observacao'];
  displayedColumnsCast: string[] = ['ID', 'Marco', 'Tabela', 'Data/Hora', 'Usuário', 'Observação'];
  
  tiposMarco: string[] = [];
  tiposTabela: string[] = [];
  filtroMarco: string = '';
  filtroTabela: string = '';
  mostrarFiltrosAvancados: boolean = false;
  
  dataInicioExibicao: string = '';
  dataFimExibicao: string = '';
  
  gerarDocumento: boolean = false;
  pdfHeaders: string[] = ['ID', 'Marco', 'Tabela', 'Data/Hora', 'Usuário', 'Observação'];
  pdfData: any[] = [];

  breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Dashboard', route: '/dashboard' },
    { label: 'Logs do Sistema', active: true }
  ];

  constructor(
    private http: HttpClient,
    private router: Router,
    private configService: ConfigService,
    private snackBar: MatSnackBar,
    public dialog: MatDialog
  ) { }

  ngOnInit(): void {
    const currentDate = this.getCurrentDateYYYYMMDD();
    const firstDayOfMonth = this.getFirstDayOfMonth();
    this.dataInicioExibicao = this.formatarDdMmYyy(firstDayOfMonth);
    this.dataFimExibicao = this.formatarDdMmYyy(currentDate);
    this.loadAcoesMarcos(firstDayOfMonth, currentDate);
  }

  openDateRangeModal(): void {
    const dialogRef = this.dialog.open(DateRangeModalComponent, {
      width: '400px',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const startDate = this.formatarData(result.startDate);
        const endDate = this.formatarData(result.endDate);
        this.dataInicioExibicao = this.formatarDdMmYyy(startDate);
        this.dataFimExibicao = this.formatarDdMmYyy(endDate);
        this.loadAcoesMarcos(startDate, endDate);
      }
    });
  }

  loadAcoesMarcos(dataInicio: string, dataFim: string): void {
    this.isLoading = true;
    this.resetFiltros();

    let headers = new HttpHeaders().set('Authorization', 'Bearer ' + localStorage.getItem('token'));
    const cliente_id = localStorage.getItem('cliente_id');
    if (cliente_id) {
      headers = headers.set('user-id', cliente_id);
    }

    const baseUrl = this.configService.getBaseUrl();

    this.http.get(`${baseUrl}/lubvel/marcos?startDate=${dataInicio}&endDate=${dataFim}`, { headers }).subscribe(
      (response: any) => {
        if (response.success) {
          this.acoesMarcos = response.data.map((item: any, index: number) => ({
            id: index + 1,
            marco: item.marco,
            tabela: item.tabela,
            dataHora: this.formatarDataHoraISO(item.dataHora),
            usuario: item.usuario,
            observacao: item.observacao
          }));

          this.tiposMarco = [...new Set(this.acoesMarcos.map(item => item.marco))];
          this.tiposTabela = [...new Set(this.acoesMarcos.map(item => item.tabela))];
          
          this.applyFilter();
        } else {
          this.showError(`Erro ao buscar dados: ${response.message}`);
          this.acoesMarcos = [];
        }
        this.isLoading = false;
      },
      error => {
        console.error('Erro ao buscar marcos:', error);
        this.showError('Erro ao buscar os marcos do sistema. Por favor, tente novamente.');
        this.acoesMarcos = [];
        this.isLoading = false;
      }
    );
  }

  onSearch(): void {
    this.currentPage = 1;
    this.applyFilter();
  }

  applyFilter(): void {
    let filtered = [...this.acoesMarcos];

    if (this.searchQuery.trim()) {
      filtered = filtered.filter(item => 
        item.marco.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        item.tabela.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        item.usuario.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        item.observacao.toLowerCase().includes(this.searchQuery.toLowerCase())
      );
    }

    if (this.filtroMarco) {
      filtered = filtered.filter(item => item.marco === this.filtroMarco);
    }

    if (this.filtroTabela) {
      filtered = filtered.filter(item => item.tabela === this.filtroTabela);
    }

    this.filteredAcoesMarcos = filtered;
    this.updatePagination();
    this.updatePdfData();
  }

  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredAcoesMarcos.length / this.itemsPerPage);
  }

  updatePdfData(): void {
    this.pdfData = this.filteredAcoesMarcos.map(item => ({
      'ID': item.id,
      'Marco': item.marco,
      'Tabela': item.tabela,
      'Data/Hora': item.dataHora,
      'Usuário': item.usuario,
      'Observação': item.observacao
    }));
  }

  getPaginatedAcoesMarcos(): AcaoMarco[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.filteredAcoesMarcos.slice(start, end);
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

  toggleFiltrosAvancados(): void {
    this.mostrarFiltrosAvancados = !this.mostrarFiltrosAvancados;
  }

  resetFiltros(): void {
    this.filtroMarco = '';
    this.filtroTabela = '';
    this.searchQuery = '';
    this.currentPage = 1;
  }

  clearFilters(): void {
    this.resetFiltros();
    this.mostrarFiltrosAvancados = false;
    this.gerarDocumento = false;

    const currentDate = this.getCurrentDateYYYYMMDD();
    const firstDayOfMonth = this.getFirstDayOfMonth();
    this.dataInicioExibicao = this.formatarDdMmYyy(firstDayOfMonth);
    this.dataFimExibicao = this.formatarDdMmYyy(currentDate);
    this.loadAcoesMarcos(firstDayOfMonth, currentDate);
  }

  onTogglePdf(): void {
    this.gerarDocumento = !this.gerarDocumento;
  }

  private formatarData(data: Date): string {
    const year = data.getFullYear();
    const month = (data.getMonth() + 1).toString().padStart(2, '0');
    const day = data.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private formatarDdMmYyy(data: string): string {
    return data.split('-').reverse().join('/');
  }

  private getCurrentDateYYYYMMDD(): string {
    const today = new Date();
    return this.formatarData(today);
  }

  private getFirstDayOfMonth(): string {
    const today = new Date();
    today.setDate(1);
    return this.formatarData(today);
  }

  private formatarDataHoraISO(dataISO: string): string {
    const data = new Date(dataISO);
    const dia = data.getDate().toString().padStart(2, '0');
    const mes = (data.getMonth() + 1).toString().padStart(2, '0');
    const ano = data.getFullYear();
    const hora = data.getHours().toString().padStart(2, '0');
    const minutos = data.getMinutes().toString().padStart(2, '0');
    return `${dia}/${mes}/${ano} ${hora}:${minutos}`;
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Fechar', {
      duration: 5000,
    });
  }
}