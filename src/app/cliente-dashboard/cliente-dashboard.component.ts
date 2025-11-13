import { Component, OnDestroy, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { ConfigService } from '../services/config.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { DateRangeModalComponent } from '../date-range-modal/date-range-modal.component';
import { UserService } from '../services/user.service';

@Component({
    selector: 'app-cliente-dashboard',
    templateUrl: './cliente-dashboard.component.html',
    styleUrls: ['./cliente-dashboard.component.css']
})
export class ClienteDashboardComponent implements OnInit, OnDestroy {

    navigateTo(route: string) {
      this.router.navigate([route]);
    }
    currentDate = getCurrentDate();
    currentTime!: string;
    private intervalId: any;
    empresaNome = '';
    cnpj = '';
    atividadesDia = null;
    atividadesSemana = null;
    produtosEstoque = null;
    dataInicioExibicao = formatarDdMmYyy(getFirstDayOfMonth());
    dataFimExibicao = formatarDdMmYyy(getCurrentDate());
    isLoading = false;
    userManager = false;

    // botões de controle
    controlButtons = [
        { title: 'Usuários', controlName: "Usuários", visible: this.userManager, link: '/app-lista-usuarios-cliente', itens: [{ nome: 'Adicionar', link: '/app-form-usuario-cliente' }] },
        { title: 'Meus Setores', controlName: "Setor", visible: true, link: '/app-setores-cliente', itens: [{ nome: 'Adicionar', link: '/app-form-setor' }] },
        {
            title: 'Meus Equipamentos', controlName: "Equipamento", visible: true, link: '/app-equipamentos-cliente',
            itens: [
                { nome: 'Adicionar', link: '/app-form-equipamento' }
            ]
        },
        { title: 'Pontos de Manutenção', controlName: "Ponto de Manutenção", visible: true, link: '/app-pt-manutencao', itens: [{ nome: 'Adicionar', link: '/app-form-pt-manutencao' }] },
        { title: 'Minhas Operações', controlName: "Operação", visible: true, link: '/app-operacoes', itens: [{ nome: 'Adicionar', link: '/app-form-filter-pt-lubrificacao' }] },
        { title: 'Meu estoque', controlName: "Estoque", visible: true, link: '/app-lista-estoque', itens: [{ nome: 'Adicionar', link: '/app-form-estoque' }, {nome: 'Baixo estoque', link: '/app-lista-estoque/baixo-estoque'}]  },
        { title: 'Meus Relatórios', controlName: "Relatórios", visible: true, link: '/app-relatorios' },
        { title: 'Relatos Técnicos', controlName: "Relatos Técnicos", visible: true, link: '/app-relatos-tecnicos', itens: [] },
        { title: 'Configurar sistemática de execução', controlName: "Configurações", visible: this.userManager, link: '/app-cliente-preferencias', itens: [] },
        { title: 'Logs do Sistema', controlName: "Logs do Sistema", visible: this.userManager, link: '/app-acoes-marcos', itens: [] }
    ];

    metrics: any[] = [];

    collapsedSections: { [key: string]: boolean } = {
        painel: false,
        metricas: false,
        controles: false
    };

    constructor(public dialog: MatDialog, private http: HttpClient, private router: Router, private configService: ConfigService, private snackBar: MatSnackBar, private userService: UserService) { }

    ngOnInit(): void {

        // Verifica se o usuário tem permissão de gerente isUserManager
        this.userService.currentIsUserManager.subscribe(isUserManager => {
          this.userManager = isUserManager === 'true';
          // Atualiza a propriedade visible do botão de Usuários
          const usuariosButton = this.controlButtons.find(b => b.title === 'Usuários');
          if (usuariosButton) {
            usuariosButton.visible = this.userManager;
          }
          // Atualiza a propriedade visible do botão de Configurações
          const configButton = this.controlButtons.find(b => b.title === 'Configurar sistemática de execução');
          if (configButton) {
            configButton.visible = this.userManager;
          }
          // Atualiza a propriedade visible do botão de Logs do Sistema
          const logsButton = this.controlButtons.find(b => b.title === 'Logs do Sistema');
          if (logsButton) {
            logsButton.visible = this.userManager;
          }
        });

        this.updateCurrentTime();
        this.intervalId = setInterval(() => this.updateCurrentTime(), 1000);

        let headers = new HttpHeaders().set('Authorization', 'Bearer ' + localStorage.getItem('token'));
        const cliente_id = localStorage.getItem('cliente_id');

        if (cliente_id) {
          headers = headers.set('user-id', cliente_id);
        }

        const baseUrl = this.configService.getBaseUrl();

        this.http.get(baseUrl+'/lubvel/operacoes/dashboard', { headers }).subscribe(
            (response: any) => {
                this.empresaNome = response.empresaNome;
                this.cnpj = response.empresaCnpj;
                this.atividadesDia = formataQuantidade(response.atividadesDia);
                this.atividadesSemana = formataQuantidade(response.atividadesSemana);
                this.produtosEstoque = formataQuantidade(response.produtosBaixoEstoque);
                // salvar o nome da empresa no localStorage
                localStorage.setItem('empresaNome', this.empresaNome);
            },
            error => {
                console.log(error);
            }
        );
        const currentDate = getCurrentDateYYYYMMDD();
        const firstDayOfMonth = getFirstDayOfMonth();
        this.buscarMetricas(firstDayOfMonth, currentDate);
    }

    ngOnDestroy() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }
    }

    goToAtividades(periodo: string) {
        //adiciona periodo como query param
        this.router.navigate(['/app-lista-atividades'], { queryParams: { periodo: periodo } });
    }

    changePeriodMetrics(){
      const dialogRef = this.dialog.open(DateRangeModalComponent, {
            width: '400px',
            disableClose: true
          });

          dialogRef.afterClosed().subscribe(result => {
            if (result) {
              let startDate = formatarData(result.startDate);
              let endDate = formatarData(result.endDate);
              this.dataInicioExibicao = formatarDdMmYyy(startDate);
              this.dataFimExibicao = formatarDdMmYyy(endDate);
              this.buscarMetricas(startDate, endDate);
            }
          });
    }

    toggleSection(section: string) {
        this.collapsedSections[section] = !this.collapsedSections[section];
    }

    isSectionCollapsed(section: string): boolean {
        return this.collapsedSections[section];
    }

    private updateCurrentTime() {
        const now = new Date();
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        this.currentTime = `${hours}:${minutes}`;
    }

    private buscarMetricas(dataInicio: string, dataFim: string) {
        this.isLoading = true;

        let headers = new HttpHeaders().set('Authorization', 'Bearer ' + localStorage.getItem('token'));
        const cliente_id = localStorage.getItem('cliente_id');

        if (cliente_id) {
          headers = headers.set('user-id', cliente_id);
        }

        const baseUrl = this.configService.getBaseUrl();

        this.http.get(`${baseUrl}/lubvel/metricas?dataInicio=${dataInicio}&dataFim=${dataFim}`, { headers }).subscribe(
            (response: any) => {
                this.metrics = response.data.map((metrica: any) => ({
                    title: formatValue(metrica.descricao),
                    value: metrica.quantidade,
                    definicao: metrica.definicao
                }));
                this.isLoading = false;
            },
            error => {
                console.log(error);
                this.isLoading = false;
            }
        );
    }

}
function getCurrentDate() {
    var today = new Date();
    var dd = String(today.getDate()).padStart(2, '0');
    var mm = String(today.getMonth() + 1).padStart(2, '0');
    var yyyy = today.getFullYear();

    return dd + '/' + mm + '/' + yyyy;
}

