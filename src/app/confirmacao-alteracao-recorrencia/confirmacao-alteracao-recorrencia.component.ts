import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

export interface ConfirmacaoAlteracaoRecorrenciaData {
  frequenciaAlterada: boolean;
  qtdHorasAlterada: boolean;
}

@Component({
  selector: 'app-confirmacao-alteracao-recorrencia',
  templateUrl: './confirmacao-alteracao-recorrencia.component.html',
  styleUrls: ['./confirmacao-alteracao-recorrencia.component.css']
})
export class ConfirmacaoAlteracaoRecorrenciaComponent {

  constructor(
    public dialogRef: MatDialogRef<ConfirmacaoAlteracaoRecorrenciaComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmacaoAlteracaoRecorrenciaData
  ) {}

  onCancelar(): void {
    this.dialogRef.close(false);
  }

  onConfirmar(): void {
    this.dialogRef.close(true);
  }

  onClose(): void {
    this.dialogRef.close(false);
  }
}
