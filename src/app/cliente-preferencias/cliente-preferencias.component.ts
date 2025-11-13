import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { ConfigService } from '../services/config.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BreadcrumbItem } from '../breadcrumb/breadcrumb.component';

@Component({
  selector: 'app-cliente-preferencias',
  templateUrl: './cliente-preferencias.component.html',
  styleUrls: ['./cliente-preferencias.component.css']
})
export class ClientePreferenciasComponent implements OnInit {
  confirmScanPreference: boolean = true;
  isLoading: boolean = false;

  breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Dashboard', route: '/dashboard' },
    { label: 'Configurações', active: true }
  ];

  constructor(
    private http: HttpClient,
    private router: Router,
    private configService: ConfigService,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.loadPreferences();
  }

  onSave(): void {
    this.isLoading = true;

    let headers = new HttpHeaders().set('Authorization', 'Bearer ' + localStorage.getItem('token'));
    const cliente_id = localStorage.getItem('cliente_id');
    if (cliente_id) {
      headers = headers.set('user-id', cliente_id);
    }

    const baseUrl = this.configService.getBaseUrl();
    const preference = this.confirmScanPreference ? 'true' : 'false';
    const apiUrl = `${baseUrl}/lubvel/cliente/preferencias/change-confirm-scan-preference/${preference}`;

    this.http.put(apiUrl, {}, { headers }).subscribe(
      (response: any) => {
        this.isLoading = false;
        this.snackBar.open('Preferência salva com sucesso!', 'Fechar', {
          duration: 3000,
        });
        setTimeout(() => {
          this.router.navigate(['/dashboard']);
        }, 1500);
      },
      error => {
        this.isLoading = false;
        const errorMessage = error.error?.message || 'Erro ao salvar preferência';
        this.snackBar.open(errorMessage, 'Fechar', {
          duration: 5000,
        });
      }
    );
  }

  loadPreferences(): void {
    this.isLoading = true;

    let headers = new HttpHeaders().set('Authorization', 'Bearer ' + localStorage.getItem('token'));
    const cliente_id = localStorage.getItem('cliente_id');
    if (cliente_id) {
      headers = headers.set('user-id', cliente_id);
    }
    
    const baseUrl = this.configService.getBaseUrl();
    const apiUrl = `${baseUrl}/lubvel/cliente/preferencias/get-confirm-scan-preference`;
    
    this.http.get(apiUrl, { headers }).subscribe(
      (response: any) => {
        this.isLoading = false;
        this.confirmScanPreference = response.data === true;
      },
      error => {
        this.isLoading = false;
        console.log('Erro ao carregar preferência:', error);
        const errorMessage = error.error?.message || 'Erro ao carregar preferência. Usando configuração padrão.';
        this.snackBar.open(errorMessage, 'Fechar', {
          duration: 3000,
        });
      }
    );
  }
}