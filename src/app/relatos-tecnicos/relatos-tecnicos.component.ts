import { Component, OnInit, ViewChild } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { ConfigService } from '../services/config.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { DateRangeModalComponent } from '../date-range-modal/date-range-modal.component';
import { TabelaComponent } from '../tabela/tabela.component';
import { BreadcrumbItem } from '../breadcrumb/breadcrumb.component';

@Component({
  selector: 'app-relatos-tecnicos',
  templateUrl: './relatos-tecnicos.component.html',
  styleUrls: ['./relatos-tecnicos.component.css']
})
export class RelatosTecnicosComponent implements OnInit {
  @ViewChild(TabelaComponent) tabelaComponent!: TabelaComponent;
  
  isLoading = false;
  gerarDocumento = false;
  displayedColumns: string[] = ['n', 'data','dataExecucao', 'operador', 'setor', 'equipamento', 'ponto', 'observacao'];
  displayedColumnsCast: string[] = ['N', 'Data','Data Execução', 'Operador', 'Setor', 'Equipamento', 'Ponto', 'Observação'];
  pdfHeaders: string[] = ['Data', 'Operador', 'Setor', 'Equipamento', 'Ponto', 'Observação'];
  dataLayer: any[] = [];
  pdfData: any[] = [];
  dataInicioExibicao: string = '';
  dataFimExibicao: string = '';
  allData: any[] = [];
  headers = new HttpHeaders().set('Authorization', 'Bearer ' + localStorage.getItem('token'));

  dataInicio: string = '';
  dataFim: string = '';
  currentPage: number = 1;
  itemsPerPage: number = 9;
  totalPages: number = 0;

  breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Início', route: '/' },
    { label: 'Relatos Técnicos', active: true }
  ];

  constructor(
    public dialog: MatDialog,
    private http: HttpClient,
    private router: Router,
    private configService: ConfigService,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    const currentDate = getCurrentDateYYYYMMDD();
    const firstDayOfMonth = getFirstDayOfMonth();
    this.dataInicio = firstDayOfMonth;
    this.dataFim = currentDate;
    this.dataInicioExibicao = formatarDdMmYyy(firstDayOfMonth);
    this.dataFimExibicao = formatarDdMmYyy(currentDate);
    this.fetchRelatosTecnicos(firstDayOfMonth, currentDate);
  }

  updatePagination(): void {
    this.totalPages = Math.ceil(this.dataLayer.length / this.itemsPerPage);
  }

  getPaginatedData(): any[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.dataLayer.slice(start, end);
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

  onFiltrarPeriodo(): void {
    if (!this.dataInicio || !this.dataFim) {
      this.snackBar.open('Selecione o período completo', 'Fechar', {
        duration: 3000,
      });
      return;
    }

    this.dataInicioExibicao = formatarDdMmYyy(this.dataInicio);
    this.dataFimExibicao = formatarDdMmYyy(this.dataFim);
    this.fetchRelatosTecnicos(this.dataInicio, this.dataFim);
  }

  openDateRangeModal(): void {
    const dialogRef = this.dialog.open(DateRangeModalComponent, {
      width: '400px',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const startDate = formatarData(result.startDate);
        const endDate = formatarData(result.endDate);
        this.dataInicioExibicao = formatarDdMmYyy(startDate);
        this.dataFimExibicao = formatarDdMmYyy(endDate);
        this.fetchRelatosTecnicos(startDate, endDate);
      }
    });
  }

  fetchRelatosTecnicos(dataInicio: string, dataFim: string) {
    this.isLoading = true;

    const cliente_id = localStorage.getItem('cliente_id');
    if (cliente_id) {
      this.headers = this.headers.set('user-id', cliente_id);
    }

    const baseUrl = this.configService.getBaseUrl() + '/lubvel/operacao-executada/relato-tecnico';
    let url = baseUrl + `?dataInicio=${dataInicio}&dataFim=${dataFim}`;

    this.http.get<any[]>(url, { headers: this.headers }).subscribe(
      (response: any) => {
        this.dataLayer = response.data.map((item: any, index: number) => ({
          n: index + 1,
          data: formatarDataHora(item.dataHoraExecucao),
          dataExecucao: formatarDataHora(item.dataHoraExecucaoReal),
          operador: item.operador,
          setor: item.setor,
          equipamento: item.equipamento,
          ponto: item.pontoDeLubrificacaoTag,
          observacao: item.observacao
        }));

        this.pdfData = this.dataLayer.map(item => {
          const formattedData = {
            'N': item.n,
            'Data': item.data,
            'Operador': item.operador,
            'Setor': item.setor,
            'Equipamento': item.equipamento,
            'Ponto': item.ponto,
            'Observação': item.observacao
          };
          return formattedData;
        });

        this.currentPage = 1;
        this.updatePagination();
        this.isLoading = false;
      },
      error => {
        console.error('Erro ao buscar relatórios técnicos:', error);
        this.snackBar.open('Erro ao carregar os dados. Por favor, tente novamente.', 'Fechar', {
          duration: 5000,
        });
        this.isLoading = false;
      }
    );
  }

  clearFilters(): void {
    this.gerarDocumento = false;

    const currentDate = getCurrentDateYYYYMMDD();
    const firstDayOfMonth = getFirstDayOfMonth();
    this.dataInicio = firstDayOfMonth;
    this.dataFim = currentDate;
    this.dataInicioExibicao = formatarDdMmYyy(firstDayOfMonth);
    this.dataFimExibicao = formatarDdMmYyy(currentDate);
    this.fetchRelatosTecnicos(firstDayOfMonth, currentDate);
  }

  onGerarPdf(): void {
    this.gerarDocumento = !this.gerarDocumento;
  }
}

function formatarData(data: Date): string {
  const year = data.getFullYear();
  const month = (data.getMonth() + 1).toString().padStart(2, '0');
  const day = data.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatarDdMmYyy(data: string) {
  return data.split('-').reverse().join('/');
}

function getCurrentDateYYYYMMDD() {
  const today = new Date();
  return formatarData(today);
}

function getFirstDayOfMonth() {
  const today = new Date();
  today.setDate(1);
  return formatarData(today);
}

function formatarDataHora(data: string): string {
  const partes = data.split(' ');
  const dataPartes = partes[0].split('-');
  const horaPartes = partes[1].split(':');
  const dia = dataPartes[0];
  const mes = dataPartes[1];
  const ano = dataPartes[2];
  const hora = horaPartes[0];
  const minutos = horaPartes[1];

  return `${dia}/${mes}/${ano} ${hora}:${minutos}`;
}