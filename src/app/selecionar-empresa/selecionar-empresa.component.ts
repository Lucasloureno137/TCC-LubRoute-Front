import { ConfigService } from './../services/config.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router, ActivatedRoute } from '@angular/router';
import { UserService } from '../services/user.service';

interface Empresa {
  nome: string;
  publicId: string;
}

@Component({
  selector: 'app-selecionar-empresa',
  templateUrl: './selecionar-empresa.component.html',
  styleUrls: ['./selecionar-empresa.component.css']
})
export class SelecionarEmpresaComponent implements OnInit {
  options: Empresa[] = [];
  filteredOptions: Empresa[] = this.options;
  searchControl = new FormControl('');
  selectedEmpresaControl = new FormControl(''); // Controlador para armazenar o publicId selecionado
  nextRoute = '';
  periodoParam = '';
  filtrarEmpresas = false;

  constructor(
    private http: HttpClient,
    private router: Router,
    private configService: ConfigService,
    private snackBar: MatSnackBar,
    private route: ActivatedRoute,
    private userService: UserService,
  ) {
    this.searchControl.valueChanges.subscribe(value => {
      this.filteredOptions = this._filter(value || '');
    });
  }

  ngOnInit(): void {

    if (this.router.url.includes('baixo-estoque-consulta')) {
      this.filtrarEmpresas = true;
    }

    this.route.paramMap.subscribe(params => {
      this.nextRoute = params.get('nextRoute') || '';
    });

    this.route.queryParams.subscribe(params => {

      this.periodoParam = params['periodo'] || null;

    });

    this.fetchData();
  }

  fetchData() {
    const headers = new HttpHeaders().set('Authorization', 'Bearer ' + localStorage.getItem('token'));
    const baseUrl = this.configService.getBaseUrl();

    // Recupera e converte a lista de IDs do localStorage para um array de strings
    const listaDeIds = JSON.parse(localStorage.getItem('publicIdsClientesBaixoEstoque') || '[]');

    this.http.get(baseUrl + '/lubvel/cliente', { headers }).subscribe(
      (response: any) => {
        // Mapeia as empresas obtidas na resposta
        this.options = response.data.map((empresa: any) => ({
          nome: empresa.nome + ' - ' + empresa.cnpj,
          publicId: empresa.publicId
        }));

        // Filtra as opções se `filtrarEmpresas` for true
        if (this.filtrarEmpresas && listaDeIds.length > 0) {
          this.filteredOptions = this.options.filter(option => listaDeIds.includes(option.publicId));
        } else {
          this.filteredOptions = this.options;
        }
      },
      error => {
        this.snackBar.open('Erro ao buscar empresas', 'Fechar', {
          duration: 2000,
        });
        console.log(error);
      }
    );
  }


  private _filter(value: string): Empresa[] {
    const filterValue = value.toLowerCase().replace(/\D/g, '');  // Remove todos os caracteres não numéricos

    return this.options.filter(option => {
      const normalizedOption = option.nome.toLowerCase().replace(/\D/g, ''); // Normaliza a opção removendo formatação
      return normalizedOption.includes(filterValue);
    });
  }

  saveEmpresa() {
    const selectedPublicId = this.selectedEmpresaControl.value;

    if (!selectedPublicId) {
      this.snackBar.open('Por favor, selecione uma empresa', 'Fechar', {
        duration: 2000,
      });
      return;
    }


    this.userService.setClienteId(selectedPublicId);
    this.userService.setCompanyName(this.options.find((e) => e.publicId === selectedPublicId)?.nome || '');
    this.router.navigate([`/dashboard`]);
  }

  // gotoNextRoute() {
  //   const selectedPublicId = this.selectedEmpresaControl.value;

  //   if (!selectedPublicId) {
  //     this.snackBar.open('Por favor, selecione uma empresa', 'Fechar', {
  //       duration: 2000,
  //     });
  //     return;
  //   }

  //   if (this.nextRoute) {
  //     localStorage.setItem('cliente_id', selectedPublicId);
  //     const queryParams = this.periodoParam ? { periodo: this.periodoParam } : null

  //     this.router.navigate([`/${this.nextRoute}`], { queryParams: queryParams });
  //   } else {
  //     this.snackBar.open('Rota não definida', 'Fechar', {
  //       duration: 2000,
  //     });
  //   }
  // }
}
