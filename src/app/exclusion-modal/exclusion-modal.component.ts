import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Location } from '@angular/common';
import { ConfigService } from '../services/config.service';


@Component({
  selector: 'app-exclusion-modal',
  templateUrl: './exclusion-modal.component.html',
  styleUrls: ['./exclusion-modal.component.css']
})
export class ExclusionModalComponent implements OnInit {
  publicId!: string;
  controller!: string;
  headers = new HttpHeaders().set('Authorization', 'Bearer ' + localStorage.getItem('token'));
  erro = false;
  errorMessage = '';

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private snackBar: MatSnackBar,
    private location: Location,
    private configService: ConfigService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.publicId = params.get('publicId')!;
      this.controller = params.get('controller')!;
    });
  }

  deleteItem(): void {
    const baseUrl = this.configService.getBaseUrl();
    const apiUrl = `${baseUrl}/lubvel/${this.controller}/${this.publicId}`;

    const cliente_id = localStorage.getItem('cliente_id');
    if(cliente_id){
      this.headers = this.headers.set('user-id', cliente_id);
    }

    this.http.delete(apiUrl, { headers: this.headers }).subscribe(
      () => {
        this.snackBar.open('Item excluído com sucesso.', 'Fechar', {
          duration: 3000,
        });
        this.closeModal();
      },
      (error) => {
        this.snackBar.open('Erro ao excluir item. ' + error.error.message, 'Fechar', {
          duration: 3000,
        });
        console.error('Erro ao excluir item:', error);
        this.erro = true;
        this.errorMessage = error.error.message;
      }
    );
  }

  closeModal(): void {
    this.location.back();
  }
}
