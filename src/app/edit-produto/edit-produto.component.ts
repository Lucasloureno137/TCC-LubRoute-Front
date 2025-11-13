import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ConfigService } from '../services/config.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BreadcrumbItem } from '../breadcrumb/breadcrumb.component';

interface SubProdutoData {
  produtoBasePublicId: string,
  codigo: string,
  nome: string,
  quantidadeMl: number,
  quantidadeGramas: number,
  quantidadeUnidade: number,
  permiteExcluir: boolean
}

interface ProdutoBaseData {
  publicId: string,
  nome: string,
  tipoLubrificante: "LIQUIDO" | "GRAXA" | "PECA",
  quantidadeSubprodutos: number,
  subprodutos: SubProdutoData[]
}

interface ProdutoBaseResponse {
  success: boolean,
  created: boolean,
  status: number,
  message: string,
  data: ProdutoBaseData
}

@Component({
  selector: 'app-edit-produto',
  templateUrl: './edit-produto.component.html',
  styleUrls: ['./edit-produto.component.css']
})
export class EditProdutoComponent implements OnInit {

  headers = new HttpHeaders().set('Authorization', 'Bearer ' + localStorage.getItem('token'));
  produtoId: number = 0;

  produtoBase = {
    id: 0,
    nome: '',
    tipoLubrificante: '',
    produtos: [] as { id?: number; nome: string; qtd: number; unidade: string; qtdFormat: string; codigo: string }[]
  };

  subProduto = { nome: '', qtd: 0, unidade: '', qtdFormat: '', codigo: '' };

  displayedColumns: string[] = ['nome', 'quantidade', 'codigo', 'acao'];
  unidadeMedida: string[] = [];
  limiteSubproduto = 50;
  isCodigoAtivo = false;

  breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Cadastros', route: '/cadastros' },
    { label: 'Produtos', route: '/admin/app-lista-produto' },
    { label: 'Editar Produto', active: true }
  ];

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private matSnackBar: MatSnackBar,
    private configService: ConfigService,
    private http: HttpClient
  ) { }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.produtoId = params['id'];
      this.carregarProduto();
    });
  }

  carregarProduto(): void {
    let headers = new HttpHeaders().set('Authorization', 'Bearer ' + localStorage.getItem('token'));
    const cliente_id = localStorage.getItem('cliente_id');
    if (cliente_id) {
      headers = headers.set('user-id', cliente_id);
    }
    const baseUrl = this.configService.getBaseUrl();

    this.http.get(`${baseUrl}/lubvel/produtos-base/${this.produtoId}`, { headers }).subscribe(
      (response: any) => {
        const res = response as ProdutoBaseResponse;
        if (res.success && res.data) {
          const data = response.data
          // this.produtoEdicao = response.data;
          this.produtoBase.nome = data.nome;
          this.produtoBase.tipoLubrificante = data.tipoLubrificante;
          this.produtoBase.produtos = data.subprodutos.map((subproduto: SubProdutoData) => ({
            ...subproduto,
            qtd: subproduto.quantidadeGramas || subproduto.quantidadeMl || subproduto.quantidadeUnidade,
            unidade: subproduto.quantidadeGramas ? 'g' : subproduto.quantidadeMl ? 'ml' : 'un',
            qtdFormat: `${subproduto.quantidadeGramas || subproduto.quantidadeMl || subproduto.quantidadeUnidade} - ${subproduto.quantidadeGramas ? 'g'  : subproduto.quantidadeMl ? 'ml' : 'un'}`
          })) || [];
          this.defineUnidadesMedida();
          this.atualizarLimiteSubproduto();
        }
      },
      error => {
        // this.showError('Erro ao carregar produto para edição');
        // this.router.navigate(['/admin/app-lista-produto']);
      }
    );
  }

  validateCodigoLength(event: Event): void {
    const input = event.target as HTMLInputElement;
    input.value = input.value.replace(/[^0-9]/g, '');
    this.subProduto.codigo = input.value.slice(0, 10);
  }

  limparCampo(event: any) {
    if (event.target.value === '0') {
      event.target.value = '';
    }
  }

  onToggleChange(isActive: boolean): void {
    if (!isActive) {
      this.subProduto.codigo = '';
    }
  }

  formatarParaMaiusculo(valor: string, campo: string): void {
    if (campo === 'nome') {
      this.produtoBase.nome = valor.toUpperCase();
    } else if (campo === 'subproduto') {
      this.subProduto.nome = valor.toUpperCase();
    }
  }

  atualizarLimiteSubproduto() {
    const tamanhoProdutoBase = this.produtoBase.nome?.length || 0;
    this.limiteSubproduto = Math.max(50 - tamanhoProdutoBase, 0);
  }

  defineUnidadesMedida() {
    const unidadesDeMedidaMapper: Record<string, string[]> = {
      'GRAXA': ['g', 'Kg'],
      'LIQUIDO': ['ml', 'L'],
      'PECA': ['UN'],
    }

    this.unidadeMedida = unidadesDeMedidaMapper[this.produtoBase.tipoLubrificante];
  }

  verificarCodigo() {
    if (this.isCodigoAtivo) {
      return this.subProduto.codigo.length > 0;
    }
    return true;
  }

  adicionarSubProduto() {
    if (this.subProduto.nome && this.subProduto.unidade &&this.subProduto.qtd > 0 && this.verificarCodigo()) {
      let subProdutoNovoNome = `${this.produtoBase.nome} - ${this.subProduto.nome}`;

      const produtoExistente = this.produtoBase.produtos.find(p =>
        p.codigo === this.subProduto.codigo || p.nome === subProdutoNovoNome
      );

      if (produtoExistente) {
        let codigo = produtoExistente.codigo === this.subProduto.codigo ? produtoExistente.codigo : '';
        let nome = produtoExistente.nome === subProdutoNovoNome ? produtoExistente.nome : '';
        this.matSnackBar.open(`O subproduto já foi adicionado: ${nome} - ${codigo}`, 'Fechar', { duration: 3000 });
        return;
      }

      this.subProduto.nome = subProdutoNovoNome;
      this.subProduto.qtdFormat = `${this.subProduto.qtd} - ${this.subProduto.unidade}`;
      this.produtoBase.produtos = [
        ...this.produtoBase.produtos,
        { ...this.subProduto }
      ];
      this.subProduto = { nome: '', qtd: 0, unidade: '', qtdFormat: '', codigo: '' };
      this.isCodigoAtivo = false;
    } else {
      let camposFaltantes = [];
      if (!this.subProduto.nome) camposFaltantes.push('Nome');
      if (this.subProduto.qtd <= 0) camposFaltantes.push('Quantidade');
      if (!this.subProduto.unidade) camposFaltantes.push('Unidade de Medida');
      if (!this.verificarCodigo()) camposFaltantes.push('Código');

      console.log(camposFaltantes)
      this.matSnackBar.open(`Preencha os campos: ${camposFaltantes.join(', ')}`, 'Fechar', { duration: 3000 });
    }
  }

  removerSubProduto(produto: any) {
    this.produtoBase.produtos = this.produtoBase.produtos.filter(p => p !== produto);
  }

  salvarAlteracoes() {
    if (this.produtoBase.nome && this.produtoBase.tipoLubrificante) {
      this.salvarProduto();
    } else {
      let camposFaltantes = [];
      if (!this.produtoBase.nome) camposFaltantes.push('Nome');
      if (!this.produtoBase.tipoLubrificante) camposFaltantes.push('Tipo de Lubrificante');

      this.matSnackBar.open(`Preencha os campos: ${camposFaltantes.join(', ')}`, 'Fechar', { duration: 3000 });
    }
  }

  salvarProduto(): void {
    let headers = new HttpHeaders().set('Authorization', 'Bearer ' + localStorage.getItem('token'));
    const cliente_id = localStorage.getItem('cliente_id');
    if (cliente_id) {
      headers = headers.set('user-id', cliente_id);
    }

    const baseUrl = this.configService.getBaseUrl();
    const url = `${baseUrl}/lubvel/produtos/cadastro-lote`;
    const body = {
      publicId: this.produtoId,
      nome: this.produtoBase.nome,
      tipoLubrificante: this.produtoBase.tipoLubrificante,
      produtos: this.produtoBase.produtos
    };

    this.http.post(url, body, { headers }).subscribe(
      (response) => {
        this.matSnackBar.open('Produto atualizado com sucesso!', 'Fechar', { duration: 3000 });
        this.router.navigate(['admin/app-lista-produto']);
      },
      (error) => {
        const erros = error.error.data;
        
        this.matSnackBar.open(`Erro ao salvar produtos: ${erros.join(', ')}`, 'Fechar', { duration: 3000 });
      }
    );
  }

  cancelar() {
    this.router.navigate(['admin/app-lista-produto']);
  }

  voltarParaListagem(): void {
    this.router.navigate(['/admin/app-lista-produto']);
  }
}
