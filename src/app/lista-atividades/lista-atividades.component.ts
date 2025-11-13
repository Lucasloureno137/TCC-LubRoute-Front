import { Component, OnInit, ViewChild } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { ConfigService } from '../services/config.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TabelaComponent } from '../tabela/tabela.component';
import { MatDialog } from '@angular/material/dialog';
import { DateRangeModalComponent } from '../date-range-modal/date-range-modal.component';
import Swal from 'sweetalert2';
import { NotificationService } from '../services/notification.service';
import { BreadcrumbItem } from '../breadcrumb/breadcrumb.component';
import { UserService } from '../services/user.service';
import { combineLatest, map, Observable, startWith } from 'rxjs';
import { FormControl } from '@angular/forms';

interface Atividade {
  n: number;
  pontoDeLubrificacaoTag: string;
  equipamentoNome: string;
  publicId: string;
  frequencia: string;
  atividade: string;
  dataHoraParaExecucao: string;
  modoAplicacao: string;
  tempoParaExecutar: string;
  executado: boolean;
  setor_id: string;
  produto: string;
  produto_id: string;
  quantidade: string;
  quantidadeUnformatted: number;
  future: boolean;
  equipamento_id: string;
  pausado: boolean;
  atividadeRequerMaquinaDesligada: boolean;
  descComponentePtLub: string;
}

@Component({
  selector: 'app-lista-atividades',
  templateUrl: './lista-atividades.component.html',
  styleUrl: './lista-atividades.component.css'
})
export class ListaAtividadesComponent implements OnInit {

  @ViewChild(TabelaComponent) tabelaComponent!: TabelaComponent;

  userManager: boolean = false;
  isAdmin: boolean = false;

  scanActive: boolean = false;
  informar_manual: boolean = false;
  scanModeConfirm: boolean = false;
  codigo: string = '';
  equipamentos: any;
  equipamentoSelecionado: any;
  equipamentoControl = new FormControl<string | any>('');
  filteredEquipamentos!: Observable<any[]>;
  modalAberta: boolean = false;
  modal_confirma_codigo: boolean = false;
  observacao: any;
  isSemanal: boolean = false;
  isRangeDate: boolean = false;
  periodo: string = 'SEMANAL';
  setorSelecionado: string = "";
  setores: any[] = [];
  headers = new HttpHeaders().set('Authorization', 'Bearer ' + localStorage.getItem('token'));
  atividades = ['LIMPEZA', 'LUBRIFICACAO', 'MANUTENCAO'];
  startDate: any;
  endDate: any;
  dataLayer: Atividade[] = [];
  allData: any[] = []; // Esta é a fonte da verdade
  currentPage = 1;
  itemsPerPage = 9;
  itemsPerPageOptions = [9, 18, 27, 36];
  atividadesSelecionadas: any[] = [];
  pontosDeLubrificacao: Set<string> = new Set();
  confirmados: Set<string> = new Set();
  totalAtividades: number = 0;
  totalPontosUnicos: number = 0;
  listaObjeto: any[] = [];
  habilitarExecutar = false;
  observacoes: { [key: string]: string } = {};
  indiceAtual: number = 0;
  isLoading = false;
  isExecutadasFilterActive = false; // Estado do toggle "Ocultar executadas"
  isMaquinaDesligadaFilterActive = false; // Estado do toggle "Requer Maquina Desligada"
  filtrosSelecionados: any[] = []; // Lógica de filtro antiga (mantida para não quebrar)
  filtros: any[] = []; // Lógica de filtro antiga
  atividadeSelecionada: string = '';
  modalQuantidadeLub = false;
  quantidadeLubrificante: number = 0;
  unidadeMedidaLub: string = '';
  unidadeMedidaOptions: string[] = [];
  unidadeMedidaSelecionada: string = '';
  executionStats = { total: 0, executed: 0 };
  needConfirmScan: boolean = true;
  pdfHeaders: string[] = [];
  pdfData: any[] = [];
  showPdfGenerator: boolean = false;

  breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Painel', route: '/dashboard' },
    { label: 'Atividades', active: true }
  ];

  closeModalAndReset() {
    this.modalAberta = false;
    this.modalQuantidadeLub = false;
    this.observacoes = {};
    this.habilitarExecutar = false;
    this.indiceAtual = 0;
  }

  applyAllFilters() {
    let filteredData = [...this.allData]; // Começa com a lista completa

    if (this.atividadeSelecionada) {
      filteredData = filteredData.filter((item: any) => item.operacao.atividade === this.atividadeSelecionada);
    }

    if (this.setorSelecionado) {
      filteredData = filteredData.filter((item: any) => item.equipamento.setorPublicId === this.setorSelecionado);
    }

   
    if (this.equipamentoSelecionado) {
      filteredData = filteredData.filter((item: any) => item.equipamento.publicId === this.equipamentoSelecionado.publicId);
    }

   
    if (this.isExecutadasFilterActive) {
      filteredData = filteredData.filter((item: any) => !item.executado);
    }

    if (this.isMaquinaDesligadaFilterActive) {
      filteredData = filteredData.filter((item: any) => item.operacao.atividadeRequerMaquinaDesligada);
    }

    this.dataLayer = this.mapToDto(filteredData);
  }

  filtrarNaoExecutadasBtnToggle() {
    this.isExecutadasFilterActive = !this.isExecutadasFilterActive;
    this.applyAllFilters();
  }


  filtrarMaquinaDesligadaBtnToggle() {
    this.isMaquinaDesligadaFilterActive = !this.isMaquinaDesligadaFilterActive;
    this.applyAllFilters();
  }

  getChaveUnica(publicId: string, dataHoraParaExecucao: string): string {
    return `${publicId}_${dataHoraParaExecucao}`;
  }

  proximo() {
    if (this.indiceAtual < this.listaObjeto.length - 1) {
      this.indiceAtual++;
    }
  }

  voltar() {
    if (this.indiceAtual > 0) {
      this.indiceAtual--;
    }
  }

  informarObservacoes() {
    this.habilitarExecutar = true;
  }

  tratarQuantidade() {
    const atividade = this.listaObjeto[this.indiceAtual];
    if (['LUBRIFICACAO', 'MANUTENCAO'].includes(atividade.atividade)) {
      this.quantidadeLubrificante = atividade.quantidade || 10;
      let unidadesMedidaLiquido = ['L', 'ml'];

      const tipoLub = atividade.unidadeMedida == 'un' ? 'PECA'
        : unidadesMedidaLiquido.includes(atividade.unidadeMedida) ? 'LIQUIDO' : 'GRAXA';

      this.unidadeMedidaOptions = this.defineUnidadesMedida(tipoLub);

      if (tipoLub == 'PECA') {
        this.unidadeMedidaSelecionada = 'un';
      } else {
        this.unidadeMedidaSelecionada = this.quantidadeLubrificante >= 1000 ?
          (tipoLub === 'LIQUIDO' ? 'L' : 'Kg') :
          (tipoLub === 'LIQUIDO' ? 'ml' : 'GRAXA');
      }

      if (this.unidadeMedidaSelecionada === 'L' || this.unidadeMedidaSelecionada === 'Kg') {
        this.quantidadeLubrificante = this.quantidadeLubrificante / 1000;
      }

      this.modalQuantidadeLub = true;
    } else {
      this.abrirModalObservacoes();
    }
  }

  defineUnidadesMedida(tpLub: string) {
    const unidadesDeMedidaMapper: Record<string, string[]> = {
      'GRAXA': ['g', 'Kg'],
      'LIQUIDO': ['ml', 'L'],
      'PECA': ['un'],
    }

    return unidadesDeMedidaMapper[tpLub];
  }

  marcarComoNaoUtilizado() {
    this.quantidadeLubrificante = 0;
    this.listaObjeto[this.indiceAtual].quantidadeUnformatted = 0;
    this.abrirModalObservacoes();
    this.modalQuantidadeLub = false;
  }

  confirmarQuantidade() {
    let quantidadeBase = this.quantidadeLubrificante;
    if (this.unidadeMedidaSelecionada === 'L' || this.unidadeMedidaSelecionada === 'Kg') {
      quantidadeBase = this.quantidadeLubrificante * 1000;
    }

    this.listaObjeto[this.indiceAtual].quantidadeUnformatted = quantidadeBase;
    this.modalQuantidadeLub = false;
    this.abrirModalObservacoes();
  }

  onUnidadeMedidaChange(novaUnidade: string) {
    const unidadeAnterior = this.unidadeMedidaSelecionada;
    this.unidadeMedidaSelecionada = novaUnidade;

    if ((unidadeAnterior === 'L' || unidadeAnterior === 'Kg') &&
      (novaUnidade === 'ml' || novaUnidade === 'g')) {
      this.quantidadeLubrificante = this.quantidadeLubrificante * 1000;
    } else if ((unidadeAnterior === 'ml' || unidadeAnterior === 'g') &&
      (novaUnidade === 'L' || novaUnidade === 'Kg')) {
      this.quantidadeLubrificante = this.quantidadeLubrificante / 1000;
    }
  }

  abrirModalObservacoes() {
    this.modalAberta = true;
  }

  proximoPasso() {
    if (this.indiceAtual < this.listaObjeto.length - 1) {
      this.indiceAtual++;
      this.modalAberta = false;
      this.habilitarExecutar = false;
      this.tratarQuantidade();
    } else {
      this.executarTarefa();
    }
  }

  tratarListaAtividades() {
    this.listaObjeto = this.atividadesSelecionadas.map((item: any) => {
      return {
        codigo: item.produto_id,
        quantidade: item.quantidadeUnformatted,
        atividade: item.atividade,
        pontoDeLubrificacaoTag: item.pontoDeLubrificacaoTag,
        publicId: item.publicId,
        dataHoraParaExecucao: item.dataHoraParaExecucao,
        produto: item.produto
      };
    });
    this.conferirEstoque(this.listaObjeto);
  }

  onSelecionarAtividade(event: { atividade: any; selecionado: boolean }) {
    const { atividade, selecionado } = event;

    if (atividade.executado) return;

    if (selecionado) {
      if (!this.atividadesSelecionadas.includes(atividade)) {
        this.atividadesSelecionadas.push(atividade);
      }
    } else {
      const index = this.atividadesSelecionadas.indexOf(atividade);
      if (index !== -1) {
        this.atividadesSelecionadas.splice(index, 1);
      }
    }
  }

  onExecutarAtividade(event: any) {
    this.listaObjeto = [{
      codigo: event.produto_id,
      quantidade: event.quantidadeUnformatted,
      atividade: event.atividade,
      pontoDeLubrificacaoTag: event.pontoDeLubrificacaoTag,
      publicId: event.publicId,
      dataHoraParaExecucao: event.dataHoraParaExecucao,
      produto: event.produto,
      unidadeMedida: recuperaUnidadeMedidaApartirQtd(event.quantidade)
    }];
    this.conferirEstoque(this.listaObjeto);
  }

  onAddActivity() {
    this.router.navigate(['/app-form-filter-pt-lubrificacao']);
  }

  changePage(page: number) {
    this.currentPage = page;
  }

  getPaginatedData() {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.dataLayer.slice(startIndex, endIndex);
  }

  getTotalPages() {
    return Math.ceil(this.dataLayer.length / this.itemsPerPage);
  }

  onItemsPerPageChange() {
    this.currentPage = 1;
  }

  getDisplayCount() {
    return Math.min(this.itemsPerPage, this.dataLayer.length);
  }

  resetModalConfirmacao() {
    this.informar_manual = false;
    this.modal_confirma_codigo = false;
    this.scanModeConfirm = false;
    this.scanActive = false;
    this.codigo = '';
    this.pontosDeLubrificacao.clear();
    this.confirmados.clear();
    this.totalAtividades = 0;
    this.totalPontosUnicos = 0;
  }

  /**
   * (CORRIGIDO) Apenas atualiza o estado e chama o filtro central.
   */
  onSetorChange(newValue: any) {
    this.setorSelecionado = newValue;
    this.equipamentoSelecionado = null;
    this.equipamentoControl.setValue('');
    this.fetchEquipamentos();
    this.applyAllFilters();
  }

  /**
   * (CORRIGIDO) Apenas atualiza o estado e chama o filtro central.
   * Remove lógicas de filtro quebradas que estavam aqui.
   */
  onAtividadeChange(newValue: any) {
    this.atividadeSelecionada = newValue;
    this.applyAllFilters();
  }

  fetchEquipamentos() {
    this.setupEquipamentoFilter();

    const cliente_id = localStorage.getItem('cliente_id');
    if (cliente_id) {
      this.headers = this.headers.set('user-id', cliente_id);
    }
    const baseUrl = this.configService.getBaseUrl() + '/lubvel/equipamentos/setor/' + this.setorSelecionado
    this.http.get<any[]>(baseUrl, { headers: this.headers }).subscribe(
      (response: any) => {
        this.equipamentos = response.data;
        this.setupEquipamentoFilter();
      },
      (error) => {
        console.error('Erro ao buscar equipamentos:', error);
      }
    );
  }

  /**
   * (CORRIGIDO) Apenas atualiza o estado e chama o filtro central.
   */
  onEquipamentoChange(equipamento: any) {
    this.equipamentoSelecionado = equipamento;
    this.applyAllFilters();
  }

  displayEquipamentoFn(equipamento: any): string {
    return equipamento && equipamento.descricao ? equipamento.descricao : '';
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

  abrirModal(): void {
    this.iniciarFluxoExecucao();
  }

  confirmarComScanner() {
    this.modal_confirma_codigo = false;
    this.scanModeConfirm = true;
    this.scanActive = true;

    setTimeout(() => {
      const elemento = document.querySelector('#scanner');
      if (elemento) {
        console.log('Rolando para o scanner');
        elemento.scrollIntoView({ behavior: 'smooth' });
      }
    }, 5);
  }

  confirmarComInput(submitAction: boolean) {
    if (submitAction) {
      if (this.pontosDeLubrificacao.has(this.codigo) && !this.confirmados.has(this.codigo)) {
        this.confirmados.add(this.codigo);
        this.codigo = '';

        this.atualizarProgressoConfirmacao();

        if (this.confirmados.size === this.totalPontosUnicos) {
          this.modal_confirma_codigo = false;
          this.abrirModal();
        } else {
          this.snackBar.open(`Ponto de manutenção ${this.codigo} confirmado. Ainda faltam ${this.totalPontosUnicos - this.confirmados.size} pontos.`, 'Fechar', {
            duration: 2000,
          });
        }
      } else {
        this.snackBar.open('Código inválido ou já confirmado!', 'Fechar', {
          duration: 2000,
        });
      }
    } else {
      this.informar_manual = true;
    }
  }

  atualizarProgressoConfirmacao() {
    Swal.fire({
      title: 'Progresso de Confirmação',
      text: `Você confirmou ${this.confirmados.size} de ${this.totalPontosUnicos} pontos de manutenção.`,
      icon: 'info',
      confirmButtonText: 'OK'
    });
  }

  requestModoConfirmacao() {
    this.resetModalConfirmacao();
    this.calcularPontosEAtividades();

    if (!this.needConfirmScan) {
      this.iniciarFluxoExecucao();
      return;
    }

    if (this.totalPontosUnicos > 0) {
      this.modal_confirma_codigo = true;
      this.mensagemModalConfirmacao();
    } else {
      this.iniciarFluxoExecucao();
    }
  }

  calcularPontosEAtividades() {
    this.totalAtividades = this.listaObjeto.length;

    this.listaObjeto.forEach(atividade => {
      this.pontosDeLubrificacao.add(atividade.pontoDeLubrificacaoTag);
    });

    this.totalPontosUnicos = this.pontosDeLubrificacao.size;
  }

  mensagemModalConfirmacao() {
    Swal.fire({
      title: 'Confirmação de Atividades',
      text: `Você tem ${this.totalAtividades} atividades e precisa informar o código de ${this.totalPontosUnicos} pontos de manutenção.`,
      icon: 'info',
      confirmButtonText: 'OK'
    });
  }

  conferirEstoque(pontos_lub: Array<any>) {
    const produtos = pontos_lub.filter(item => ['LUBRIFICACAO', 'MANUTENCAO'].includes(item.atividade));

    if (produtos.length === 0) {
      this.requestModoConfirmacao();
      return;
    }

    const produtosConsolidados = this.tratarLista(produtos);

    const cliente_id = localStorage.getItem('cliente_id');
    if (cliente_id) {
      this.headers = this.headers.set('user-id', cliente_id);
    }
    const baseUrl = this.configService.getBaseUrl();
    this.http.post(baseUrl + '/lubvel/estoque/conferir-estoque', produtosConsolidados, { headers: this.headers }).subscribe(
      (response: any) => {
        const produtosEstoque = response.data as Array<{ codigo: string; qtdSuficiente: boolean; qtdNecessaria: number; qtdDisponivel: number; }>;
        let estoqueInsuficiente = false;
        const mensagensErro: string[] = [];

        produtosEstoque.forEach(produto => {
          if (!produto.qtdSuficiente) {
            const mensagemErro = this.montaMensagemEstoqueBaixo(produto);
            mensagensErro.push(mensagemErro);
            estoqueInsuficiente = true;
          }
        });

        if (estoqueInsuficiente) {
          this.exibirModalErro(mensagensErro);
        } else {
          this.requestModoConfirmacao();
        }
      },
      error => {
        this.snackBar.open(error.error.message, 'Fechar', {
          duration: 2000,
        });
      }
    );
  }

  iniciarFluxoExecucao() {
    this.indiceAtual = 0;
    this.modalQuantidadeLub = false;
    this.modalAberta = false;
    this.habilitarExecutar = false;
    this.tratarQuantidade();
  }

  montaMensagemEstoqueBaixo(produto: { codigo: string; qtdSuficiente: boolean; qtdNecessaria: number; qtdDisponivel: number; }) {
    let produtoCompleto = this.recuperarProduto(produto.codigo);
    let nomeProduto = produtoCompleto ? produtoCompleto.operacao.produto.nome : produto.codigo;
    let qtdNeedFormatted = formataQuantidade(produto.qtdNecessaria) + ' ' + recuperaUnidadeMedida(produtoCompleto.operacao.produto.tipoLubrificante, produto.qtdNecessaria);
    let qtdDispFormatted = produto.qtdDisponivel ?
      formataQuantidade(produto.qtdDisponivel) + ' ' + recuperaUnidadeMedida(produtoCompleto.operacao.produto.tipoLubrificante, produto.qtdDisponivel) : '0';

    return `${nomeProduto} - Necessário: ${qtdNeedFormatted} / Disponível: ${qtdDispFormatted}.`;
  }

  recuperarProduto(codigo: string) {
    const produto = this.allData.find(item => item.operacao.produto.publicId === codigo);
    return produto ? produto : null;
  }

  tratarLista(produtos: Array<{ codigo: string, quantidade: number }>): Array<{ codigo: string, quantidade: number }> {
    const produtosMap = new Map<string, number>();

    produtos.forEach(produto => {
      if (produtosMap.has(produto.codigo)) {
        produtosMap.set(produto.codigo, produtosMap.get(produto.codigo)! + produto.quantidade);
      } else {
        produtosMap.set(produto.codigo, produto.quantidade);
      }
    });

    return Array.from(produtosMap, ([codigo, quantidade]) => ({ codigo, quantidade }));
  }

  exibirModalErro(mensagensErro: string[]) {
    Swal.fire({
      title: 'Estoque Insuficiente',
      html: mensagensErro.join('<br>'),
      icon: 'error',
      confirmButtonText: 'OK'
    });
  }

  executarTarefa() {
    this.isLoading = true;
    const cliente_id = localStorage.getItem('cliente_id');
    if (cliente_id) {
      this.headers = this.headers.set('user-id', cliente_id);
    }
    const baseUrl = this.configService.getBaseUrl();

    const body = this.listaObjeto.map(event => ({
      operacaoPublicId: event.publicId,
      dataHoraExecucao: event.dataHoraParaExecucao,
      observacao: this.recuperaObservacao(event.publicId, event.dataHoraParaExecucao),
      quantidadeLubrificante: event.quantidadeUnformatted || 0
    }));

    this.http.post(baseUrl + '/lubvel/operacao-executada', body, { headers: this.headers }).subscribe(
      (response: any) => {

        const atividades = response.data || [];

        const atividadesErro = atividades.filter((item: { success: boolean }) => !item.success);
        const atividadesSucesso = atividades.filter((item: { success: boolean }) => item.success);

        const tituloModal = `${atividadesSucesso.length} atividades de ${atividades.length} atividades executadas com sucesso`;

        if (atividadesErro.length === 0) {
          Swal.fire({
            title: tituloModal,
            text: 'Todas as atividades foram executadas com sucesso!',
            icon: 'success',
            confirmButtonText: 'OK'
          }).then(() => {
            this.toInitialState();
            this.navegarAposConclusao();
          });
        } else {
          const mensagensErro = atividadesErro.map((erro: { operacaoPublicId: string, message: string }) => {
            const operacao = this.recuperarOperacao(erro.operacaoPublicId);
            return `Erro ${operacao.atividade} - pt-lub: ${operacao.pontoDeLubrificacaoTag} - ${operacao.dataHoraParaExecucao} - ${erro.message}`;
          }).join('<br>');

          Swal.fire({
            title: tituloModal,
            html: mensagensErro,
            icon: 'error',
            confirmButtonText: 'OK'
          }).then(() => {
            this.toInitialState();
            this.navegarAposConclusao();
          });
        }
        this.isLoading = false;
      },
      error => {
        this.snackBar.open(error.error.message, 'Fechar', {
          duration: 2000,
        });
        this.isLoading = false;
      }
    );
  }

  recuperaObservacao(publicId: any, dataHoraParaExecucao: any): any {
    const chave = this.getChaveUnica(publicId, dataHoraParaExecucao);
    return this.observacoes[chave] || '';
  }

  calculateExecutionStats() {
    if (!this.allData || this.allData.length === 0) {
      this.executionStats = { total: 0, executed: 0 };
      return;
    }

    const validActivities = this.allData.filter(item => !item.future && !item.paused);
    const executedActivities = validActivities.filter(item => item.executado);

    this.executionStats = {
      total: validActivities.length,
      executed: executedActivities.length
    };
  }

  recuperarOperacao(operacaoPublicId: string) {
    const operacaoEncontrada = this.allData.find((item: any) => item.operacao.publicId === operacaoPublicId);
    return {
      atividade: operacaoEncontrada?.operacao.atividade || '',
      pontoDeLubrificacaoTag: operacaoEncontrada?.operacao.pontoDeLubrificacaoTag || '',
      dataHoraParaExecucao: operacaoEncontrada?.dataHoraParaExecucao || ''
    };
  }

  navegarAposConclusao() {
    this.notificationService.loadNotifications();
    this.router.navigate(['/app-lista-atividades'], { queryParams: { startDate: this.startDate, endDate: this.endDate } });
    this.fetchAtividades();
  }

  toInitialState() {
    this.limparFiltro();
    this.modalAberta = false;
    this.observacao = '';
    this.scanActive = false;
    this.scanModeConfirm = false;
    this.codigo = '';
    this.modal_confirma_codigo = false;
    this.closeModalAndReset();
    this.isLoading = false;
  }

  onScanSuccess(data: string) {
    if (!this.scanModeConfirm) {
      this.executarAcaoForaDoModoConfirmacao(data);
      return;
    }

    const pontoScaneado = recuperarTag(data);
    const dominio = recuperarDomino(data);

    if (dominio === 'pt_lubrificacao' && this.pontosDeLubrificacao.has(pontoScaneado) && !this.confirmados.has(pontoScaneado)) {
      this.confirmados.add(pontoScaneado);

      this.atualizarProgressoConfirmacao();

      if (this.confirmados.size === this.totalPontosUnicos) {
        this.scanActive = false;
        this.abrirModal();
      } else {
        this.scanActive = true;
        this.snackBar.open(`Ponto de manutenção ${pontoScaneado} confirmado. Faltam ${this.totalPontosUnicos - this.confirmados.size} pontos.`, 'Fechar', {
          duration: 2000,
        });
      }
    } else {
      this.snackBar.open('Código inválido ou já confirmado!', 'Fechar', {
        duration: 2000,
      });
      this.scanActive = true;
    }
  }

  executarAcaoForaDoModoConfirmacao(data: string) {
    const dominio = recuperarDomino(data);
    const tag = recuperarTag(data);

    if (dominio === 'equipamento') {
      this.dataLayer = this.mapToDto(this.allData.filter((item: any) => item.equipamento.tag === tag));
      this.snackBar.open('Filtrando por equipamento TAG: ' + tag, 'Fechar', { duration: 2000 });
    } else if (dominio === 'pt_lubrificacao') {
      this.dataLayer = this.mapToDto(this.allData.filter((item: any) => item.operacao.pontoDeLubrificacaoTag === tag));
      this.snackBar.open('Filtrando por ponto manutenção TAG: ' + tag, 'Fechar', { duration: 2000 });
    } else {
      this.snackBar.open('QR Code inválido!', 'Fechar', { duration: 2000 });
    }

    this.scanActive = false;
  }

  /**
   * (CORRIGIDO) Agora limpa os estados dos filtros e chama
   * o filtro central para resetar a lista.
   */
  limparFiltro() {
    this.filtrosSelecionados = [];
    this.setorSelecionado = "";
    this.equipamentoSelecionado = null;
    this.equipamentoControl.setValue('');
    this.atividadeSelecionada = '';
    this.isExecutadasFilterActive = false;
    this.isMaquinaDesligadaFilterActive = false;
    this.atividadesSelecionadas = [];
    this.applyAllFilters();
  }

  downloadPdf(): void {
    this.pdfHeaders = [
      'N°',
      'Ponto Lub.',
      'Equipamento',
      'Atividade',
      'Data/Hora',
      'Produto',
      'Quantidade',
      'Executado',
      'Emergencial'
    ];

    const displayData = [...this.dataLayer].filter(item => !item.pausado);

    this.pdfData = displayData.map((item, index) => {
      let formattedDate = '';
      try {
        if (typeof item.dataHoraParaExecucao === 'string') {
          const parts = item.dataHoraParaExecucao.split(' ');
          if (parts.length === 2) {
            const dateParts = parts[0].split('-');
            if (dateParts.length === 3) {
              formattedDate = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]} ${parts[1]}`;
              formattedDate = new Date(formattedDate).toLocaleString();
            } else {
              formattedDate = item.dataHoraParaExecucao;
            }
          } else {
            formattedDate = item.dataHoraParaExecucao;
          }
        } else {
          formattedDate = item.dataHoraParaExecucao;
        }
      } catch (e) {
        formattedDate = item.dataHoraParaExecucao;
      }

      return {
        'N°': index + 1,
        'Ponto Lub.': item.pontoDeLubrificacaoTag,
        'Equipamento': item.equipamentoNome,
        'Atividade': item.atividade,
        'Data/Hora': formattedDate,
        'Produto': item.atividade == 'LUBRIFICACAO' ? item.produto || '' : '',
        'Quantidade': item.atividade == 'LUBRIFICACAO' ? item.quantidade || '' : '',
        'Executado': item.executado ? 'Sim' : 'Não',
        'Emergencial': item.frequencia == 'UNICA' ? 'Sim' : 'Não'
      };
    });

    let pdfTitle = 'Lista de Atividades';

    if (this.startDate && this.endDate) {
      const startFormatted = new Date(this.startDate).toLocaleDateString();
      const endFormatted = new Date(this.endDate).toLocaleDateString();
      pdfTitle += ` (${startFormatted} a ${endFormatted})`;
    }

    this.showPdfGenerator = true;

    setTimeout(() => {
      const pdfComponent = document.querySelector('app-pdf-generator');
      if (pdfComponent) {
        pdfComponent.setAttribute('ng-reflect-titulo', pdfTitle);
      }

      setTimeout(() => {
        this.showPdfGenerator = false;
      }, 100);
    });
  }

  constructor(
    private notificationService: NotificationService,
    private http: HttpClient,
    private router: Router,
    private configService: ConfigService,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar,
    public dialog: MatDialog,
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


    this.route.queryParams.subscribe(params => {
      this.startDate = params['startDate'];
      this.endDate = params['endDate'];
      this.isSemanal = true;
      // this.aplicarFiltros(); // Chamado dentro do fetch
      this.fetchSectors();

      if (this.startDate && this.endDate) {
        this.fetchAtividadesPeriodo();
      } else {
        this.fetchAtividades();
      }
    });
    this.criarFiltros();
    this.buscarPreferenciaScan();
  }

  buscarPreferenciaScan(): void {
    this.isLoading = true;
    const cliente_id = localStorage.getItem('cliente_id');
    if (cliente_id) {
      this.headers = this.headers.set('user-id', cliente_id);
    }

    const baseUrl = this.configService.getBaseUrl();
    const apiUrl = `${baseUrl}/lubvel/cliente/preferencias/get-confirm-scan-preference`;

    this.http.get(apiUrl, { headers: this.headers }).subscribe(
      (response: any) => {
        if (response.success && response.data !== undefined) {
          this.needConfirmScan = response.data === true;
          this.isLoading = false;
        }
      },
      (error) => {
        console.log('Erro ao carregar preferência de scan:', error);
        this.isLoading = false;
      }
    );
  }

  fetchSectors(): void {
    const baseUrl = this.configService.getBaseUrl();
    const apiUrl = baseUrl + '/lubvel/setor';

    const cliente_id = localStorage.getItem('cliente_id');
    if (cliente_id) {
      this.headers = this.headers.set('user-id', cliente_id);
    }

    this.http.get<any[]>(apiUrl, { headers: this.headers }).subscribe(
      (response: any) => {
        this.setores = response.data;
      },
      (error) => {
        console.error('Erro ao buscar setores:', error);
      }
    );
  }

  fetchAtividades() {
    this.isLoading = true;
    const cliente_id = localStorage.getItem('cliente_id');
    if (cliente_id) {
      this.headers = this.headers.set('user-id', cliente_id);
    }

    const baseUrl = this.configService.getBaseUrl();
    this.http.get(baseUrl + '/lubvel/operacoes/periodo/' + this.periodo, { headers: this.headers }).subscribe(
      (response: any) => {
        this.allData = response.data; // Armazena a fonte da verdade
        this.calculateExecutionStats();
        this.applyAllFilters(); // Aplica todos os filtros (incluindo toggles)
        this.isLoading = false;
      },
      error => {
        console.log(error);
        this.snackBar.open('Erro ao buscar atividades.', 'Fechar', {
          duration: 2000,
        });
        this.isLoading = false;
      }
    );
  }

  fetchAtividadesPeriodo() {
    this.isLoading = true;
    const cliente_id = localStorage.getItem('cliente_id');
    if (cliente_id) {
      this.headers = this.headers.set('user-id', cliente_id);
    }

    const baseUrl = this.configService.getBaseUrl();

    const params = new HttpParams()
      .set('startDate', this.startDate)
      .set('endDate', this.endDate);

    this.http.get(baseUrl + '/lubvel/operacoes/periodo-data', { headers: this.headers, params }).subscribe(
      (response: any) => {
        this.allData = response.data; // Armazena a fonte da verdade
        this.calculateExecutionStats();
        this.applyAllFilters(); // Aplica todos os filtros (incluindo toggles)
        this.isLoading = false;
      },
      error => {
        console.error(error);
        this.snackBar.open('Erro ao buscar atividades no período selecionado.', 'Fechar', {
          duration: 2000,
        });
        this.isLoading = false;
      }
    );
  }

  openDateRangeModal(): void {
    this.limparFiltro();

    const dialogRef = this.dialog.open(DateRangeModalComponent, {
      width: '400px',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.startDate = formatarData(result.startDate);
        this.endDate = formatarData(result.endDate);
        this.isRangeDate = true;
        this.fetchAtividadesPeriodo();
      }
    });
  }

  mapToDto(response: any): any[] {
    this.currentPage = 1;
    if (!response) return []; // Guarda contra dados nulos
    return response.map((item: any, index: number) => ({
      n: index + 1,
      pontoDeLubrificacaoTag: item.operacao.pontoDeLubrificacaoTag,
      equipamentoNome: item.operacao.equipamentoNome,
      publicId: item.operacao.publicId,
      frequencia: item.operacao.frequencia,
      atividade: item.operacao.atividade,
      dataHoraParaExecucao: item.dataHoraParaExecucao,
      modoAplicacao: item.operacao.modoAplicacao,
      tempoParaExecutar: item.tempoParaExecutar,
      executado: item.executado,
      setor_id: item.equipamento.setorPublicId,
      produto: item.operacao.produto.nome,
      produto_id: item.operacao.produto.publicId,
      quantidade: formataQuantidade(item.operacao.quantidade) + ' ' + recuperaUnidadeMedida(item.operacao.produto.tipoLubrificante, item.operacao.quantidade),
      quantidadeUnformatted: item.operacao.quantidade,
      future: item.future,
      equipamento_id: item.equipamento.publicId,
      pausado: item.paused,
      atividadeRequerMaquinaDesligada: item.operacao.atividadeRequerMaquinaDesligada,
      descComponentePtLub: item.descComponentePtLub,
    }))
  }

  /**
   * (DEPRECIADO) Lógica antiga substituída por applyAllFilters
   */
  filtrarData(coluna: string, valor: string) {
    const filtroExistenteIndex = this.filtrosSelecionados.findIndex(filtro => filtro.coluna === coluna);
    if (filtroExistenteIndex !== -1) {
      this.filtrosSelecionados.splice(filtroExistenteIndex, 1);
    }
    this.filtrosSelecionados.push({ coluna, valor });
    this.aplicarFiltros(); // 'aplicarFiltros' ainda está sendo usado, vamos mantê-lo, mas ele é parte do problema
  }

  /**
   * (DEPRECIADO) Lógica antiga substituída por applyAllFilters
   */
  aplicarFiltros() {
    // Esta é a implementação antiga. Vamos comentar e chamar a nova.
    // this.dataLayer = this.mapToDto(this.allData);
    // this.filtrosSelecionados.forEach(filtro => {
    //   this.dataLayer = this.dataLayer.filter((item: any) => item[filtro.coluna] === filtro.valor);
    // });
    this.applyAllFilters();
  }

  criarFiltros() {
    this.filtros = [];
    if (this.allData.length > 0) {
      const keys = Object.keys(this.allData[0]);
      keys.forEach(key => {
        this.filtros.push({ valores: Array.from(new Set(this.allData.map((data: any) => data[key]))), nome: key });
      });
    }
  }

  isAtividadeSelecionada(atividade: any): boolean {
    return this.atividadesSelecionadas.includes(atividade);
  }

  desmarcarSelecionadas() {
    this.atividadesSelecionadas = [];
  }

  getProgressPercentage(): number {
    if (this.executionStats.total === 0) return 0;
    return Math.round((this.executionStats.executed / this.executionStats.total) * 100);
  }

  getPageNumbers(): number[] {
    const totalPages = this.getTotalPages();
    const pages: number[] = [];

    for (let i = 1; i <= Math.min(5, totalPages); i++) {
      pages.push(i);
    }

    return pages;
  }
}

// --- FUNÇÕES HELPER (Sem alterações) ---

function recuperarTag(data: string) {
  let arr = data.split('/');
  return arr[1];
}

function recuperarDomino(data: string) {
  let arr = data.split('/');
  return arr[0];
}

function formatarData(data: Date): string {
  const year = data.getFullYear();
  const month = (data.getMonth() + 1).toString().padStart(2, '0');
  const day = data.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function recuperaUnidadeMedida(tpLub: any, qtd: any) {
  if (!tpLub || !qtd) {
    return "";
  }

  if (tpLub == 'PECA') {
    return 'un';
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

function recuperaUnidadeMedidaApartirQtd(qtd: string) {
  if (qtd.endsWith('L')) {
    return 'L';
  } else if (qtd.endsWith('ml')) {
    return 'ml';
  } else if (qtd.endsWith('Kg')) {
    return 'Kg';
  } else if (qtd.endsWith('g')) {
    return 'g';
  } else if (qtd.endsWith('un')) {
    return 'un';
  } else {
    return null;
  }
}

function formataQuantidade(qtd: any) {
  if (!qtd) {
    return "";
  }
  if (qtd / 1000 >= 1) {
    return qtd / 1000;
  } else {
    return qtd;
  }
}
