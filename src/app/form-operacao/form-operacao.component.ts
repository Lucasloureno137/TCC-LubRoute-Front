import { MatDialog } from '@angular/material/dialog';
import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { ConfigService } from '../services/config.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import moment from 'moment';
import { Location } from '@angular/common';
import { DateRangeModalComponent } from '../date-range-modal/date-range-modal.component';
import { ConfirmacaoAlteracaoRecorrenciaComponent } from '../confirmacao-alteracao-recorrencia/confirmacao-alteracao-recorrencia.component';

const FREQUENCIA_MAP: { [key: string]: string } = {
  'HORARIA': 'Horária',
  'DIARIA': 'Diária',
  'SEMANAL': 'Semanal',
  'MENSAL': 'Mensal',
  'ANUAL': 'Anual',
  'UNICA': 'Única'
};

const ATIVIDADE_MAP: { [key: string]: string } = {
  'LIMPEZA': 'Limpeza',
  'LUBRIFICACAO': 'Lubrificação',
  'MANUTENCAO': 'Manutenção'
};


@Component({
  selector: 'app-form-operacao',
  templateUrl: './form-operacao.component.html',
  styleUrls: ['./form-operacao.component.css']
})
export class FormOperacaoComponent implements OnInit {

  moment = moment;
  headers = new HttpHeaders().set('Authorization', 'Bearer ' + localStorage.getItem('token'));
  frequencias: string[] = ['Única (Sem recorrência)', 'Horária', 'Diária', 'Semanal', 'Mensal', 'Anual'];
  atividades: string[] = ['Limpeza', 'Lubrificação', 'Manutenção'];

  frequenciaSelected: string = '';
  atividadeSelected: string = '';
  quantidade!: number;
  dataInicio!: Date;
  horaInicio!: string;
  equipamento: any = {};
  detalhe_pt_lub: any = {};
  ponto_lubrificacao_id: string = '';
  modoAplicacao: string = '';
  isLubrificacaoOrManutencao: boolean = false;
  isUpdate: boolean = false;
  op_public_id: string = '';
  detalheOperacao: any = {};
  equipamento_id: string = '';
  qtdHoras: any;
  produtos: any;
  possuiEstoque: boolean = true;
  unidadesMedida: string[] = [];
  unidadeMedidaSelected: string = '';
  currentStep: number = 2;
  dataAtual: Date = new Date();
  isPaused = false;
  showBreadcumb = false;
  pauseStart!: string;
  pauseEnd!: string;
  isLoading = false;
  showUnicaInfo = false;
  atividadeRequerMaquinaDesligada: boolean = false;

  tecnicoSelecionadoId: string = '';
  tecnicos: any[] = [];

  // Valores originais para comparação
  frequenciaOriginal: string = '';
  qtdHorasOriginal: any;

  constructor(
    private dialog: MatDialog,
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar,
    private configService: ConfigService,
    private http: HttpClient,
    private location: Location
  ) { }

  ngOnInit(): void {

    if (window.location.href.includes('show-breadcumb')) {
      this.showBreadcumb = true;
    }

    scrollToTop();

    this.route.paramMap.subscribe(params => {
      this.equipamento_id = params.get('eqp_public_id') ?? '';
      this.ponto_lubrificacao_id = params.get('pt_public_id') ?? '';
      if (params.get('op_public_id')) {
        this.isUpdate = true;
        this.op_public_id = params.get('op_public_id') ?? '';
      }

    });

    this.loadTecnicos();

    if (!this.isUpdate) {
      this.getEquipamento(this.equipamento_id);
      this.getDetalhePtLub(this.ponto_lubrificacao_id);
    } else {
      this.getDetalheOperacao(this.op_public_id);
      this.verifyIsPaused(this.op_public_id);
    }
    this.recuperarProdutosEstoque();

  }

  verifyIsPaused(op_public_id: string) {
    this.isLoading = true;
    const baseUrl = this.configService.getBaseUrl();
    const data = formatarData(this.dataAtual);
    const apiUrl = baseUrl + '/lubvel/operacoes-pausa/' + op_public_id + '?data=' + data;
    const cliente_id = localStorage.getItem('cliente_id');
    if (cliente_id) {
      this.headers = this.headers.set('user-id', cliente_id);
    }
    this.http.get<any[]>(apiUrl, { headers: this.headers }).subscribe(
      (response: any) => {
        this.isLoading = false;
        this.isPaused = response.data;
      },
      (error) => {
        this.isLoading = false;
        this.snackBar.open('Erro ao verificar se a operação está pausada', 'Fechar', {
          duration: 2000
        });
      }
    );
  }

