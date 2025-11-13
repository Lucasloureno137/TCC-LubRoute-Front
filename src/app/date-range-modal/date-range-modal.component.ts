import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-date-range-modal',
  templateUrl: './date-range-modal.component.html',
  styleUrls: ['./date-range-modal.component.css']
})
export class DateRangeModalComponent {
  startDate: Date | null = null;
  endDate: Date | null = null;

  constructor(public dialogRef: MatDialogRef<DateRangeModalComponent>) {}

  // Verifica se ambas as datas estão preenchidas
  isDateRangeValid(): boolean {
    return !!this.startDate && !!this.endDate;
  }

  // Confirma e envia o intervalo de datas selecionado
  confirm(): void {
    if (this.isDateRangeValid()) {
      this.dialogRef.close({ startDate: this.startDate, endDate: this.endDate });
    }
  }

  // Fecha a modal sem selecionar nada
  closeModal(): void {
    this.dialogRef.close();
  }

}
