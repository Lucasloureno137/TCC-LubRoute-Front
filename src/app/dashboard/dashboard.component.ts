import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Component, Input, OnInit } from '@angular/core';
import { ConfigService } from '../services/config.service';

interface MetricCard {
  id: 'manutencao' | 'lubrificacao' | 'atrasos';
  title: string;
  value: number;
  icon: string;
  color: string;
  bgColor: string;
}

interface PendingActivity {
  title: string;
  codigo: string;
  produto: string;
  vencimento: string;
  status: string;
  atividade: string;
}

interface LubricationData {
  type: string;
  value: number;
  color: string;
}

interface DashboardData {
  manutencoesExecutadas: number;
  lubrificacoesExecutadas: number;
  atrasosHoje: number;
}

interface ActivitiesData {
  equipamento: Equipamento
  operacao: Operacao
  dataHoraParaExecucao: string
  executado: boolean
  tempoParaExecutar: string
  descComponentePtLub: string
  paused: boolean
  future: boolean
}

interface Equipamento {
  publicId: string
  descricao: string
  setor: string
  setorPublicId: string
  tag: string
}

interface Operacao {
  equipamentoId: string
  equipamentoNome: string
  publicId: string
  pontoDeLubrificacaoId: string
  pontoDeLubrificacaoTag: string
  pontoDeLubrificacaoDescricaoComponente: string
  frequencia: string
  atividade: string
  dataHoraInicio: string
  quantidade: number
  modoAplicacao: string
  qtdHoras: number
  produto: Produto
  setorPublicId: string
  unidadeMedida: string
  atividadeRequerMaquinaDesligada: any
  isSuspenso: any
}

interface Produto {
  publicId: string
  nome: string
  tipoLubrificante: string
  qtMls: any
  qtGramas: any
}

interface OperacoesPorTipo {
  lubrificacao: number
  manutencao: number
  limpeza: number
}

interface ProductStock {
  id: number
  publicId: string
  produtoNome: string
  referencia: string
  tipo: string
  quantidadeDisponivel: string
  estoqueMinimo: string
  tpLub: string
  qtd: number
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  @Input() progressPercentage: number = 75;
  radius = 80;
  circumference = 2 * Math.PI * this.radius;
  dashOffset = 0;
  metricCards: MetricCard[] = [];
  isLoading: boolean = false;
  dashboardData: DashboardData | null = null;
  operacoesPorTipoResponse: OperacoesPorTipo | null = null;
  pendingActivitiesResponse: ActivitiesData[] = [];
  productStock: ProductStock[] = [];
  pendingActivities: PendingActivity[] = [];
  operacoesData: LubricationData[] = [];

  constructor(private http: HttpClient, private configService: ConfigService) { }

  ngOnInit(): void {
    this.fetchAtividadesLubrificacao();
    this.fetchOperacoesUltimos30Dias();
    this.loadBaixoEstoque();
  }

  private fetchOperacoesUltimos30Dias() {
    let headers = new HttpHeaders().set('Authorization', 'Bearer ' + localStorage.getItem('token'));
    const cliente_id = localStorage.getItem('cliente_id');

    if (cliente_id) {
      headers = headers.set('user-id', cliente_id);
    }

    const baseUrl = this.configService.getBaseUrl();

    const now = new Date();

    // Data final = hoje
    const endDate = now.toISOString().split('T')[0];

    // Data inicial = hoje - 30 dias
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - 30);

    const params = new HttpParams()
      .set('dataInicio', startDate.toISOString().split('T')[0])
      .set('dataFim', endDate);

