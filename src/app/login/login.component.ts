import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FormGroup, FormControl, Validators, FormBuilder } from '@angular/forms';

import { Router } from '@angular/router';
import { ConfigService } from '../services/config.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { UserService } from '../services/user.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup = new FormGroup({});
  erroEncontrado = false;
  errorMessage = '';
  primeiroAcesso: boolean = false;
  requestAdmin = false;
  modoNaoSelecionado = true;
  hidePassword = true;
  esqueceuSenha = false;


  constructor(private http: HttpClient,
    private router: Router,
    private fb: FormBuilder,
    private configService: ConfigService,
    private userService: UserService,
    private snackBar: MatSnackBar) { }

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
      novaSenha: [''],
      confirmaNovaSenha: ['']
    });

    this.erroEncontrado = false;
    this.errorMessage = '';
    this.primeiroAcesso = false;

    localStorage.clear();

    const url = this.router.url;

    // Verifique se a URL termina com 'app-login-admin'
    if (url.endsWith('app-login-admin')) {
      this.requestAdmin = true;
      this.modoNaoSelecionado = false;
    }
  }

  mostrarEsqueciSenha() {
    this.esqueceuSenha = !this.esqueceuSenha;
  }

  recuperarSenha() {
    const esqueciSenhaBody = {
      email: this.loginForm.get('email')?.value.toLowerCase(),
      isAdmin: this.requestAdmin
    };

    const baseUrl = this.configService.getBaseUrl();
    this.http.post(baseUrl + '/lubvel/esqueci-senha', esqueciSenhaBody).subscribe(
      (response: any) => {
        this.notificarEnvioEmail();
      },
      error => {
        this.notificarEnvioEmail();
      }
    );
  }

  notificarEnvioEmail() {
    this.erroEncontrado = false;
    this.errorMessage = '';
    this.esqueceuSenha = false;

    //redefinir formulario
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
      novaSenha: [''],
      confirmaNovaSenha: ['']
    });

    this.setSnackbarMessage('Se o email informado estiver cadastrado, um email será enviado com as instruções para redefinir a senha.');
  }

  redirecionaCliente() {
    this.requestAdmin = false;
    this.modoNaoSelecionado = false;
  }

  redirecionaAdmin() {
    this.modoNaoSelecionado = false;
    this.requestAdmin = true;
  }


  onSubmit(event: Event) {
    event.preventDefault();
    if (this.loginForm.valid) {
      const loginData = {
        clienteEmail: this.loginForm.get('email')?.value.toLowerCase(),
        password: this.loginForm.get('password')?.value,
        requestAdmin: this.requestAdmin
      };
      const baseUrl = this.configService.getBaseUrl();

      this.http.post(baseUrl + '/lubvel/login', loginData).subscribe(
        (response: any) => {
          this.erroEncontrado = false;
          this.errorMessage = '';
          this.primeiroAcesso = response.data.firstAccess;
          this.armazenarToken(response);
          if (!this.primeiroAcesso) {
            if (response.data.admin) {
              // deixa no session storage isAdmin como true
              this.userService.updateIsAdmin(true);
              this.userService.updateUserName(response.data.nomeUsuario);


              this.router.navigate(['/admin/app-selecionar-empresa']);
            } else {

              // deixa no session storage isAdmin como false
              this.userService.updateIsAdmin(false);
              this.userService.updateUserName(response.data.nomeUsuario);

              if (response.data.userCliente) {
                localStorage.setItem('cliente_id', response.data.codigoEmpresa)
              }
              if (response.data.userManager) {
                this.userService.updateIsUserManager('true');
              } else {
                this.userService.updateIsUserManager('false');
              }

              this.router.navigate(['/dashboard']);
            }
          }
        },
        error => {
          this.erroEncontrado = true;
          this.errorMessage = error.error.message;
        }
      );
    } else {
      this.erroEncontrado = true;
      this.errorMessage = 'Preencha os campos corretamente.';
    }
  }

  alterarSenha() {

    const senhaForte = this.validarSenhaForte(this.loginForm.get('novaSenha')?.value);
    if (!senhaForte) {
      this.setSnackbarMessage('A senha deve conter ao menos uma letra maiúscula, um número, um caractere especial (!@#$%^&*()+-), no mínimo 6 caracteres e não pode conter 123 ou abc.');
      return;
    }

    if (this.loginForm.get('novaSenha')?.value !== this.loginForm.get('confirmaNovaSenha')?.value) {
      this.setSnackbarMessage('A nova senha e a confirmação de nova senha não correspondem.');
      return;
    }

    // Nova validação: nova senha não pode ser igual à senha atual
    if (this.loginForm.get('novaSenha')?.value === this.loginForm.get('password')?.value) {
      this.setSnackbarMessage('A nova senha não pode ser igual à senha atual.');
      return;
    }

    const alteracaoSenhaData = {
      clienteEmail: this.loginForm.get('email')?.value.toLowerCase(),
      password: this.loginForm.get('password')?.value,
      novaSenha: this.loginForm.get('novaSenha')?.value
    };

    const headers = new HttpHeaders().set('Authorization', 'Bearer ' + localStorage.getItem('token'));
    const baseUrl = this.configService.getBaseUrl();
    this.http.post(baseUrl + '/lubvel/alterar-senha', alteracaoSenhaData, { headers }).subscribe(
      (response: any) => {
        this.erroEncontrado = false;
        this.errorMessage = '';
        this.armazenarToken(response);
        // Verifica se é admin ou cliente
        if (response.data.admin) {
          this.userService.updateIsAdmin(true);
          this.userService.updateUserName(response.data.nomeUsuario);

          this.primeiroAcesso = false;
        } else {
          this.userService.updateIsAdmin(false);
          this.userService.updateUserName(response.data.nomeUsuario);
          if (response.data.userCliente) {
            localStorage.setItem('cliente_id', response.data.codigoEmpresa);
          }
          if (response.data.userManager) {
            this.userService.updateIsUserManager('true');
          } else {
            this.userService.updateIsUserManager('false');
          }

          this.primeiroAcesso = false;
        }
      },
      error => {
        this.setSnackbarMessage(error.error.message);
      }
    );
  }

  setSnackbarMessage(message: string) {
    this.snackBar.open(message, 'Fechar', { duration: 10000 });
  }


  validarSenhaForte(senha: string): boolean {
    const regex = /^(?=.*[A-Z])(?=.*[!@#$%^&*()+-])(?=.*\d)(?=.{6,})(?!.*(123|abc))/;
    return regex.test(senha);
  }

  armazenarToken(token: any) {
    localStorage.setItem('token', token.data.token);
  }

  togglePasswordVisibility() {
    this.hidePassword = !this.hidePassword;
  }
}
