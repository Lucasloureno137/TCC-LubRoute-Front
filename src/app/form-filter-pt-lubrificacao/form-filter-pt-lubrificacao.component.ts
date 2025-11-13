import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ConfigService } from '../services/config.service';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { Location } from '@angular/common';
import { FormControl } from '@angular/forms';
import { Observable, map, startWith } from 'rxjs';
import { BreadcrumbItem } from '../breadcrumb/breadcrumb.component';

@Component({
  selector: 'app-form-filter-pt-lubrificacao',
  templateUrl: './form-filter-pt-lubrificacao.component.html',
  styleUrl: './form-filter-pt-lubrificacao.component.css'
})
export class FormFilterPtLubrificacaoComponent implements OnInit {

  changeRadio(arg0: any) {
    if (arg0) {
      this.ptLubrificacaoSelecionado = '';
    }
    this.updateConsultaHabilitada();
  }
  headers = new HttpHeaders().set('Authorization', 'Bearer ' + localStorage.getItem('token'));
  setores: any[] = [];
  equipamentos: any[] = [];
  pontosLubrificacao: any[] = [];

  isLoading = false;

  setorSelecionado: string = '';
  equipamentoSelecionado: string = '';
  ptLubrificacaoSelecionado: string = '';
  baseUrl: string = this.config.getBaseUrl();
  consultaHabilitada: boolean = false;
  pronunciou: boolean = false;
  currentStep: number = 1;

  equipamentoControl = new FormControl<string | any>('');
  filteredEquipamentos!: Observable<any[]>;

  breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Cadastro', },
    { label: 'Pontos de Manutenção', route: '/app-pt-manutencao' },
    { label: 'Selecionar Ponto Lubrificação', active: true }
  ];

  constructor(private http: HttpClient, private config: ConfigService, private router: Router, private location: Location) { }

  ngOnInit(): void {
    this.getSetores();
    this.exibeModalCriarOuSelecionarPontoLubrificacao();
    scroolTop();

    this.filteredEquipamentos = this.equipamentoControl.valueChanges.pipe(
      startWith(''),
      map(value => {
        const descricao = typeof value === 'string' ? value : value?.descricao;
        return descricao ? this._filterEquipamentos(descricao as string) : (this.equipamentos || []).slice();
      })
    );
  }

  backPage() {
    this.router.navigate(['/dashboard']);
  }

  exibeModalCriarOuSelecionarPontoLubrificacao() {

    // se na url contiver 'no-modal-show' não exibe o modal e coloca o valor padrão de 'true' para this.pronunciou
    if (this.router.url.includes('no-modal-show')) {
      this.pronunciou = true;
      return;
    }

    Swal.fire({
      title: 'Escolha uma opção',
      text: 'Você deseja selecionar um ponto de manutenção existente ou criar um novo?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Selecionar ponto existente',
      cancelButtonText: 'Criar novo ponto de manutenção',
      showCloseButton: true,   // Exibe o "X" no canto superior direito
      closeButtonAriaLabel: 'Fechar',  // Acessibilidade para o "X"
      reverseButtons: false,
      allowOutsideClick: false, // Impede que o modal feche se o usuário clicar fora
      allowEscapeKey: false // Impede que o modal feche se o usuário apertar ESC
    }).then((result) => {
      if (result.dismiss === Swal.DismissReason.cancel) {
        this.router.navigate(['/app-form-pt-manutencao/show-breadcumb']);
      } else if (result.dismiss === Swal.DismissReason.close) {
        this.location.back();
      } else {
        this.pronunciou = true;
      }
    });
  }

  getSetores(): void {
    this.isLoading = true;
    const cliente_id = localStorage.getItem('cliente_id');
    if (cliente_id) {
      this.headers = this.headers.set('user-id', cliente_id);
    }
    this.http.get<any[]>(`${this.baseUrl}/lubvel/setor`, { headers: this.headers }).subscribe(
      (response: any) => {
        this.setores = response.data;
        this.isLoading = false;
      }, (error) => {
        this.isLoading = false;
        console.error('Erro ao buscar setores:', error);
      });
  }


  getEquipamentos(setorPublicId: string): void {
    const cliente_id = localStorage.getItem('cliente_id');
    if (cliente_id) {
      this.headers = this.headers.set('user-id', cliente_id);
    }
    this.http.get<any[]>(`${this.baseUrl}/lubvel/equipamentos/setor/${setorPublicId}`, { headers: this.headers }).subscribe(
      (response: any) => {
        this.equipamentos = response.data;
        this.carregarTodasOpcoesEquipamento();
      }, (error) => {
        console.error('Erro ao buscar equipamentos:', error);
      });
  }

  getPontosLubrificacao(equipamentoPublicId: string): void {
    const cliente_id = localStorage.getItem('cliente_id');
    if (cliente_id) {
      this.headers = this.headers.set('user-id', cliente_id);
    }
    this.http.get<any[]>(`${this.baseUrl}/lubvel/pontos-de-lubrificacao/equipamento/${equipamentoPublicId}`, { headers: this.headers }).subscribe(
      (response: any) => {
        this.pontosLubrificacao = response.data;
      }, (error) => {
        console.error('Erro ao buscar pontos de manutenção:', error);
      });
  }

  onSelect(value: any, type: string): void {
    if (type === 'SETOR') {
      this.setorSelecionado = value;
      this.equipamentoSelecionado = '';
      this.pontosLubrificacao = [];
      this.ptLubrificacaoSelecionado = '';
      this.getEquipamentos(value);
    } else if (type === 'EQP') {
      // Fix: Extract the publicId from the equipment object
      this.equipamentoSelecionado = value.publicId;
      this.ptLubrificacaoSelecionado = '';
      this.getPontosLubrificacao(value.publicId);
    } else if (type === 'PT_LUB') {
      this.ptLubrificacaoSelecionado = value;
    }
    this.updateConsultaHabilitada();
  }

  updateConsultaHabilitada() {
    this.consultaHabilitada = !!(this.setorSelecionado && this.equipamentoSelecionado
      && (this.ptLubrificacaoSelecionado || this.pontosLubrificacao.length > 0));
  }

  enviarFormulario(): void {
    const dadosFormulario = {
      setorSelecionado: this.setorSelecionado,
      equipamentoSelecionado: this.equipamentoSelecionado,
      ptLubrificacaoSelecionado: this.ptLubrificacaoSelecionado,
    };

    const route = `app-form-operacao/${this.ptLubrificacaoSelecionado}/${this.equipamentoSelecionado}/show-breadcumb`;
    this.router.navigate([route]);
  }

  private _filterEquipamentos(value: string): any[] {
    const filterValue = value.toLowerCase();
    return (this.equipamentos || []).filter(option =>
      option.descricao.toLowerCase().includes(filterValue)
    );
  }

  displayEquipamentoFn(equipamento: any): string {
    return equipamento && equipamento.descricao ? equipamento.descricao : '';
  }

  carregarTodasOpcoesEquipamento() {
    this.filteredEquipamentos = this.equipamentoControl.valueChanges.pipe(
      startWith(''),
      map(value => {
        const descricao = typeof value === 'string' ? value : value?.descricao;
        return descricao ? this._filterEquipamentos(descricao) : (this.equipamentos || []).slice();
      })
    );
  }
}

function scroolTop() {
  // rola para o topo da página
  window.scrollTo({ top: 0 });
}
