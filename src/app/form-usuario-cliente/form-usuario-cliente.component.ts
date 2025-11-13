import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ConfigService } from '../services/config.service';
import { BreadcrumbItem } from '../breadcrumb/breadcrumb.component';
import { Router } from '@angular/router';


@Component({
  selector: 'app-form-usuario-cliente',
  templateUrl: './form-usuario-cliente.component.html',
  styleUrl: './form-usuario-cliente.component.css'
})
export class FormUsuarioClienteComponent implements OnInit {

  headers = new HttpHeaders().set('Authorization', 'Bearer ' + localStorage.getItem('token'));
  usuario: any;

  invalidCpf = false;
  invalidEmail = false;
  isEdit = false;

  breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Cadastros', },
    { label: 'Novo Usuario', active: true }
  ];


  constructor(private http: HttpClient,
    private snackBar: MatSnackBar,
    private configService: ConfigService,
    private router: Router,
  ) { }

  ngOnInit(): void {
    this.cleanData();
    //recuperar os patch param id_usuario se existir significa que é edição
    const url = window.location.href;
    const urlSplit = url.split('/');
    const id_usuario = urlSplit[urlSplit.length - 1];
    if (id_usuario && id_usuario !== 'app-form-usuario-cliente') {
      this.isEdit = true;
      this.loadUsuario(id_usuario);
    }

  }

  loadUsuario(id_usuario: string) {
    const baseUrl = this.configService.getBaseUrl();
    const apiUrl = `${baseUrl}/lubvel/usuario-cliente/${id_usuario}`;

    const cliente_id = localStorage.getItem('cliente_id');
    if (cliente_id) {
      this.headers = this.headers.set('user-id', cliente_id);
    }

    const request = this.http.get(apiUrl, { headers: this.headers });

    request.subscribe(
      (response: any) => {
        this.usuario = response.data;
        // inclui mascara no cpf
        this.mascaraCpf();
      },
      (error) => {
        this.snackBar.open('Erro ao carregar usuario: ' + error.error.message, 'Fechar', {
          duration: 3000,
        });
      }
    );
  }

  cleanData(): void {
    this.usuario = {
      nome: '',
      cpf: '',
      email: '',
      endereco: ''
    };
  }


  verificarEmail(): void {
    const email = this.usuario.email || '';

    const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    this.invalidEmail = !regex.test(email);

  }

  mascaraCpf(): void {
    let cpf = this.usuario.cpf || '';

    cpf = cpf.replace(/\D/g, ''); // Remove tudo o que não é dígito

    if (cpf.length !== 11) {
      this.invalidCpf = true;
    } else {
      this.invalidCpf = false;
    }

    // Aplica a máscara XXX.XXX.XXX-XX
    if (cpf.length > 3) {
      cpf = cpf.slice(0, 3) + '.' + cpf.slice(3);
    }
    if (cpf.length > 7) {
      cpf = cpf.slice(0, 7) + '.' + cpf.slice(7);
    }
    if (cpf.length > 11) {
      cpf = cpf.slice(0, 11) + '-' + cpf.slice(11);
    }

    this.usuario.cpf = cpf;
  }


  enviarFormulario(): void {
    if (this.isEdit) {
      this.putData();
    } else {
      this.postData();
    }
  }

  postData(): void {

    //verifica se todos campos estão preenchidos
    if (!this.usuario.nome || !this.usuario.cpf || !this.usuario.email || !this.usuario.endereco) {
      this.snackBar.open('Preencha todos os campos.', 'Fechar', {
        duration: 3000,
      });
      return;
    }

    if (this.invalidEmail || this.invalidCpf) {
      this.snackBar.open('Verifique os campos.', 'Fechar', {
        duration: 3000,
      });
      return;
    }

    //formatar email lowercase
    this.usuario.email = this.usuario.email.toLowerCase();

    // formta cpf removendo caracteres especiais, deixando apenas numeros
    this.usuario.cpf = this.usuario.cpf.replace(/\D/g, ''); // Remove tudo o que não é dígito

    const baseUrl = this.configService.getBaseUrl();

    const apiUrl = `${baseUrl}/lubvel/usuario-cliente`;

    const bodyRequest = this.usuario;

    const request = this.http.post(apiUrl, bodyRequest, { headers: this.headers });

    request.subscribe(
      (response) => {
        this.snackBar.open('Sucesso.', 'Fechar', {
          duration: 3000,
        });
        this.cleanData();
        this.router.navigate(['app-lista-usuarios-cliente']);
      },
      (error) => {
        this.snackBar.open('Erro ao criar usuario: ' + error.error.message, 'Fechar', {
          duration: 3000,
        });
      }
    );
  }

  putData(): void {

    //verifica se todos campos estão preenchidos
    if (!this.usuario.nome || !this.usuario.cpf || !this.usuario.email || !this.usuario.endereco) {
      this.snackBar.open('Preencha todos os campos.', 'Fechar', {
        duration: 3000,
      });
      return;
    }

    if (this.invalidEmail || this.invalidCpf) {
      this.snackBar.open('Verifique os campos.', 'Fechar', {
        duration: 3000,
      });
      return;
    }

    //formatar email lowercase
    this.usuario.email = this.usuario.email.toLowerCase();

    // formta cpf removendo caracteres especiais, deixando apenas numeros
    this.usuario.cpf = this.usuario.cpf.replace(/\D/g, ''); // Remove tudo o que não é dígito

    const baseUrl = this.configService.getBaseUrl();

    const apiUrl = `${baseUrl}/lubvel/usuario-cliente`;

    const bodyRequest = this.usuario;

    const request = this.http.put(apiUrl, bodyRequest, { headers: this.headers });

    request.subscribe(
      (response) => {
        this.snackBar.open('Atulizado com sucesso.', 'Fechar', {
          duration: 3000,
        });
        this.cleanData();
        this.isEdit = false;
        this.router.navigate(['app-lista-usuarios-cliente']);
      },
      (error) => {
        this.snackBar.open('Erro ao atualizar usuario: ' + error.error.message, 'Fechar', {
          duration: 3000,
        });
      }
    );
  }
}
