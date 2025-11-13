import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ConfigService } from '../services/config.service';
import { BreadcrumbItem } from '../breadcrumb/breadcrumb.component';

interface Setor {
  publicId: string;
  nome: string;
}

@Component({
  selector: 'app-form-equipamento',
  templateUrl: './form-equipamento.component.html',
  styleUrls: ['./form-equipamento.component.css']
})
export class FormEquipamentoComponent implements OnInit {
  setores: Setor[] = [];
  descricao: string = '';
  setorSelecionado: string = '';
  tag: string = '';
  isUpdate: boolean = false;
  isLoading: boolean = false;
  setorId: string | null = null;
  equipamentoId: string | null = null;

  breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Dashboard', route: '/dashboard' },
    { label: 'Equipamentos', route: '/app-equipamentos-cliente' },
    { label: 'Novo Equipamento', active: true }
  ];

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar,
    private configService: ConfigService
  ) { }

  ngOnInit(): void {
    this.loadSectors();
    this.checkRouteParams();
  }

  checkRouteParams(): void {
    this.route.paramMap.subscribe(params => {
      this.setorId = params.get('id_setor');
      this.equipamentoId = params.get('id_eqp');
      const descricaoParam = params.get('descricao');
      const tagParam = params.get('tag');

      if (this.setorId && this.equipamentoId && descricaoParam && tagParam) {
        this.descricao = descricaoParam;
        this.setorSelecionado = this.setorId;
        this.tag = tagParam;
        this.isUpdate = true;
      } else {
        this.isUpdate = false;
      }
    });
  }

  loadSectors(): void {
    this.isLoading = true;

    let headers = new HttpHeaders().set('Authorization', 'Bearer ' + localStorage.getItem('token'));
    const cliente_id = localStorage.getItem('cliente_id');
    if (cliente_id) {
      headers = headers.set('user-id', cliente_id);
    }

    const baseUrl = this.configService.getBaseUrl();
    const apiUrl = `${baseUrl}/lubvel/setor`;

    this.http.get(apiUrl, { headers }).subscribe(
      (response: any) => {
        this.setores = response.data || [];
        this.isLoading = false;
      },
      error => {
        console.error('Erro ao buscar setores:', error);
        this.showError('Erro ao carregar setores');
        this.setores = [];
        this.isLoading = false;
      }
    );
  }

  onSetorChange(value: string): void {
    this.setorSelecionado = value;
  }

  onSubmit(): void {
    if (!this.isFormValid()) {
      this.showError('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    this.isLoading = true;

    let headers = new HttpHeaders().set('Authorization', 'Bearer ' + localStorage.getItem('token'));
    const cliente_id = localStorage.getItem('cliente_id');
    if (cliente_id) {
      headers = headers.set('user-id', cliente_id);
    }

    const baseUrl = this.configService.getBaseUrl();
    const apiUrl = this.isUpdate
      ? `${baseUrl}/lubvel/equipamentos/${this.equipamentoId}`
      : `${baseUrl}/lubvel/equipamentos`;

    const payload = {
      descricao: this.descricao.trim(),
      idSetor: this.setorSelecionado,
      tag: this.tag.trim()
    };

    const request = this.isUpdate
      ? this.http.put(apiUrl, payload, { headers })
      : this.http.post(apiUrl, payload, { headers });

    request.subscribe(
      response => {
        this.isLoading = false;
        const successMessage = this.isUpdate
          ? 'Equipamento atualizado com sucesso!'
          : 'Equipamento cadastrado com sucesso!';

        this.snackBar.open(successMessage, 'Fechar', {
          duration: 3000,
        });

        this.router.navigate(['/app-equipamentos-cliente']);
      },
      error => {
        this.isLoading = false;
        console.error('Erro ao enviar formulário:', error);
        const errorMessage = error.error?.message || 'Erro ao salvar equipamento';
        this.showError(errorMessage);
      }
    );
  }

  onCancel(): void {
    this.router.navigate(['/app-equipamentos-cliente']);
  }

  clearForm(): void {
    this.descricao = '';
    this.setorSelecionado = '';
    this.tag = '';
  }

  isFormValid(): boolean {
    return this.descricao.trim() !== '' &&
      this.setorSelecionado !== '' &&
      this.tag.trim() !== '';
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Fechar', {
      duration: 5000,
    });
  }
}