  changePauseStatus() {

    // Abre o seletor de data inicial e final
    if (this.isPaused === false) {
      this.requestPause();
    } else {
      this.requestEndPause();
    }
  }

  requestEndPause() {
    this.isLoading = true;
    const baseUrl = this.configService.getBaseUrl();
    const apiUrl = baseUrl + '/lubvel/operacoes-pausa/' + this.op_public_id;
    const cliente_id = localStorage.getItem('cliente_id');
    if (cliente_id) {
      this.headers = this.headers.set('user-id', cliente_id);
    }
    this.http.delete<any[]>(apiUrl, { headers: this.headers }).subscribe(
      (response: any) => {
        this.isLoading = false;
        this.isPaused = !this.isPaused;
        this.snackBar.open('Operação atualizada com sucesso.', 'Fechar', {
          duration: 2000
        });
      },
      (error) => {
        this.isLoading = false;
        this.snackBar.open('Erro ao atualizar a operação', 'Fechar', {
          duration: 2000
        });
      }
    );
  }

  requestPauseService() {
    this.isLoading = true;
    const baseUrl = this.configService.getBaseUrl();
    const apiUrl = baseUrl + '/lubvel/operacoes-pausa';
    const cliente_id = localStorage.getItem('cliente_id');
    if (cliente_id) {
      this.headers = this.headers.set('user-id', cliente_id);
    }

    const body = {
      operacaoPublicId: this.op_public_id,
      dataInicio: this.pauseStart,
      dataFim: this.pauseEnd
    }

    this.http.post<any[]>(apiUrl, body, { headers: this.headers }).subscribe(
      (response: any) => {
        this.isLoading = false;
        this.isPaused = !this.isPaused;
        this.snackBar.open('Operação atualizada com sucesso.', 'Fechar', {
          duration: 2000
        });
      },
      (error) => {
        this.isLoading = false;
        let msgError = error.error.message ? error.error.message : 'Erro ao atualizar a operação';
        this.snackBar.open(msgError, 'Fechar', {
          duration: 2000
        });
      }
    );
  }