function getCurrentDateYYYYMMDD() {
    var today = new Date();
    var dd = String(today.getDate()).padStart(2, '0');
    var mm = String(today.getMonth() + 1).padStart(2, '0');
    var yyyy = today.getFullYear();

    return yyyy + '-' + mm + '-' + dd;
}

function formataQuantidade(atividades: any): any {
  return atividades > 9 ? atividades = '9+' : atividades;
}

function getFirstDayOfMonth() {
    var today = new Date();
    var dd = '01';
    var mm = String(today.getMonth() + 1).padStart(2, '0');
    var yyyy = today.getFullYear();

    return yyyy + '-' + mm + '-' + dd;
}

function formatValue(descricao: any) {
  // deixa cada palavra com a primeira letra maiúscula, incluindo caracteres acentuados
  descricao = descricao.toLowerCase();
  return descricao.replace(/(^|\s)\S/g, (l: string) => l.toUpperCase());
}

function formatarDdMmYyy(data: string) {
  return data.split('-').reverse().join('/');
}


function formatarData(data: Date): string {
  const year = data.getFullYear();
  const month = (data.getMonth() + 1).toString().padStart(2, '0');
  const day = data.getDate().toString().padStart(2, '0');

  // Formatar a data no padrão 'yyyy-MM-dd'
  return `${year}-${month}-${day}`;
}
