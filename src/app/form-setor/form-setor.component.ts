import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Location } from '@angular/common';
import { ConfigService } from '../services/config.service';
import { BreadcrumbItem } from '../breadcrumb/breadcrumb.component';

@Component({
  selector: 'app-form-setor',
  templateUrl: './form-setor.component.html',
  styleUrl: './form-setor.component.css'
})
export class FormSetorComponent implements OnInit {

  isLoading = false;
  headers = new HttpHeaders().set('Authorization', 'Bearer ' + localStorage.getItem('token'));
  setorId: string = "";
  descricao: string = "";
  isUpdate: boolean = false;

  breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Cadastro', },
    { label: 'Setores', route: '/app-setores-cliente' },
    { label: 'Novo Setor', active: true }
  ];

  constructor(private http: HttpClient,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar,
    private location: Location,
    private configService: ConfigService,
    private router: Router,
  ) { }

  ngOnInit(): void {

    this.route.paramMap.subscribe(params => {

      const descricaoParam = params.get('descricao');
      const setorId = params.get('setor_id');

      if (descricaoParam && setorId) {
        this.setorId = setorId;
        this.descricao = descricaoParam;
        this.isUpdate = true;
      } else {
        this.isUpdate = false;
      }
    });
  }

  enviarFormulario(): void {
    this.isLoading = true;
    const cliente_id = localStorage.getItem('cliente_id');
    if (cliente_id) {
      this.headers = this.headers.set('user-id', cliente_id);
    }

    const baseUrl = this.configService.getBaseUrl();

    const apiUrl = this.isUpdate
      ? `${baseUrl}/lubvel/setor/${this.setorId}`
      : baseUrl + '/lubvel/setor';

    const request = this.isUpdate
      ? this.http.put(apiUrl, {
        nome: this.descricao
      }, { headers: this.headers })
      : this.http.post(apiUrl, {
        nome: this.descricao,
      }, { headers: this.headers });

    request.subscribe(
      (response) => {
        this.snackBar.open('Sucesso.', 'Fechar', {
          duration: 3000,
        });
        if (this.isUpdate) {
          this.isLoading = false;
        } else {
          this.isLoading = false;
          this.descricao = "";
        }
        this.isLoading = false;
        this.router.navigate(['/app-setores-cliente']);
      },
      (error) => {
        console.error('Erro ao enviar formulário:', error);
        this.isLoading = false;
      }
    );
  }
}