  requestPause() {

    const dialogRef = this.dialog.open(DateRangeModalComponent, {
      width: '400px',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.pauseStart = formatarData(result.startDate);
        this.pauseEnd = formatarData(result.endDate);
        this.requestPauseService();
      }
    });

  }

  backPage() {
    this.router.navigate(['/app-operacoes']);
  }

  redirectEstoque() {
    this.router.navigate(['/app-form-estoque']);
  }
  recuperarProdutosEstoque() {
    this.isLoading = true;
    const baseUrl = this.configService.getBaseUrl();
    const apiUrl = baseUrl + '/lubvel/produtos';
    const cliente_id = localStorage.getItem('cliente_id');
    if (cliente_id) {
      this.headers = this.headers.set('user-id', cliente_id);
    }
    this.http.get<any[]>(apiUrl, { headers: this.headers }).subscribe(
      (response: any) => {
        this.isLoading = false;
        this.produtos = response.data;
      },
      (error) => {
        this.isLoading = false;
        this.snackBar.open('Erro ao recuperar produtos', 'Fechar', {
          duration: 2000
        });
      }
    );
  }

  popularCamposEdicao() {

    this.getEquipamento(this.detalheOperacao.equipamentoId);
    this.getDetalhePtLub(this.detalheOperacao.pontoDeLubrificacaoId);
    this.frequenciaSelected = deparaFrequencia(this.detalheOperacao.frequencia);
    this.atividadeSelected = deparaAtividade(this.detalheOperacao.atividade);
    this.tecnicoSelecionadoId = this.detalheOperacao.usuarioClienteId;

    // Armazenar valores originais
    this.frequenciaOriginal = this.frequenciaSelected;
    this.qtdHorasOriginal = this.detalheOperacao.qtdHoras;

    if (['LUBRIFICACAO', 'MANUTENCAO'].includes(this.detalheOperacao.atividade)) {
      this.isLubrificacaoOrManutencao = true;
      this.unidadeMedidaSelected = this.detalheOperacao.unidadeMedida;
      this.defineUnidadesMedida();
      this.quantidade = this.formatarQuantidadeShow();
    }
    if (this.detalheOperacao.frequencia === 'HORARIA') {
      this.qtdHoras = this.detalheOperacao.qtdHoras;
    }
    this.dataInicio = new Date(this.detalheOperacao.dataHoraInicio);
    this.horaInicio = moment(this.detalheOperacao.dataHoraInicio).format('hh:mm A');
    this.modoAplicacao = this.detalheOperacao.modoAplicacao;
    this.atividadeRequerMaquinaDesligada = this.detalheOperacao.atividadeRequerMaquinaDesligada ?? false;
  }

  formatarQuantidadeShow(): number {
    if (this.detalheOperacao.unidadeMedida === 'g' || this.detalheOperacao.unidadeMedida === 'ml') {
      return this.detalheOperacao.quantidade;
    } else {
      return this.detalheOperacao.quantidade / 1000;
    }
  }

  formatarQuantidadeSave(): number {
    if (['g', 'ml', 'un'].includes(this.unidadeMedidaSelected)) {
      return this.quantidade;
    } else {
      return this.quantidade * 1000;
    }
  }

  defineUnidadesMedida() {
    const unidadesDeMedidaMapper: Record<string, string[]> = {
      'GRAXA': ['g', 'Kg'],
      'LIQUIDO': ['ml', 'L'],
      'PECA': ['un'],
    }

    this.unidadesMedida = unidadesDeMedidaMapper[this.detalhe_pt_lub.tipoLubrificante];
  }

  verificarAlteracaoRecorrencia(): { frequenciaAlterada: boolean, qtdHorasAlterada: boolean } {
    const frequenciaAlterada = this.frequenciaSelected !== this.frequenciaOriginal;
    const qtdHorasAlterada = this.frequenciaSelected === 'Horária' && this.qtdHoras !== this.qtdHorasOriginal;

    return {
      frequenciaAlterada,
      qtdHorasAlterada
    };
  }

  abrirModalConfirmacaoRecorrencia(): Promise<boolean> {
    const alteracoes = this.verificarAlteracaoRecorrencia();

    const dialogRef = this.dialog.open(ConfirmacaoAlteracaoRecorrenciaComponent, {
      width: '500px',
      disableClose: false,
      data: alteracoes
    });

    return dialogRef.afterClosed().toPromise();
  }

  verificarPossuiEstoque() {
    if (!this.produtos || this.produtos.length === 0) {
      this.possuiEstoque = false;
      return;
    }
    this.produtos = this.produtos.filter((obj: any) => obj.produtoBase.publicId === this.detalhe_pt_lub.produtoPublicId);

    this.produtos.length > 0 ? this.possuiEstoque = true : this.possuiEstoque = false;
  }
  getDetalheOperacao(arg0: string | null): any {
    this.isLoading = true;
    const baseUrl = this.configService.getBaseUrl();
    const apiUrl = baseUrl + '/lubvel/operacoes/' + arg0;
    const cliente_id = localStorage.getItem('cliente_id');
    if (cliente_id) {
      this.headers = this.headers.set('user-id', cliente_id);
    }
    this.http.get<any[]>(apiUrl, { headers: this.headers }).subscribe(
      (response: any) => {
        this.isLoading = false;
        this.detalheOperacao = response.data;
        this.popularCamposEdicao();
      },
      (error) => {
        this.isLoading = false;
        this.snackBar.open('Erro ao recuperar detalhes operacao', 'Fechar', {
          duration: 2000
        });
      }
    );
  }

  getDetalhePtLub(public_id: string | null) {
    this.isLoading = true;
    const baseUrl = this.configService.getBaseUrl();
    const apiUrl = baseUrl + '/lubvel/pontos-de-lubrificacao/detalhe/' + public_id;
    const cliente_id = localStorage.getItem('cliente_id');
    if (cliente_id) {
      this.headers = this.headers.set('user-id', cliente_id);
    }
    this.http.get<any[]>(apiUrl, { headers: this.headers }).subscribe(
      (response: any) => {
        this.isLoading = false;
        this.detalhe_pt_lub = response.data;
      },
      (error) => {
        this.isLoading = false;
        this.snackBar.open('Erro ao recuperar detalhes ponto-lubrificacao', 'Fechar', {
          duration: 2000
        });
      }
    );
  }

  getEquipamento(public_id: string | null): any {
    this.isLoading = true;
    const baseUrl = this.configService.getBaseUrl();
    const apiUrl = baseUrl + '/lubvel/equipamentos/' + public_id;
    const cliente_id = localStorage.getItem('cliente_id');
    if (cliente_id) {
      this.headers = this.headers.set('user-id', cliente_id);
    }
    this.http.get<any[]>(apiUrl, { headers: this.headers }).subscribe(
      (response: any) => {
        this.isLoading = false;
        this.equipamento = response.data;
      },
      (error) => {
        this.isLoading = false;
        this.snackBar.open('Erro ao recuperar equipamento', 'Fechar', {
          duration: 2000
        });
      }
    );
  }

  selectChange(value: string, controle: string): void {
    if (controle === 'F') {
      this.frequenciaSelected = value;
      this.showUnicaInfo = value === 'Única (Sem recorrência)';
    } else if (controle === 'A') {
      this.atividadeSelected = value;
      if (['Lubrificação', 'Manutenção'].includes(value)) {
        this.defineUnidadesMedida();
        this.isLubrificacaoOrManutencao = true;
        this.verificarPossuiEstoque();
        if (!this.possuiEstoque) {
          this.snackBar.open('Cadastre o produto ' + this.detalhe_pt_lub.lubrificante + ' no estoque', 'Fechar', {
            duration: 10000
          });
        }
      } else {
        this.isLubrificacaoOrManutencao = false;
      }
    } else if (controle === 'T') {
      this.tecnicoSelecionadoId = value;
    }
  }

  hideUnicaInfo(): void {
    this.showUnicaInfo = false;
  }

  enviarFormulario(): void {
    // Validação do formulário (simples)
    if (!this.tecnicoSelecionadoId || !this.frequenciaSelected || !this.atividadeSelected || (this.isLubrificacaoOrManutencao && !this.quantidade) || (this.isLubrificacaoOrManutencao && !this.unidadeMedidaSelected) || !this.dataInicio || !this.horaInicio || (this.frequenciaSelected === 'Horária' && !this.qtdHoras)) {
      this.snackBar.open('Preencha todos os campos obrigatórios', 'Fechar', {
        duration: 5000
      });
      return;
    }

    // Verificar se é uma atualização e se houve alterações de recorrência
    if (this.isUpdate) {
      const alteracoes = this.verificarAlteracaoRecorrencia();
      if (alteracoes.frequenciaAlterada || alteracoes.qtdHorasAlterada) {
        this.abrirModalConfirmacaoRecorrencia().then(confirmado => {
          if (confirmado) {
            this.processarEnvioFormulario();
          }
        });
        return;
      }
    }

    this.processarEnvioFormulario();
  }

  onToggleMaquinaDesligada() {
    this.atividadeRequerMaquinaDesligada = !this.atividadeRequerMaquinaDesligada;
  }

  private processarEnvioFormulario(): void {
    this.verificarPossuiEstoque();
    if (this.isLubrificacaoOrManutencao) {
      if (!this.possuiEstoque) {
        this.snackBar.open('Cadastre o produto ' + this.detalhe_pt_lub.lubrificante + ' no estoque', 'Fechar', {
          duration: 10000
        });
        return;
      } else {
        if (this.produtos[0].qtEstoque < this.quantidade) {
          this.snackBar.open('Quantidade de produto em estoque insuficiente, atualize o estoque', 'Fechar', {
            duration: 10000
          });
          return;
        }
      }
    }

    // Criação do objeto de operação
    const operacao = {
      usuarioClienteId: this.tecnicoSelecionadoId,
      pontoDeLubrificacaoId: this.ponto_lubrificacao_id,
      dataHoraInicio: formatarData24H(this.dataInicio, this.horaInicio),
      modoAplicacao: this.modoAplicacao,
      frequencia: formatarFrequencia(this.frequenciaSelected),
      atividade: substituirAcentos(this.atividadeSelected),
      quantidade: this.formatarQuantidadeSave(),
      qtdHoras: this.qtdHoras,
      unidadeMedida: this.unidadeMedidaSelected,
      atividadeRequerMaquinaDesligada: this.atividadeRequerMaquinaDesligada,
    };

    // URL base e URL da API
    const baseUrl = this.configService.getBaseUrl();
    const apiUrl = `${baseUrl}/lubvel/operacoes${this.isUpdate ? '/' + this.op_public_id : ''}`;
    const cliente_id = localStorage.getItem('cliente_id');
    if (cliente_id) {
      this.headers = this.headers.set('user-id', cliente_id);
    }

    // Envio da requisição POST ou PUT
    this.isLoading = true;
    if (this.isUpdate) {
      this.http.put(apiUrl, operacao, { headers: this.headers }).subscribe(
        (response) => {
          this.isLoading = false;
          this.snackBar.open('Operação atualizada com sucesso.', 'Fechar', {
            duration: 3000,
          });
          this.location.back();
        },
        (error) => {
          this.isLoading = false;
          console.error('Erro ao atualizar a operação:', error);
        }
      );
    } else {
      this.http.post(apiUrl, operacao, { headers: this.headers }).subscribe(
        (response) => {
          this.isLoading = false;
          this.snackBar.open('Operação criada com sucesso.', 'Fechar', {
            duration: 3000,
          });
          this.resetForm();
          this.router.navigate(['/app-confirmacao-operacao']);
        },
        (error) => {
          this.isLoading = false;
          console.error('Erro ao criar a operação:', error);
        }
      );
    }
  }

  loadTecnicos(): void {
    let headers = new HttpHeaders().set('Authorization', 'Bearer ' + localStorage.getItem('token'));
    const cliente_id = localStorage.getItem('cliente_id');
    if (cliente_id) {
      headers = headers.set('user-id', cliente_id);
    }
    const baseUrl = this.configService.getBaseUrl();

    this.http.get(baseUrl + '/lubvel/usuario-cliente', { headers }).subscribe(
      (response: any) => {
        this.tecnicos = response.data.map((item: any, index: number) => ({
          id: index + 1,
          nome: item.nome,
          email: item.email,
          cpf: item.cpf,
          telefone: item.telefone || '(00) 0000-0000',
          publicId: item.publicId,
          usuarioAtual: item.usuarioAtual
        }));
      },
      error => {
        console.log(error);
        this.snackBar.open('Erro ao carregar usuários', 'Fechar', {
          duration: 3000,
        });
      }
    );
  }



  resetForm(): void {
    this.frequenciaSelected = '';
    this.atividadeSelected = '';
    this.quantidade = null!;
    this.dataInicio = null!;
    this.horaInicio = '';
    this.modoAplicacao = '';
    this.isLubrificacaoOrManutencao = false;
    this.tecnicoSelecionadoId = '';
  }

}

