import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ConfigService } from '../services/config.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-redefinir-senha',
  templateUrl: './redefinir-senha.component.html',
  styleUrls: ['./redefinir-senha.component.css']
})
export class RedefinirSenhaComponent implements OnInit {

  redefinirSenhaForm!: FormGroup;
  hidePassword = true;
  erroEncontrado = false;
  errorMessage = 'Não foi possível recuperar sua senha';
  token!: string;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private http: HttpClient,
    private router: Router,
    private configService: ConfigService,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    // Inicializa o formulário de redefinição de senha
    this.redefinirSenhaForm = this.fb.group({
      novaSenha: ['', [Validators.required]],
      confirmaSenha: ['', [Validators.required]]
    });

    // Obtém o token da query param
    this.route.queryParams.subscribe(params => {
      this.token = params['token'];
      if (!this.token) {
        this.setSnackbarMessage('Token inválido');
        this.router.navigate(['/app-login']);
      }
    });
  }

  togglePasswordVisibility(): void {
    this.hidePassword = !this.hidePassword;
  }

  onSubmit(event: Event): void {
    event.preventDefault();
    if (this.redefinirSenhaForm.valid) {
      const novaSenha = this.redefinirSenhaForm.value.novaSenha;
      const confirmaSenha = this.redefinirSenhaForm.value.confirmaSenha;

      const senhaForte = this.validarSenhaForte(novaSenha);
      if (!senhaForte) {
        this.erroEncontrado = true;
        this.errorMessage = 'A senha deve conter ao menos uma letra maiúscula, um número, um caractere especial (!@#$%^&*()+-), no mínimo 6 caracteres e não pode conter 123 ou abc.';
        //aguardar 6 segundos e limpar a mensagem de erro
        setTimeout(() => {
          this.erroEncontrado = false;
          this.errorMessage = '';
        }, 5000);
        return;
      }

      if (novaSenha !== confirmaSenha) {
        this.erroEncontrado = true;
        this.errorMessage = 'As senhas não correspondem';
        return;
      }

      // Realiza a requisição de redefinição de senha
      const baseUrl = this.configService.getBaseUrl();

      const body = { token: this.token, senha: novaSenha };

      let url = baseUrl + '/lubvel/redefinir-senha';
      this.http.post(url, body)
        .subscribe({
          next: (response) => {
            // Redireciona para o dashboard em caso de sucesso
            this.router.navigate(['/app-login']);
            this.setSnackbarMessage('Sua senha foi redefinida com sucesso');
          },
          error: (error) => {
            // Exibe a mensagem de erro se a requisição falhar
            this.erroEncontrado = true;
            this.errorMessage = 'Não foi possível recuperar sua senha';
          }
        });
    }
  }

  setSnackbarMessage(message: string) {
    this.snackBar.open(message, 'Fechar', { duration: 20000 });
  }

  validarSenhaForte(senha: string): boolean {
    const regex = /^(?=.*[A-Z])(?=.*[!@#$%^&*()+-])(?=.*\d)(?=.{6,})(?!.*(123|abc))/;
    return regex.test(senha);
  }
}
