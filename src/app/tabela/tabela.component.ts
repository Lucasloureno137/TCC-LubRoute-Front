import { Component, EventEmitter, Input, OnInit, Output, ViewChild, AfterViewInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatSnackBar } from '@angular/material/snack-bar';


@Component({
  selector: 'app-tabela',
  templateUrl: './tabela.component.html',
  styleUrls: ['./tabela.component.css'],
})
export class TabelaComponent implements OnInit, AfterViewInit {
  alertaExecutado() {
    this.snackBar.open('Operação já executada, não é possível selecionar', 'Fechar', {
      duration: 2000,
    });
  }

  recuperaCast(raw_value: string) {
    const index = this.displayedColumns.indexOf(raw_value);
    return this.displayedColumnsCast[index];
  }

  @ViewChild('input') input: any;
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  private _dataLayer: any[] = [];
  selectedRow: any;

  @Input() set dataLayer(value: any[]) {
    this._dataLayer = value;
    this.dataSource.data = value;
  }

  get dataLayer(): any[] {
    return this._dataLayer;
  }

  @Input() displayedColumns: string[] = [];
  @Input() displayedColumnsCast: string[] = [];
  @Input() allowFilter: boolean = true;
  dataSource = new MatTableDataSource<any>();

  @Output() rowSelected = new EventEmitter<any>();

  selectedRowIndex: any = null;

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  constructor(private snackBar: MatSnackBar) {}

  ngOnInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  onRowClicked(row: any) {

    if (this.selectedRowIndex === row) {
      this.selectedRowIndex = null;
      this.rowSelected.emit(null);
    } else {
      this.selectedRowIndex = row;
      this.rowSelected.emit(row);
    }
  }

  clearFilter(){
    this.dataSource.filter = '';
    if (this.input) {
      this.input.nativeElement.value = '';
    }
  }

  isExpired(descricao: string) {
    if (!descricao) {
      return false;
    }
    return descricao.includes('Atrasado');
  }
}
