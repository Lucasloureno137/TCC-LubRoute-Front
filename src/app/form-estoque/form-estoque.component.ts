import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Location } from '@angular/common';
import { ConfigService } from '../services/config.service';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { XMLParser } from 'fast-xml-parser';
import { BreadcrumbItem } from '../breadcrumb/breadcrumb.component';


interface Produto {
  prod: {
    cProd: string;
    qTrib: string;
    vUnTrib: string;
    xProd: string;
  };
}

interface Produtos {
  nome: string;
}

@Component({
  selector: 'app-form-estoque',
  templateUrl: './form-estoque.component.html',
  styleUrl: './form-estoque.component.css'
})
export class FormEstoqueComponent implements OnInit {

  motivo: string = '';
  tipoLancamento: string = 'E';
  produtoSelecionado: any;
  produtoSelecionadoEstoqueAtual: number | null = null;
  quantidade: any = null;
  valor: any = 0;
  produtos: Produtos[] = [];
  produtosLista: any[] = [];
  displayedColumns: string[] = ['nome', 'quantidade', 'codigo', 'actions'];
  headers = new HttpHeaders().set('Authorization', 'Bearer ' + localStorage.getItem('token'));
  myControl = new FormControl<string | Produtos>('');
  filteredProdutos!: Observable<Produtos[]>;


  breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Estoque', route: '/app-lista-estoque' },
    { label: 'Incluir produtos em estoque', active: true }
  ];


  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar,
    private location: Location,
    private configService: ConfigService,
    private router: Router,
  ) { }

  ngOnInit(): void {
    this.fetchProdutos();

    this.filteredProdutos = this.myControl.valueChanges.pipe(
      startWith(''),
      map(value => {
        const nome = typeof value === 'string' ? value : value?.nome;
        return nome ? this._filterProdutos(nome as string) : this.produtos.slice();
      }),
    );

  }

  displayFn(produto: any): string {
    return produto && produto.nome ? produto.nome : '';
  }

  private _filterProdutos(nome: string): any[] {
    const filterValue = nome.toLowerCase();
    return this.produtos.filter(option => option.nome.toLowerCase().includes(filterValue));
  }


  limparCampo(event: any): void {
    if (event.target.value === '0') {
      event.target.value = '';
    }
  }

  corrigirQuantidade(event: any) {
    if (event.target.value === '') return;
    if (this.quantidade < 1) {
      event.target.value = '';
      this.quantidade = 0;
    }
  }

  fetchProdutos(): void {
    const baseUrl = this.configService.getBaseUrl();
    const apiUrl = baseUrl + '/lubvel/produtos';

    const cliente_id = localStorage.getItem('cliente_id');
    if (cliente_id) {
      this.headers = this.headers.set('user-id', cliente_id);
    }

    this.http.get<any[]>(apiUrl + '/todos', { headers: this.headers }).subscribe(
      (response: any) => {

        this.produtos = changePropertieName(response.data);
        console.log(this.produtos)
      },
      (error) => {
        this.snackBar.open('Erro ao buscar produtos.', 'Fechar', {
          duration: 3000,
        });
      }
    );
  }

  carregarTodasOpcoes() {
    // Atualiza filteredProdutos com todos os produtos disponíveis
    this.filteredProdutos = this.myControl.valueChanges.pipe(
      startWith(''),
      map(value => {
        const nome = typeof value === 'string' ? value : value?.nome;
        return nome ? this._filterProdutos(nome as string) : this.produtos.slice();
      })
    );
  }




  onProdutoChange(produto: any) {
    this.produtoSelecionado = produto.codigo;
    this.produtoSelecionadoEstoqueAtual = produto.quantidade;
  }

  formatCurrency(event: any) {
    const input = event.target;
    let value = input.value.replace(/\D/g, '');
    value = (parseInt(value, 10) / 100).toFixed(2).toString();
    value = value.replace('.', ',');
    value = value.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    input.value = `R$ ${value}`;
  }

  adicionarLista() {
    if (!this.produtoSelecionado || !this.quantidade || !this.tipoLancamento) {
      this.snackBar.open('Todos os campos são necessários.', 'Fechar', {
        duration: 3000,
      });
      return;
    }


    const novoProduto = {
      nome: recuperarNomeProduto(this.produtoSelecionado, this.produtos),
      quantidade: this.quantidade,
      valor: this.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
      codigo: this.produtoSelecionado,
      tipoLancamento: this.tipoLancamento,
      motivo: this.motivo,
    };

    this.produtosLista = [...this.produtosLista, novoProduto];

    this.produtoSelecionado = '';
    this.quantidade = '';
    this.valor = '';
    this.tipoLancamento = '';
    this.motivo = '';
    this.myControl.reset();


    this.snackBar.open('Produto adicionado com sucesso!', 'Fechar', {
      duration: 3000,
    });
  }

  enviarFormulario(): void {
    if (this.produtosLista.length === 0) {
      this.snackBar.open('Adicione produtos à lista antes de enviar.', 'Fechar', {
        duration: 3000,
      });
      return;
    }

    this.produtosLista = this.produtosLista.map((produto: any) => {
      let valorCompleto = produto.valor;

      // Remover os três primeiros caracteres
      let valorStr = valorCompleto.trim().substring(3);

      // Substituir a vírgula por ponto
      valorStr = valorStr.replace(',', '.');

      let valorVar = parseFloat(valorStr) || 0;

      const qtd = produto.tipoLancamento === 'S' ? -produto.quantidade : produto.quantidade;
      return {
        quantidade: qtd,
        codigo: produto.codigo,
        preco: valorVar,
        motivo: produto.motivo,
      };
    });

    const baseUrl = this.configService.getBaseUrl();
    const apiUrl = baseUrl + '/lubvel/estoque/lista-estoque';

    const body = this.produtosLista;

    const cliente_id = localStorage.getItem('cliente_id');
    if (cliente_id) {
      this.headers = this.headers.set('user-id', cliente_id);
    }

    this.http.post(apiUrl, body, { headers: this.headers }).subscribe(
      (response) => {
        this.snackBar.open('Sucesso.', 'Fechar', {
          duration: 3000,
        });
        this.produtosLista = [];
        this.quantidade = '';
        this.produtoSelecionado = '';
        this.tipoLancamento = '';
        this.valor = '';
        this.motivo = '';

        this.router.navigate(['/app-lista-estoque'])
      },
      (error) => {
        this.snackBar.open(`Operação inválida:\n ${error.data.message}`, 'Fechar', {
          duration: 15000,
        });
      }
    );
  }

  abrirArquivo(event: any) {
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = () => {
      const xml = reader.result as string;
      this.parseXml(xml);
    };

    reader.readAsText(file);
  }

  removerProduto(produto: any): void {
    const index = this.produtosLista.indexOf(produto);
    if (index >= 0) {
      this.produtosLista.splice(index, 1);
      this.produtosLista = [...this.produtosLista]; // Atualiza a lista para refletir na tabela
      this.snackBar.open('Produto removido com sucesso!', 'Fechar', {
        duration: 3000,
      });
    }
  }


  parseXml(xml: string) {
    const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "", parseTagValue: false });
    const result = parser.parse(xml);

    try {
      const nfe = result.nfeProc.NFe.infNFe;
      let produtos = nfe.det;

      if (!Array.isArray(produtos)) {
        produtos = [produtos];
      }

      const novosProdutos = produtos.map((produto: Produto) => {
        const cProd = produto.prod.cProd;
        const nomeProduto = produto.prod.xProd;
        const quantidade = parseFloat(produto.prod.qTrib);
        const valor = parseFloat(produto.prod.vUnTrib) * quantidade;

        return {
          nome: nomeProduto,
          quantidade: quantidade,
          valor: valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
          codigo: cProd
        };
      });

      this.produtosLista = [...this.produtosLista, ...novosProdutos];

    } catch (err) {
      this.snackBar.open('Erro ao ler arquivo.', 'Fechar', {
        duration: 3000,
      });
    }
  }
}


function recuperarNomeProduto(produtoSelecionado: any, produtos: any) {
  return produtos.find((p: any) => p.codigo === produtoSelecionado)?.nome;
}

function changePropertieName(data: any): any {
  return data.map((produto: any) => {
    return {
      codigo: produto.publicId,
      nome: produto.nome,
      ...produto,
    };
  });
}

