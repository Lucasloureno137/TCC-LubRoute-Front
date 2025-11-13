import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ConfigService } from '../services/config.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BreadcrumbItem } from '../breadcrumb/breadcrumb.component';

interface Filtro {
  valores: string[];
  nome: string;
}

interface RelatorioSalvo {
  id: number;
  nome: string;
  categoria: string;
  ultimaVezGerado: string;
}

@Component({
  selector: 'app-relatorios',
  templateUrl: './relatorios.component.html',
  styleUrls: ['./relatorios.component.css']
})
export class RelatoriosComponent implements OnInit {

  dataSource: any[] = [];
  dataSourceOriginal: any[] = [];
  header: string[] = [];
  titulo: string = '';
  showTable: boolean = false;
  filtros: Filtro[] = [];
  filtroHabilitado = false;
  filtrosSelecionados: any[] = [];
  isMobile = false;

  dataInicio: string = '';
  dataFim: string = '';
  tipoRelatorio: string = '';
  labelAdicional1: string = '';
  labelAdicional2: string = '';
  labelAdicional3: string = '';
  labelAdicional4: string = '';

  searchQuery: string = '';
  currentPage: number = 1;
  itemsPerPage: number = 9;
  totalPages: number = 0;

  relatoriosSalvos: RelatorioSalvo[] = [
    {
      id: 1,
      nome: 'Produtos em Estoque',
      categoria: 'Estoque',
      ultimaVezGerado: '01/03/2025 11:43'
    }
  ];

  filteredRelatorios: RelatorioSalvo[] = [];

  breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Início', route: '/' },
    { label: 'Relatórios', active: true }
  ];

  options: string[] = ['Equipamentos', 'Estoque', 'Operações executadas', 'Atividades do dia'];
  gerarDocumento: boolean = false;
  relatorioSelecionado: string = '';

  constructor(
    private http: HttpClient,
    private router: Router,
    private configService: ConfigService,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    if (window.innerWidth <= 800) {
      this.isMobile = true;
    }
    this.filteredRelatorios = [...this.relatoriosSalvos];
    this.updatePagination();
  }

  onSearch(): void {
    this.currentPage = 1;
    this.applySearchFilter();
  }

  applySearchFilter(): void {
    if (!this.searchQuery.trim()) {
      this.filteredRelatorios = [...this.relatoriosSalvos];
    } else {
      this.filteredRelatorios = this.relatoriosSalvos.filter(relatorio =>
        relatorio.nome.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        relatorio.categoria.toLowerCase().includes(this.searchQuery.toLowerCase())
      );
    }
    this.updatePagination();
  }

  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredRelatorios.length / this.itemsPerPage);
  }

  getPaginatedRelatorios(): RelatorioSalvo[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.filteredRelatorios.slice(start, end);
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

  onGerarRelatorio(): void {
    if (!this.tipoRelatorio) {
      this.snackBar.open('Selecione o tipo de relatório', 'Fechar', {
        duration: 3000,
      });
      return;
    }

    this.onSelectChange(this.tipoRelatorio);
  }

  onGerarRelatorioSalvo(relatorio: RelatorioSalvo): void {
    this.onSelectChange(relatorio.categoria);
  }

  limparForm() {
    this.relatorioSelecionado = '';
    this.tipoRelatorio = '';
    this.dataInicio = '';
    this.dataFim = '';
    this.labelAdicional1 = '';
    this.labelAdicional2 = '';
    this.labelAdicional3 = '';
    this.labelAdicional4 = '';
    this.gerarDocumento = false;
    this.showTable = false;
    this.dataSource = [];
    this.header = [];
    this.titulo = '';
    this.filtros = [];
    this.filtroHabilitado = false;
  }

  onSelectChange(arg0: any) {
    this.limparForm();
    this.relatorioSelecionado = arg0;

    if (arg0 === 'Equipamentos') {
      this.titulo = 'Relatório de Equipamentos';
    } else if (arg0 === 'Estoque') {
      this.titulo = 'Relatório de Estoque';
    } else if (arg0 === 'Operações executadas') {
      this.titulo = 'Relatório de Operações Executadas';
    } else if (arg0 === 'Atividades do dia') {
      this.titulo = 'Relatório de Atividades do dia';
    }

    Promise.all([
      this.fetchDados(arg0)
    ]).then(() => {
      this.mapDataWithHeader();
      this.dataSourceOriginal = this.dataSource;
      this.showTable = true;
    });
  }

  filtrarData(coluna: string, valor: string) {
    const filtroExistenteIndex = this.filtrosSelecionados.findIndex(filtro => filtro.coluna === coluna);

    if (filtroExistenteIndex !== -1) {
      this.filtrosSelecionados.splice(filtroExistenteIndex, 1);
    }

    this.filtrosSelecionados.push({ coluna, valor });
    this.aplicarFiltros();
  }

  aplicarFiltros() {
    this.dataSource = [...this.dataSourceOriginal];

    this.filtrosSelecionados.forEach(filtro => {
      this.dataSource = this.dataSource.filter((item: any) => item[filtro.coluna] === filtro.valor);
    });
  }

  mapDataWithHeader() {
    if (this.relatorioSelecionado === 'Equipamentos') {
      this.dataSource = this.dataSource.map((item: any) => {
        return {
          'Descricao': item.descricao,
          'Setor': item.setor,
          'Tag': item.tag,
        }
      });
    } else if (this.relatorioSelecionado === 'Estoque') {
      this.dataSource = this.dataSource.map((item: any) => {
        return {
          'Nome': item.produtoNome,
          'Unidades': item.unidades,
          'Qtd por unidade': formataQuantidade(item.qtdPorUnidade) + ' ' + recuperaUnidadeMedida(item.tpLub, item.qtdPorUnidade),
          'Qtd Total': item.qtdPorUnidade != 0 ? formataQuantidade(item.qtd) + ' ' + recuperaUnidadeMedida(item.tpLub, item.qtd) : '0',
        }
      });
    } else if (this.relatorioSelecionado === 'Operações executadas') {
      this.dataSource = this.dataSource.map((item: any) => {
        return {
          'Atividade': item.atividade,
          'Produto': item.produto,
          'Quantidade': formataQuantidade(item.quantidade) + ' ' + recuperaUnidadeMedida(item.tpLub, item.quantidade),
          'Data para execução': item.data,
          'Data Execução': item.dataHoraExecucao,
          'Observacao': item.observacao === null ? '' : item.observacao,
        }
      });
    } else if (this.relatorioSelecionado === 'Atividades do dia') {
      this.dataSource = this.dataSource.map((item: any) => {
        let tipoProduto = null;
        if(item.operacao.atividade === 'LUBRIFICACAO'){
          tipoProduto = item.operacao.produto.tipoLubrificante;
        }
        return {
          'Setor': item.equipamento.setor,
          'Equipamento': item.equipamento.descricao,
          'Tag ponto': item.operacao.pontoDeLubrificacaoTag,
          'Data e Hora': item.dataHoraParaExecucao,
          'Atividade': item.operacao.atividade,
          'Quantidade': formataQuantidade(item.operacao.quantidade) + ' ' + recuperaUnidadeMedida(tipoProduto, item.operacao.quantidade),
          'Modo Aplicação': item.operacao.modoAplicacao,
        }
      });
    }
    this.criarFiltros();
  }

  criarFiltros() {
    this.filtros = [];
    this.header.forEach((item: any) => {
      this.filtros.push({ valores:  Array.from(new Set(this.dataSource.map((data: any) => data[item]))), nome: item });
    });
  }

  fetchDados(arg0: any): Promise<void> {
    return new Promise((resolve, reject) => {
      const enumParam = deparaTipoRelatorio(arg0);
      let headers = new HttpHeaders().set('Authorization', 'Bearer ' + localStorage.getItem('token'));
      const cliente_id = localStorage.getItem('cliente_id');
      if(cliente_id){
        headers = headers.set('user-id', cliente_id);
      }
      const baseUrl = this.configService.getBaseUrl();
      const url = baseUrl + '/lubvel/relatorios/' + enumParam;

      this.http.get(url, { headers }).subscribe(
        (response: any) => {
          this.dataSource = response.data.dados;
          this.header = response.data.cabecalho;
          resolve();
        },
        error => {
          console.log(error);
          reject(error);
        }
      );
    });
  }

  removerFiltros() {
    this.filtrosSelecionados = [];
    this.dataSource = this.dataSourceOriginal;
    this.criarFiltros();
  }
}

function deparaTipoRelatorio(arg0: any) {
  let enumParam = '';
  switch (arg0) {
    case 'Equipamentos':
      enumParam = 'equipamentos';
      break;
    case 'Estoque':
      enumParam = 'estoque';
      break;
    case 'Operações executadas':
      enumParam = 'operacoes';
      break;
    case 'Atividades do dia':
      enumParam = 'atividadesdia';
      break;
  }
  return enumParam.toUpperCase();
}

function recuperaUnidadeMedida(tpLub: any, qtd: any) {
  if(!tpLub || !qtd){
    return "";
  }
  if (tpLub == 'LIQUIDO') {
    if (qtd / 1000 >= 1) {
      return 'L';
    } else {
      return 'ml';
    }
  } else {
    if (qtd / 1000 >= 1) {
      return 'Kg';
    } else {
      return 'g';
    }
  }
}

function formataQuantidade(qtd: any) {
  if(!qtd){
    return "";
  }
  if (qtd / 1000 >= 1) {
    return qtd / 1000;
  } else {
    return qtd;
  }
}