function substituirAcentos(str: string): string {
  return (str.normalize('NFD').replace(/[\u0300-\u036f]/g, '')).toUpperCase();
}

function formatarFrequencia(frequencia: string): string {
  // Caso especial para "Única (Sem recorrência)" que deve ser convertido para "UNICA"
  if (frequencia === 'Única (Sem recorrência)') {
    return 'UNICA';
  }
  return substituirAcentos(frequencia);
}

function formatarData24H(dataInicio: Date, horaInicio: string) {
  const data = moment(dataInicio).format('YYYY-MM-DD');
  const hora = moment(horaInicio, 'hh:mm A').format('HH:mm:ss');
  return `${data}T${hora}Z`;
}

function deparaFrequencia(stringBack: string): string {
  return FREQUENCIA_MAP[stringBack.toUpperCase()] || stringBack;
}

function deparaAtividade(stringBack: string): string {
  return ATIVIDADE_MAP[stringBack.toUpperCase()] || stringBack;
}

function scrollToTop() {
  window.scrollTo(0, 0);
}

function formatarData(data: Date): string {
  const year = data.getFullYear();
  const month = (data.getMonth() + 1).toString().padStart(2, '0');
  const day = data.getDate().toString().padStart(2, '0');

  // Formatar a data no padrão 'yyyy-MM-dd'
  return `${year}-${month}-${day}`;
}

function formatarDdMmYyy(data: string) {
  return data.split('-').reverse().join('/');
}
