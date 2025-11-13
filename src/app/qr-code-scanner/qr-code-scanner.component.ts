// src/app/qr-code-scanner/qr-code-scanner.component.ts
import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-qr-code-scanner',
  templateUrl: './qr-code-scanner.component.html',
  styleUrls: ['./qr-code-scanner.component.css']
})
export class QrCodeScannerComponent {
  @Output() scanSuccess = new EventEmitter<string>();

  onCodeResult(resultString: string) {
    this.scanSuccess.emit(resultString);
  }
}
