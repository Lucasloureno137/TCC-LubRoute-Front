import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Location } from '@angular/common';
import { ConfigService } from '../services/config.service';
import { FormControl } from '@angular/forms';
import { Observable, map, startWith } from 'rxjs';
import { BreadcrumbItem } from '../breadcrumb/breadcrumb.component';

interface Produtos {
  nome: string;
}
@Component({
  selector: 'app-form-pt-lubrificacao',
  templateUrl: './form-pt-lubrificacao.component.html',
  styleUrl: './form-pt-lubrificacao.component.css'
})

export class FormPtLubrificacaoComponent implements OnInit {
  selectChange(value: any) {
    this.equipamentoId = value;
  }
  headers = new HttpHeaders().set('Authorization', 'Bearer ' + localStorage.getItem('token'));
  tag: string | null = null;
  descricaoComponente: string | null = null;
  isUpdate: boolean = false;
  equipamentoId: string | null = null;
  produtoId: string | null = null;
  equipamentos: any[] = [];
  produtos: any[] = [];
  pt_lubri_public_id: any;
  myControl = new FormControl<string | Produtos>('');
  filteredProdutos!: Observable<Produtos[]>;
  currentStep: number = 1;
  equipamentoControl = new FormControl<string | any>('');
  filteredEquipamentos!: Observable<any[]>;

  breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Cadastros', },
    { label: 'Pontos de Manutenção', route: '/app-pt-manutencao' },
    { label: 'Cadastrar Ponto de Manutenção', active: true }
  ];

  constructor(private http: HttpClient,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar,
    private location: Location,
    private router: Router,
    private configService: ConfigService
  ) { }

  ngOnInit(): void {
    const baseUrl = this.configService.getBaseUrl();
    Promise.all([
      this.fetch(baseUrl + '/lubvel/equipamentos', 'equipamento'),
      this.fetch(baseUrl + '/lubvel/produtos-base/with-stock', 'produto')
    ]).then(() => {
      this.route.paramMap.subscribe(params => {
        this.pt_lubri_public_id = params.get('public_id');
        this.equipamentoId = params.get('id_eqp');
        this.produtoId = params.get('id_prod');
        this.tag = params.get('tag');
        this.descricaoComponente = params.get('descricaoComponente');

        if (this.pt_lubri_public_id && this.equipamentoId && this.produtoId && this.tag && this.descricaoComponente) {
          this.isUpdate = true;
          this.setProdutoSelecionado();
          this.setEquipamentoSelecionado();
        } else if (this.equipamentoId && !this.produtoId && !this.tag && !this.descricaoComponente) {
          this.equipamentoId = this.equipamentoId;
          this.isUpdate = false;
        } else {
          this.isUpdate = false;
        }
      });
    }).catch(error => {
      // Lidar com erro de fetch, se necessário
      console.error('Erro ao carregar dados:', error);
    });

    this.filteredProdutos = this.myControl.valueChanges.pipe(
      startWith(''),
      map(value => {
        const nome = typeof value === 'string' ? value : value?.nome;
        return nome ? this._filterProdutos(nome as string) : this.produtos.slice();
      })
    );

    this.filteredEquipamentos = this.equipamentoControl.valueChanges.pipe(
      startWith(''),
      map(value => {
        const nome = typeof value === 'string' ? value : value?.descricao;
        return nome ? this._filterEquipamentos(nome as string) : this.equipamentos.slice();
      })
    );
  }

  backPage() {
    this.location.back();
  }

  setProdutoSelecionado(): void {
    if (this.isUpdate && this.produtoId) {
      // Encontrar o produto com o id correspondente

      const produtoSelecionado = this.produtos.find(prod => prod.publicId === this.produtoId);
      if (produtoSelecionado) {
        this.myControl.setValue(produtoSelecionado);
      }
    }
  }

  setEquipamentoSelecionado(): void {
    if (this.isUpdate && this.equipamentoId) {
      const equipamentoSelecionado = this.equipamentos.find(equip => equip.publicId === this.equipamentoId);
      if (equipamentoSelecionado) {
        this.equipamentoControl.setValue(equipamentoSelecionado);
      }
    }
  }

  displayFn(produto: any): string {
    return produto && produto.nome ? produto.nome : '';
  }

  private _filterProdutos(nome: string): any[] {
    const filterValue = nome.toLowerCase();
    return this.produtos.filter(option => option.nome.toLowerCase().includes(filterValue));
  }

  private _filterEquipamentos(value: any): any[] {
    const filterValue = typeof value === 'string' ? value.toLowerCase() : '';
    return this.equipamentos.filter(option =>
      option.descricao.toLowerCase().includes(filterValue)
    );
  }

  displayEquipamentoFn(equipamento: any): string {
    return equipamento && equipamento.descricao ? equipamento.descricao : '';
  }

  onEquipamentoChange(equipamento: any) {
    this.equipamentoId = equipamento.publicId;
    this.selectChange(equipamento.publicId);
  }

  fetch(apiUrl: string, objeto: string): Promise<void> {
    const cliente_id = localStorage.getItem('cliente_id');
    if (cliente_id) {
      this.headers = this.headers.set('user-id', cliente_id);
    }
    return new Promise((resolve, reject) => {
      this.http.get<any[]>(apiUrl, { headers: this.headers }).subscribe(
        (response: any) => {
          if (objeto === 'equipamento') {
            this.equipamentos = response.data;
          } else if (objeto === 'produto') {
            if (response.data.length === 0) {
              this.snackBar.open('Não foi encontrado produtos em estoque.', 'Fechar', {
                duration: 5000,
              });
            }
            this.produtos = response.data;
          }
          resolve();
        },
        (error) => {
          console.error('Erro ', error);
          reject(error);
        }
      );
    });
  }

  carregarTodasOpcoesEquipamento() {
    this.filteredEquipamentos = this.equipamentoControl.valueChanges.pipe(
      startWith(''),
      map(value => {
        const nome = typeof value === 'string' ? value : value?.descricao;
        return nome ? this._filterEquipamentos(nome as string) : this.equipamentos.slice();
      })
    );
  }

  carregarTodasOpcoes() {
    this.filteredProdutos = this.myControl.valueChanges.pipe(
      startWith(''),
      map(value => {
        const nome = typeof value === 'string' ? value : value?.nome;
        return nome ? this._filterProdutos(nome as string) : this.produtos.slice();
      })
    );
  }

  onProdutoChange(arg0: any) {
    this.produtoId = arg0.publicId;
  }

  enviarFormulario(): void {

    const cliente_id = localStorage.getItem('cliente_id');
    if (cliente_id) {
      this.headers = this.headers.set('user-id', cliente_id);
    }

    const baseUrl = this.configService.getBaseUrl();

    const apiUrl = this.isUpdate
      ? `${baseUrl}/lubvel/pontos-de-lubrificacao/${this.pt_lubri_public_id}`
      : baseUrl + '/lubvel/pontos-de-lubrificacao';

    let objetoEnvio = {
      "equipamentoId": this.equipamentoId,
      "produtoId": this.produtoId,
      "tag": this.tag,
      "descricaoComponente": this.descricaoComponente
    };

    const request = this.isUpdate
      ? this.http.put(apiUrl,
        objetoEnvio
        , { headers: this.headers })
      : this.http.post(apiUrl,
        objetoEnvio
        , { headers: this.headers });

    request.subscribe(
      (response: any) => {
        this.snackBar.open('Sucesso.', 'Fechar', {
          duration: 3000,
        });
        this.router.navigate(['app-pt-manutencao']);
      },
      (error) => {
        console.error('Erro ao enviar formulário:', error);
      }
    );
  }
}
