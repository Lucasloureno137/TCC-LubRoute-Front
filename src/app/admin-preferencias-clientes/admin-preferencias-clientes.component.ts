import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ConfigService } from '../services/config.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';

interface ClientePreferencia {
  clienteNome: string;
  clienteCnpj: string;
  clientePublicId: string;
  needConfirmScan: boolean;
  isUpdating?: boolean; // Para controle de loading individual
}

@Component({
  selector: 'app-admin-preferencias-clientes',
  templateUrl: './admin-preferencias-clientes.component.html',
  styleUrl: './admin-preferencias-clientes.component.css'
})
export class AdminPreferenciasClientesComponent implements OnInit, AfterViewInit {
  clientes: ClientePreferencia[] = [];
  dataSource = new MatTableDataSource<ClientePreferencia>([]);
  isLoading: boolean = false;
  displayedColumns: string[] = ['empresa', 'cnpj', 'solicitarScan'];

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private http: HttpClient,
    private configService: ConfigService,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.carregarPreferenciasClientes();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
  }

  carregarPreferenciasClientes(): void {
    this.isLoading = true;

    const headers = new HttpHeaders().set('Authorization', 'Bearer ' + localStorage.getItem('token'));

    const baseUrl = this.configService.getBaseUrl();
    const apiUrl = `${baseUrl}/lubvel/cliente/preferencias/get-confirm-scan-preference/admin`;

    this.http.get(apiUrl, { headers }).subscribe(
      (response: any) => {
        this.isLoading = false;
        if (response.success && response.data) {
          this.clientes = response.data.map((cliente: ClientePreferencia) => ({
            ...cliente,
            isUpdating: false
          }));
          this.dataSource.data = this.clientes;
        }
      },
      (error) => {
        this.isLoading = false;
        console.log('Erro ao carregar preferências dos clientes:', error);
        const errorMessage = error.error?.message || 'Erro ao carregar preferências dos clientes';
        this.snackBar.open(errorMessage, 'Fechar', {
          duration: 5000,
        });
      }
    );
  }

  alterarPreferencia(cliente: ClientePreferencia, novaPreferencia: boolean): void {
    // Marcar cliente como atualizando
    cliente.isUpdating = true;

    const headers = new HttpHeaders()
      .set('Authorization', 'Bearer ' + localStorage.getItem('token'))
      .set('user-id', cliente.clientePublicId);

    const baseUrl = this.configService.getBaseUrl();
    const preference = novaPreferencia ? 'true' : 'false';
    const apiUrl = `${baseUrl}/lubvel/cliente/preferencias/change-confirm-scan-preference/${preference}`;

    this.http.put(apiUrl, {}, { headers }).subscribe(
      (response: any) => {
        cliente.isUpdating = false;
        cliente.needConfirmScan = novaPreferencia;
        
        this.snackBar.open(`Preferência de ${cliente.clienteNome} atualizada com sucesso!`, 'Fechar', {
          duration: 3000,
        });
      },
      (error) => {
        cliente.isUpdating = false;
        
        console.log('Erro ao alterar preferência:', error);
        const errorMessage = error.error?.message || `Erro ao alterar preferência de ${cliente.clienteNome}`;
        this.snackBar.open(errorMessage, 'Fechar', {
          duration: 5000,
        });
        
        // Reverter a alteração visual se falhou
        // O Angular Material já vai manter o valor anterior se não atualizarmos a propriedade
      }
    );
  }
}
