import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router, ActivatedRoute } from '@angular/router';
import { ConfigService } from '../services/config.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BreadcrumbItem } from '../breadcrumb/breadcrumb.component';

interface SubProduto {
  nome: string;
  qtd: number;
  unidade: string;
  qtdFormat: string;
  codigo: string;
  permiteExcluir: boolean;
}

interface ProdutoBase {
  nome: string;
  tipoLubrificante: string;
  produtos: SubProduto[];
}

interface ProdutoErro {
  nome: string;
  codigo: string;
  motivo: string;
}

@Component({
  selector: 'app-form-produto',
  templateUrl: './form-produto.component.html',
  styleUrls: ['./form-produto.component.css']
})
export class FormProdutoComponent implements OnInit {
  produtoEdicao: any = null;
  isEditMode: boolean = false;

  breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Cadastros', route: '/cadastros' },
    { label: 'Produtos', route: '/admin/app-lista-produto' },
    { label: 'Cadastrar Produto', active: true }
  ];

  stepItems = [
    { label: 'Produto Base', step: 'produtoBase', disabled: false, active: true },
    { label: 'Sub Produtos', step: 'subProdutos', disabled: true, active: false },
    { label: 'Confirmação', step: 'confirmacao', disabled: true, active: false }
  ];

  currentStep: 'produtoBase' | 'subProdutos' | 'confirmacao' = 'produtoBase';

  produtoBase: ProdutoBase = {
    nome: '',
    tipoLubrificante: '',
    produtos: []
  };

  subProduto: SubProduto = {
    nome: '',
    qtd: 0,
    unidade: 'UN',
    qtdFormat: '',
    codigo: '',
    permiteExcluir: true
  };

  unidadeMedida: string[] = [];
  limiteSubproduto: number = 50;
  isCodigoAtivo: boolean = false;
  sucessoOperacao: boolean = false;
  produtosErro: ProdutoErro[] = [];

  produtoEmEdicao: SubProduto | null = null;
  produtoEditandoBackup: any = null;

  constructor(
    private http: HttpClient,
    private router: Router,
    private route: ActivatedRoute,
    private configService: ConfigService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    const productId = this.route.snapshot.paramMap.get('id');
    if (productId) {
      this.isEditMode = true;
      this.loadProductForEdit(productId);
      this.updateBreadcrumb('Editar Produto');
    }
  }

  loadProductForEdit(productId: string): void {
    let headers = new HttpHeaders().set('Authorization', 'Bearer ' + localStorage.getItem('token'));
    const cliente_id = localStorage.getItem('cliente_id');
    if(cliente_id){
      headers = headers.set('user-id', cliente_id);
    }
    const baseUrl = this.configService.getBaseUrl();

    this.http.get(`${baseUrl}/lubvel/produto-base/${productId}`, { headers }).subscribe(
      (response: any) => {
        if (response.success && response.data) {
          this.produtoEdicao = response.data;
          this.produtoBase.nome = response.data.nome;
          this.produtoBase.tipoLubrificante = response.data.tipoLubrificante;
          this.produtoBase.produtos = response.data.produtos || [];
          this.defineUnidadesMedida();
          this.atualizarLimiteSubproduto();
        }
      },
      error => {
        this.showError('Erro ao carregar produto para edição');
        this.router.navigate(['/admin/app-lista-produto']);
      }
    );
  }

  updateBreadcrumb(label: string): void {
    this.breadcrumbItems = [
      { label: 'Cadastros', route: '/cadastros' },
      { label: 'Produtos', route: '/admin/app-lista-produto' },
      { label: label, active: true }
    ];
  }

  validateCodigoLength(event: Event): void {
    const input = event.target as HTMLInputElement;
    input.value = input.value.replace(/[^0-9]/g, '');
    this.subProduto.codigo = input.value.slice(0, 10);
  }

  limparCampo(event: any): void {
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

  atualizarLimiteSubproduto(): void {
    const tamanhoProdutoBase = this.produtoBase.nome?.length || 0;
    this.limiteSubproduto = Math.max(50 - tamanhoProdutoBase, 0);
  }

  defineUnidadesMedida(): void {
    const unidadesDeMedidaMapper: Record<string, string[]> = {
      'GRAXA': ['g', 'Kg'],
      'LIQUIDO': ['ml', 'L'],
      'PECA': ['UN'],
    }

    this.unidadeMedida = unidadesDeMedidaMapper[this.produtoBase.tipoLubrificante];
  }

  alterarEtapa(step: string): void {
    const stepItem = this.stepItems.find(item => item.step === step);
    if (stepItem && !stepItem.disabled && step !== 'confirmacao') {
      this.currentStep = step as 'produtoBase' | 'subProdutos';
      this.updateStepItems();
    }
  }

  updateStepItems(): void {
    this.stepItems.forEach(item => {
      item.active = item.step === this.currentStep;

      if (this.currentStep === 'produtoBase') {
        item.disabled = item.step !== 'produtoBase';
      } else if (this.currentStep === 'subProdutos') {
        item.disabled = item.step === 'confirmacao';
      } else if (this.currentStep === 'confirmacao') {
        item.disabled = item.step !== 'confirmacao';
      }
    });
  }

  nextStep(): void {
    if (this.produtoBase.nome && this.produtoBase.tipoLubrificante) {
      this.currentStep = 'subProdutos';
      this.updateStepItems();
    } else {
      let camposFaltantes = [];
      if (!this.produtoBase.nome) {
        camposFaltantes.push('Nome');
      }
      if (!this.produtoBase.tipoLubrificante) {
        camposFaltantes.push('Tipo de Lubrificante');
      }
      this.showError(`Preencha os campos: ${camposFaltantes.join(', ')}`);
    }
  }

  verificarCodigo(): boolean {
    if (this.isCodigoAtivo) {
      return this.subProduto.codigo.length > 0;
    }
    return true;
  }

  adicionarSubProduto(): void {
    if (this.subProduto.nome && this.subProduto.unidade && this.subProduto.qtd > 0 && this.verificarCodigo()) {
      let subProdutoNovoNome = `${this.produtoBase.nome} - ${this.subProduto.nome}`;

      const produtoExistente = this.produtoBase.produtos.find(p => {
        const codigoIgual = this.subProduto.codigo && p.codigo && p.codigo === this.subProduto.codigo;
        const nomeIgual = p.nome === subProdutoNovoNome;
        return codigoIgual || nomeIgual;
      });

      if (produtoExistente) {
        let mensagem = '';
        if (produtoExistente.codigo === this.subProduto.codigo && this.subProduto.codigo) {
          mensagem = `O subproduto já foi adicionado com o código: ${produtoExistente.codigo}`;
        } else if (produtoExistente.nome === subProdutoNovoNome) {
          mensagem = `O subproduto já foi adicionado com o nome: ${produtoExistente.nome}`;
        }
        this.showError(mensagem);
        return;
      }

      this.subProduto.nome = subProdutoNovoNome;
      this.subProduto.qtdFormat = `${this.subProduto.qtd} - ${this.subProduto.unidade}`;

      this.produtoBase.produtos = [...this.produtoBase.produtos, { ...this.subProduto }];
      this.subProduto = { nome: '', qtd: 0, unidade: '', qtdFormat: '', codigo: '', permiteExcluir: true };
      this.isCodigoAtivo = false;
    } else {
      let camposFaltantes = [];
      if (!this.subProduto.nome) {
        camposFaltantes.push('Nome');
      }
      if (this.subProduto.qtd <= 0) {
        camposFaltantes.push('Quantidade');
      }
      if (!this.subProduto.unidade) {
        camposFaltantes.push('Unidade de Medida');
      }
      if (!this.verificarCodigo()) {
        camposFaltantes.push('Código');
      }
      this.showError(`Preencha os campos: ${camposFaltantes.join(', ')}`);
    }
  }

  removerSubProduto(produto: SubProduto): void {
    this.produtoBase.produtos = this.produtoBase.produtos.filter(p => p !== produto);
  }

  editarSubProduto(produto: SubProduto): void {
    if (this.produtoEmEdicao && this.produtoEmEdicao !== produto) {
      this.cancelarEdicaoSubProduto(this.produtoEmEdicao);
    }

    this.produtoEmEdicao = produto;
    this.produtoEditandoBackup = {
      qtd: produto.qtd,
      codigo: produto.codigo,
      unidade: produto.unidade,
      qtdFormat: produto.qtdFormat
    };
  }

  salvarEdicaoSubProduto(produto: SubProduto): void {
    if (!produto.qtd || produto.qtd <= 0) {
      this.showError('A quantidade deve ser maior que zero');
      return;
    }

    if (produto.codigo && produto.codigo.trim() !== '') {
      const produtoComMesmoCodigo = this.produtoBase.produtos.find(p =>
        p !== produto && p.codigo === produto.codigo
      );

      if (produtoComMesmoCodigo) {
        this.showError(`O código ${produto.codigo} já está em uso por outro subproduto`);
        return;
      }
    }

    produto.qtdFormat = `${produto.qtd} - ${produto.unidade}`;
    this.produtoEmEdicao = null;
    this.produtoEditandoBackup = null;
    this.showSuccess('Subproduto atualizado com sucesso');
  }

  cancelarEdicaoSubProduto(produto: SubProduto): void {
    if (this.produtoEditandoBackup) {
      produto.qtd = this.produtoEditandoBackup.qtd;
      produto.codigo = this.produtoEditandoBackup.codigo;
      produto.unidade = this.produtoEditandoBackup.unidade;
      produto.qtdFormat = this.produtoEditandoBackup.qtdFormat;
    }

    this.produtoEmEdicao = null;
    this.produtoEditandoBackup = null;
  }

  validarCodigoEdicao(event: Event, produto: SubProduto): void {
    const input = event.target as HTMLInputElement;
    input.value = input.value.replace(/[^0-9]/g, '');
    produto.codigo = input.value.slice(0, 10);
  }

  limparCampoEdicao(event: any): void {
    if (event.target.value === '0') {
      event.target.value = '';
    }
  }

  confirmar(): void {
    if (this.produtoBase.produtos.length > 0) {
      this.produtoBase.produtos = this.produtoBase.produtos.map(p => {
        if (p.unidade === 'Kg') {
          p.qtd *= 1000;
          p.unidade = 'g';
        } else if (p.unidade === 'L') {
          p.qtd *= 1000;
          p.unidade = 'ml';
        }
        return p;
      });
      this.salvarProduto();
    } else {
      this.showError('Adicione ao menos um subproduto');
    }
  }

  salvarProduto(): void {
    let headers = new HttpHeaders().set('Authorization', 'Bearer ' + localStorage.getItem('token'));
    const cliente_id = localStorage.getItem('cliente_id');
    if(cliente_id){
      headers = headers.set('user-id', cliente_id);
    }

    const baseUrl = this.configService.getBaseUrl();
    const url = `${baseUrl}/lubvel/produtos/cadastro-lote`;
    const body = {
      nome: this.produtoBase.nome,
      tipoLubrificante: this.produtoBase.tipoLubrificante,
      produtos: this.produtoBase.produtos
    };

    if (this.produtoEdicao) {
      (body as any).publicId = this.produtoEdicao.publicId;
    }

    this.http.post(url, body, { headers }).subscribe(
      (response) => {
        this.sucessoOperacao = true;
        this.goToConfirmation();
      },
      (error) => {
        this.sucessoOperacao = false;
        const erros = error.error.data;
        this.produtosErro = erros.map((erro: any) => ({
          nome: erro.nome,
          codigo: erro.codigo,
          motivo: erro.motivo
        }));
        this.goToConfirmation();
      }
    );
  }

  goToConfirmation(): void {
    this.currentStep = 'confirmacao';
    this.updateStepItems();
  }

  novoProduto(): void {
    this.produtoBase = { nome: '', tipoLubrificante: '', produtos: [] };
    this.subProduto = { nome: '', qtd: 0, unidade: '', qtdFormat: '', codigo: '', permiteExcluir: true };
    this.produtosErro = [];
    this.sucessoOperacao = false;
    this.currentStep = 'produtoBase';
    this.produtoEdicao = null;
    this.isEditMode = false;
    this.updateStepItems();
    this.updateBreadcrumb('Cadastrar Produto');
  }

  voltarParaListagem(): void {
    this.router.navigate(['/admin/app-lista-produto']);
  }

  // private tratarTipoLubrificante(tipoLubrificante: string): string {
  //   if (tipoLubrificante === 'LIQUIDO') {
  //     return 'LIQUIDO';
  //   } else if (tipoLubrificante === 'GRAXA') {
  //     return 'GRAXA';
  //   } else if (tipoLubrificante === 'PECA') {
  //     return 'PECA';
  //   }
  //   return '';
  // }

  private showError(message: string): void {
    this.snackBar.open(message, 'Fechar', { duration: 3000 });
  }

  private showSuccess(message: string): void {
    this.snackBar.open(message, 'Fechar', { duration: 2000 });
  }
}
