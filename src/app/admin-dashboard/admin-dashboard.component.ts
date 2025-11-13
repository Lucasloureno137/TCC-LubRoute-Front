import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ConfigService } from '../services/config.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.css'
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
  navigateTo(route: string) {
    this.router.navigate([route]);
  }
  currentDate = getCurrentDate();
  currentTime!: string;
  private intervalId: any;
  userName = '';
  produtosEstoque = null;
  clientesCadastros = null;

  // botões de controle
  controlButtons = [
    {
        title: 'Gerenciar Clientes',
        controlName: "Clientes",
        visible: true,
        link: 'admin/app-lista-clientes',
        itens: [{ nome: 'Adicionar', link: '/admin/app-form-cliente' }]
    },
    {
        title: 'Cadastro de Usuário Admin',
        controlName: "Usuários",
        visible: true,
        link: 'admin/app-lista-usuarios',
        itens: [{ nome: 'Adicionar', link: 'admin/app-form-usuarios' }]
    },
    {
        title: 'Setores',
        controlName: "Setor",
        visible: true,
        link: '/admin/app-selecionar-empresa/app-setores-cliente',
        itens: [{ nome: 'Adicionar', link: '/admin/app-selecionar-empresa/app-form-setor' }]
    },
    {
        title: 'Equipamentos',
        controlName: "Equipamento",
        visible: true,
        link: '/admin/app-selecionar-empresa/app-equipamentos-cliente',
        itens: [{ nome: 'Adicionar', link: '/admin/app-selecionar-empresa/app-form-equipamento' }]
    },
    {
        title: 'Pontos de Manutenção',
        controlName: "Ponto de Manutenção",
        visible: true,
        link: '/admin/app-selecionar-empresa/app-pt-manutencao',
        itens: [{ nome: 'Adicionar', link: '/admin/app-selecionar-empresa/app-form-pt-manutencao' }]
    },
    {
        title: 'Operações',
        controlName: "Operacao",
        visible: true,
        link: '/admin/app-selecionar-empresa/app-operacoes',
        itens: [{ nome: 'Adicionar', link: '/admin/app-selecionar-empresa/app-form-filter-pt-lubrificacao' }]
    },
    {
        title: 'Estoques',
        controlName: "Estoque",
        visible: true,
        link: '/admin/app-selecionar-empresa/app-lista-estoque',
        itens: [
            { nome: 'Adicionar', link: '/admin/app-selecionar-empresa/app-form-estoque' },
            { nome: 'Baixo estoque', link: '/admin/app-selecionar-empresa/baixo-estoque-consulta' }
        ]
    },
    {
        title: 'Meus Relatórios',
        controlName: "Relatórios",
        visible: true,
        link: '/admin/app-selecionar-empresa/app-relatorios'
    },
    {
      title: 'Cadastro de produtos',
      controlName: "Produtos",
      visible: true,
      link: '/admin/app-produtos'
    },
    {
        title: 'Logs do Sistema',
        controlName: 'Logs do Sistema',
        visible: true,
        link: '/admin/app-selecionar-empresa/app-acoes-marcos',
        itens: []
    },
    {
        title: 'Configurar sistemática de execução',
        controlName: 'Preferências',
        visible: true,
        link: '/admin/app-preferencias-clientes',
        itens: []
    }
];


  constructor(private http: HttpClient, private router: Router, private configService: ConfigService, private snackBar: MatSnackBar) { }

  ngOnInit(): void {
    this.updateCurrentTime();
    this.intervalId = setInterval(() => this.updateCurrentTime(), 1000);

    const headers = new HttpHeaders().set('Authorization', 'Bearer ' + localStorage.getItem('token'));
    const baseUrl = this.configService.getBaseUrl();

    this.http.get(baseUrl + '/lubvel/operacoes/dashboard-admin', { headers }).subscribe(
      (response: any) => {
        this.userName = response.empresaNome;
        this.produtosEstoque = formataQuantidade(response.produtosBaixoEstoque);
        this.clientesCadastros = formataQuantidade(response.clientesCadastros);

        // Verifica se há produtosClienteBaixoEstoque e armazena no localStorage
        if (response.produtosClienteBaixoEstoque && response.produtosClienteBaixoEstoque.length > 0) {
          // Extrai os publicIds dos clientes
          const clientesIds = response.produtosClienteBaixoEstoque.map((cliente: any) => cliente.clientePublicId);

          // Armazena a lista no localStorage
          localStorage.setItem('publicIdsClientesBaixoEstoque', JSON.stringify(clientesIds));
        } else {
          // Remove a entrada do localStorage caso não haja produtos em baixo estoque
          localStorage.removeItem('publicIdsClientesBaixoEstoque');
        }
      },
      error => {
        console.log(error);
      }
    );
  }


  ngOnDestroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  goToAtividades(periodoConsulta: string) {
    this.router.navigate([`/admin/app-selecionar-empresa`, 'app-lista-atividades'], { queryParams: { periodo: periodoConsulta } });
  }

  private updateCurrentTime() {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    this.currentTime = `${hours}:${minutes}`;
  }

}
function getCurrentDate() {
  var today = new Date();
  var dd = String(today.getDate()).padStart(2, '0');
  var mm = String(today.getMonth() + 1).padStart(2, '0');
  var yyyy = today.getFullYear();

  return dd + '/' + mm + '/' + yyyy;
}

function formataQuantidade(atividades: any): any {
  return atividades > 9 ? atividades = '9+' : atividades;
}