    this.http.get(`${baseUrl}/lubvel/dashboard/operacoes-por-tipo`, { headers, params }).subscribe(
      (response: any) => {
        this.operacoesPorTipoResponse = response.data
        this.updateOperacoesPorTipo();
      },
      error => {
        console.log(error);
      }
    );
  }

  private updateOperacoesPorTipo() {
    this.operacoesData = [
      { type: 'Lubrificação', value: this.operacoesPorTipoResponse?.lubrificacao || 0, color: '#2196f3' },
      { type: 'Manutenção', value: this.operacoesPorTipoResponse?.manutencao || 0, color: '#4caf50' },
      { type: 'Limpeza', value: this.operacoesPorTipoResponse?.limpeza || 0, color: '#ff9800' }
    ];
  }

  private updateMetricCards() {
    const totalCompleted = this.pendingActivitiesResponse.filter((element) => element.executado === true).length;
    const totalLubrificacaoCompleted = this.pendingActivitiesResponse.filter((element) => element.operacao.atividade === 'LUBRIFICACAO' && element.executado === true).length;
    const atrasados = this.pendingActivitiesResponse.filter((e) => e.executado === false && e.tempoParaExecutar.includes('Atrasado')).length;

    this.metricCards = [
      {
        id: 'manutencao',
        title: 'Manutenções Executadas',
        value: totalCompleted || 0,
        icon: 'build',
        color: '#2196f3',
        bgColor: '#e3f2fd'
      },
      {
        id: 'lubrificacao',
        title: 'Lubrificações Executadas',
        value: totalLubrificacaoCompleted || 0,
        icon: 'opacity',
        color: '#4caf50',
        bgColor: '#e8f5e8'
      },
      {
        id: 'atrasos',
        title: 'Atrasos hoje',
        value: atrasados || 0,
        icon: 'schedule',
        color: '#ff9800',
        bgColor: '#fff3e0'
      }
    ];
  }

  private fetchAtividadesLubrificacao() {
    let headers = new HttpHeaders().set('Authorization', 'Bearer ' + localStorage.getItem('token'));
    const cliente_id = localStorage.getItem('cliente_id');

    if (cliente_id) {
      headers = headers.set('user-id', cliente_id);
    }

    const baseUrl = this.configService.getBaseUrl();

    const params = new HttpParams()
      .set('startDate', new Date().toISOString().split('T')[0])
      .set('endDate', new Date().toISOString().split('T')[0]);
    this.http.get(`${baseUrl}/lubvel/operacoes/periodo-data`, { headers, params }).subscribe(
      (response: any) => {
        this.pendingActivitiesResponse = response.data;
        this.updatePendingActivities();
      },
      error => {
        console.log(error);
      }
    );
  }

  private updatePendingActivities() {
    const lubrificacao = this.pendingActivitiesResponse.filter((e) => e.operacao.atividade === 'LUBRIFICACAO' && e.executado === false);

    this.pendingActivities = lubrificacao.slice(0, 5).map((element) => ({
      title: element.equipamento.descricao,
      codigo: element.equipamento.tag,
      produto: element.operacao.produto.nome,
      status: element.paused ? 'Pausado' : element.tempoParaExecutar.toLowerCase().includes('atrasado') ? 'Atrasado' : 'Pendente',
      vencimento: element.dataHoraParaExecucao,
      atividade: element.operacao.atividade
    }));

    this.updateProgress();
    this.updateMetricCards();
  }

  private updateProgress() {
    const totalActivities = this.pendingActivitiesResponse.length;
    const totalCompleted = this.pendingActivitiesResponse.filter((element) => element.executado === true).length;
    this.progressPercentage = totalActivities === 0 ? 0 : (totalCompleted * 100) / totalActivities;
    const progress = this.progressPercentage / 100;
    this.dashOffset = this.circumference - (progress * this.circumference);
  }

  private loadBaixoEstoque(): void {
    let headers = new HttpHeaders().set('Authorization', 'Bearer ' + localStorage.getItem('token'));
    const cliente_id = localStorage.getItem('cliente_id');
    if (cliente_id) {
      headers = headers.set('user-id', cliente_id);
    }
    const baseUrl = this.configService.getBaseUrl();
    const url = baseUrl + '/lubvel/estoque/baixo-estoque';

    this.http.get(url, { headers }).subscribe(
      (response: any) => {
        this.productStock = response.data.slice(0, 3).map((item: any, index: number) => ({
          id: index + 1,
          publicId: item.publicId,
          produtoNome: item.produtoNome,
          referencia: item.referencia || 'N/A',
          tipo: this.getTipoFromTpLub(item.tpLub),
          quantidadeDisponivel: this.formatarQuantidade(item.qtd) + ' ' + this.recuperaUnidadeMedida(item.tpLub, item.qtd),
          estoqueMinimo: this.formatarQuantidade(item.estoqueMinimo || 0) + ' ' + this.recuperaUnidadeMedida(item.tpLub, item.estoqueMinimo || 0),
          tpLub: item.tpLub,
          qtd: item.qtd
        }));
      },
      error => {
        console.log(error);
      }
    );
  }

  private getTipoFromTpLub(tpLub: string): string {
    switch (tpLub) {
      case 'LIQUIDO':
        return 'LIQUIDO';
      case 'PASTOSO':
        return 'GRAXA';
      case 'SOLIDO':
        return 'SÓLIDO';
      default:
        return tpLub;
    }
  }

  private recuperaUnidadeMedida(tpLub: string, qtd: number): string {
    switch (tpLub) {
      case 'LIQUIDO':
        return qtd / 1000 >= 1 ? 'L' : 'ml';
      case 'GRAXA':
        return qtd / 1000 >= 1 ? 'Kg' : 'g';
      case 'PECA':
        return 'UN';
      default:
        return 'UN';
    }
  }

  private formatarQuantidade(qtd: number): number {
    return qtd / 1000 >= 1 ? qtd / 1000 : qtd;
  }


  getStatusClass(status: string): string {
    switch (status.toLowerCase()) {
      case 'atrasado':
        return 'status-atrasado';
      case 'pendente':
        return 'status-pendente';
      case 'agendado':
        return 'status-agendado';
      default:
        return '';
    }
  }
}
