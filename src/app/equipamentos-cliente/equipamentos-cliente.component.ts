import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { ConfigService } from '../services/config.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BreadcrumbItem } from '../breadcrumb/breadcrumb.component';

interface Equipamento {
  id: number;
  tag: string;
  descricao: string;
  setor: string;
  publicId: string;
  setorPublicId: string;
}

@Component({
  selector: 'app-equipamentos-cliente',
  templateUrl: './equipamentos-cliente.component.html',
  styleUrls: ['./equipamentos-cliente.component.css']
})
export class EquipamentosClienteComponent implements OnInit {
  equipamentos: Equipamento[] = [];
  filteredEquipamentos: Equipamento[] = [];
  searchQuery: string = '';
  currentPage: number = 1;
  itemsPerPage: number = 9;
  totalPages: number = 0;
  selectedEquipamento: Equipamento | null = null;
  setorSelecionado: string = '';
  setores: any[] = [];

  breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Cadastros', route: '/cadastros' },
    { label: 'Equipamentos', active: true }
  ];

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient, 
    private router: Router, 
    private configService: ConfigService, 
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.fetchSetores();
    this.loadEquipamentos();
  }

  loadEquipamentos(): void {
    let headers = new HttpHeaders().set('Authorization', 'Bearer ' + localStorage.getItem('token'));
    const cliente_id = localStorage.getItem('cliente_id');
    if(cliente_id){
      headers = headers.set('user-id', cliente_id);
    }
    const baseUrl = this.configService.getBaseUrl();
    
    this.http.get(baseUrl + '/lubvel/equipamentos', { headers }).subscribe(
      (response: any) => {
        this.equipamentos = response.data.map((item: any, index: number) => ({
          id: index + 1,
          tag: item.tag,
          descricao: item.descricao,
          setor: item.setor,
          publicId: item.publicId,
          setorPublicId: item.setorPublicId
        }));
        this.applyFilter();
      },
      error => {
        console.log(error);
        this.snackBar.open('Erro ao carregar equipamentos', 'Fechar', {
          duration: 3000,
        });
      }
    );
  }

  fetchSetores(): void {
    let headers = new HttpHeaders().set('Authorization', 'Bearer ' + localStorage.getItem('token'));
    const cliente_id = localStorage.getItem('cliente_id');
    if(cliente_id){
      headers = headers.set('user-id', cliente_id);
    }
    const baseUrl = this.configService.getBaseUrl();
    
    this.http.get(baseUrl + '/lubvel/setor', { headers }).subscribe(
      (response: any) => {
        this.setores = response.data;
      },
      error => {
        console.log(error);
      }
    );
  }

  onSearch(): void {
    this.currentPage = 1;
    this.applyFilter();
  }

  onSetorChange(setorPublicId: string): void {
    this.setorSelecionado = setorPublicId;
    this.currentPage = 1;
    this.applyFilter();
  }

  applyFilter(): void {
    let filtered = [...this.equipamentos];

    if (this.setorSelecionado) {
      filtered = filtered.filter(equip => equip.setorPublicId === this.setorSelecionado);
    }

    if (this.searchQuery.trim()) {
      filtered = filtered.filter(equip => 
        equip.tag.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        equip.descricao.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        equip.setor.toLowerCase().includes(this.searchQuery.toLowerCase())
      );
    }

    this.filteredEquipamentos = filtered.map((item, index) => ({
      ...item,
      id: index + 1
    }));
    
    this.updatePagination();
  }

  limparFiltro() {
    this.setorSelecionado = '';
    this.searchQuery = '';
    this.loadEquipamentos();
  }

  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredEquipamentos.length / this.itemsPerPage);
  }

  getPaginatedEquipamentos(): Equipamento[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.filteredEquipamentos.slice(start, end);
  }

  onPageChange(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(this.totalPages, start + maxVisible - 1);
    
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }

  onAddEquipamento(): void {
    this.router.navigate(['/app-form-equipamento']);
  }

  onEditEquipamento(): void {
    if (!this.selectedEquipamento) {
      this.showError('Selecione um equipamento primeiro');
      return;
    }
    this.router.navigate([`/app-form-equipamento/${this.selectedEquipamento.publicId}/${this.selectedEquipamento.setorPublicId}/${this.selectedEquipamento.descricao}/${this.selectedEquipamento.tag}`]);
  }

  onDeleteEquipamento(): void {
    if (!this.selectedEquipamento) {
      this.showError('Selecione um equipamento primeiro');
      return;
    }
    
    this.router.navigate([`/app-exclusion-modal/${this.selectedEquipamento.publicId}/equipamentos`]);
  }

  onAddPontoLubrificacao(): void {
    if (!this.selectedEquipamento) {
      this.showError('Selecione um equipamento primeiro');
      return;
    }
    
    this.router.navigate([`/app-form-pt-manutencao/${this.selectedEquipamento.publicId}`]);
  }

  onViewPontosLubrificacao(): void {
    if (!this.selectedEquipamento) {
      this.showError('Selecione um equipamento primeiro');
      return;
    }
    
    this.router.navigate([`/app-pt-manutencao/${this.selectedEquipamento.setorPublicId}/${this.selectedEquipamento.publicId}`]);
  }

  onViewQRCode(): void {
    if (!this.selectedEquipamento) {
      this.showError('Selecione um equipamento primeiro');
      return;
    }
    
    this.router.navigate([`/app-qr-code/equipamento/${this.selectedEquipamento.tag}/${this.selectedEquipamento.descricao}`]);
  }

  onRowClick(equipamento: Equipamento): void {
    this.selectedEquipamento = this.selectedEquipamento === equipamento ? null : equipamento;
  }

  isSelected(equipamento: Equipamento): boolean {
    return this.selectedEquipamento === equipamento;
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Fechar', {
      duration: 3000,
    });
  }
}