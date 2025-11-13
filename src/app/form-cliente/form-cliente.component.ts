import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ConfigService } from '../services/config.service';
import { BreadcrumbItem } from '../breadcrumb/breadcrumb.component';

@Component({
  selector: 'app-form-cliente',
  templateUrl: './form-cliente.component.html',
  styleUrl: './form-cliente.component.css'
})
export class FormClienteComponent implements OnInit {

  headers = new HttpHeaders().set('Authorization', 'Bearer ' + localStorage.getItem('token'));
  cliente: any;

  invalidCnpj = false;
  invalidEmail = false;
  isEdit = false;

  breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Cadastros', },
    { label: 'Cadastrar Cliente', active: true }
  ];


  constructor(private http: HttpClient,
    private snackBar: MatSnackBar,
    private configService: ConfigService
  ) { }

  ngOnInit(): void {
    this.cleanData();
    //recuperar os patch param id_usuario se existir significa que é edição
    const url = window.location.href;
    const urlSplit = url.split('/');
    const id_usuario = urlSplit[urlSplit.length - 1];
    if (id_usuario && id_usuario !== 'app-form-cliente') {
      this.isEdit = true;
      this.loadCliente(id_usuario);
    }

  }

  loadCliente(id_usuario: string) {
    const baseUrl = this.configService.getBaseUrl();
    const apiUrl = `${baseUrl}/lubvel/cliente/${id_usuario}`;
    const request = this.http.get(apiUrl, { headers: this.headers });

    request.subscribe(
      (response: any) => {
        this.cliente = response.data;
      },
      (error) => {
        this.snackBar.open('Erro ao carregar cliente: ' + error.error.message, 'Fechar', {
          duration: 3000,
        });
      }
    );
  }

  cleanData(): void {
    this.cliente = {
      nome: '',
      cnpj: '',
      email: '',
      endereco: ''
    };
  }


  verificarEmail(): void {
    const email = this.cliente.email || '';

    const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    this.invalidEmail = !regex.test(email);

  }

  mascaraCnpj(): void {
    let cnpj = this.cliente.cnpj || '';

    cnpj = cnpj.replace(/\D/g, '');

    if (cnpj.length !== 14) {
      this.invalidCnpj = true;
    } else if (cnpj.length === 14) {
      this.invalidCnpj = false;
    }

    if (cnpj.length > 2) {
      cnpj = cnpj.slice(0, 2) + '.' + cnpj.slice(2);
    }
    if (cnpj.length > 6) {
      cnpj = cnpj.slice(0, 6) + '.' + cnpj.slice(6);
    }
    if (cnpj.length > 10) {
      cnpj = cnpj.slice(0, 10) + '/' + cnpj.slice(10);
    }
    if (cnpj.length > 15) {
      cnpj = cnpj.slice(0, 15) + '-' + cnpj.slice(15);
    }

    this.cliente.cnpj = cnpj;
  }

  enviarFormulario(): void {

    // verifica tamanho do nome max 65
    if (this.cliente.nome.length > 65) {
      this.snackBar.open('Nome deve ter no máximo 65 caracteres.', 'Fechar', {
        duration: 3000,
      });
      return;
    }

    if (this.isEdit) {
      this.putData();
    } else {
      this.postData();
    }
  }

  postData(): void {

    //verifica se todos campos estão preenchidos
    if (!this.cliente.nome || !this.cliente.cnpj || !this.cliente.email || !this.cliente.endereco) {
      this.snackBar.open('Preencha todos os campos.', 'Fechar', {
        duration: 3000,
      });
      return;
    }

    if (this.invalidEmail || this.invalidCnpj) {
      this.snackBar.open('Verifique os campos.', 'Fechar', {
        duration: 3000,
      });
      return;
    }

    //formatar email lowercase
    this.cliente.email = this.cliente.email.toLowerCase();

    const baseUrl = this.configService.getBaseUrl();

    const apiUrl = `${baseUrl}/lubvel/cliente`;

    const bodyRequest = this.cliente;

    const request = this.http.post(apiUrl, bodyRequest, { headers: this.headers });

    request.subscribe(
      (response) => {
        this.snackBar.open('Sucesso.', 'Fechar', {
          duration: 3000,
        });
        this.cleanData();
      },
      (error) => {
        this.snackBar.open('Erro ao criar cliente: ' + error.error.message, 'Fechar', {
          duration: 3000,
        });
      }
    );
  }

  putData(): void {

    //verifica se todos campos estão preenchidos
    if (!this.cliente.nome || !this.cliente.cnpj || !this.cliente.email || !this.cliente.endereco) {
      this.snackBar.open('Preencha todos os campos.', 'Fechar', {
        duration: 3000,
      });
      return;
    }

    if (this.invalidEmail || this.invalidCnpj) {
      this.snackBar.open('Verifique os campos.', 'Fechar', {
        duration: 3000,
      });
      return;
    }

    //formatar email lowercase
    this.cliente.email = this.cliente.email.toLowerCase();

    const baseUrl = this.configService.getBaseUrl();

    const apiUrl = `${baseUrl}/lubvel/cliente/${this.cliente.publicId}`;

    const bodyRequest = this.cliente;

    const request = this.http.put(apiUrl, bodyRequest, { headers: this.headers });

    request.subscribe(
      (response) => {
        this.snackBar.open('Atulizado com sucesso.', 'Fechar', {
          duration: 3000,
        });
        this.cleanData();
        this.isEdit = false;
      },
      (error) => {
        this.snackBar.open('Erro ao criar cliente: ' + error.error.message, 'Fechar', {
          duration: 3000,
        });
      }
    );
  }
}
