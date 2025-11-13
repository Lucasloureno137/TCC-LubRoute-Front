// src/app/qr-code/qr-code.component.ts
import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { QRCodeElementType } from 'angularx-qrcode';
import { jsPDF } from 'jspdf';
import { ConfigService } from '../services/config.service';

@Component({
  selector: 'app-qr-code',
  templateUrl: './qr-code.component.html',
  styleUrls: ['./qr-code.component.css']
})
export class QrCodeComponent implements OnInit {
  tag: string = '';
  dominio: string = '';
  qrData: string = '';
  qrCodeDownloadLink: SafeUrl = '';
  qrCodeElementType: QRCodeElementType = 'canvas';
  descricao: string = '';
  icon: string = '';

  constructor(private configService: ConfigService, private http: HttpClient, private route: ActivatedRoute, private sanitizer: DomSanitizer) { }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.tag = params.get('tag') || '';
      this.dominio = params.get('dominio') || '';
      this.descricao = params.get('descricao') || '';
      this.qrData = `${this.dominio}/${this.tag}`;
    });
  }

  onDownloadQRCode() {
    const nomeEmpresa = this.recuperarNomeEmpresa();
    const canvas = document.querySelector('canvas') as HTMLCanvasElement;
    const qrCodeImageData = canvas.toDataURL('image/png');

    const scaleFactor = 3;
    const originalCanvasWidth = canvas.width;
    const originalCanvasHeight = canvas.height;
    const lineHeight = 18; // Reduzi mais ainda (era 20)
    const maxLineWidth = originalCanvasWidth * 0.9;
    const tagHeight = 25; // Reduzi também
    const topPadding = 5; // Reduzi bastante (era 15)
    const spaceBetweenTextAndQr = 2; // Espaço mínimo entre texto e QR (era 10)

    // Texto com fonte menor
    const textLines = this.wrapText(nomeEmpresa || '', maxLineWidth, 'bold 14px Arial'); // Reduzi para 14px (era 16px)
    const textHeight = textLines.length * lineHeight;

    const canvasWidth = originalCanvasWidth * scaleFactor;
    const canvasHeight = (originalCanvasHeight * scaleFactor) + (textHeight + tagHeight + topPadding + spaceBetweenTextAndQr) * scaleFactor + (80 * scaleFactor); // Reduzi o extra também

    const newCanvas = document.createElement('canvas');
    const context = newCanvas.getContext('2d');
    newCanvas.width = canvasWidth;
    newCanvas.height = canvasHeight;

    if (!context) {
      console.error('Falha ao obter o contexto do canvas');
      return;
    }

    context.scale(scaleFactor, scaleFactor);
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, newCanvas.width / scaleFactor, newCanvas.height / scaleFactor);

    // Texto mais compacto
    context.font = 'bold 14px Arial';
    context.fillStyle = '#000';
    context.textAlign = 'center';

    // Posicionamento mais justo
    textLines.forEach((line, index) => {
      const textYPosition = topPadding + (lineHeight * 0.8) + (index * lineHeight); // Ajuste fino no posicionamento
      context.fillText(line, originalCanvasWidth / 2, textYPosition);
    });

    // QR Code colado mais perto do texto
    const qrCodeYPosition = topPadding + textHeight + spaceBetweenTextAndQr;
    const qrCodeImage = new Image();
    qrCodeImage.src = qrCodeImageData;
    qrCodeImage.onload = () => {
      context.drawImage(qrCodeImage, 0, qrCodeYPosition, originalCanvasWidth, originalCanvasHeight);

      // TAG também mais compacta
      context.font = 'bold 14px Arial';
      const tagText = `TAG-${this.tag}`;
      const tagYPosition = qrCodeYPosition + originalCanvasHeight + 3; // Reduzi este espaçamento
      context.fillText(tagText, originalCanvasWidth / 2, tagYPosition);

      const additionalImage = new Image();
      additionalImage.src = 'assets/logos/lubvel_footer.png';
      additionalImage.onload = () => {
        const maxImageWidth = originalCanvasWidth * 0.5;
        let imageWidth = additionalImage.width;
        let imageHeight = additionalImage.height;

        if (imageWidth > maxImageWidth) {
          const scaleFactorImage = maxImageWidth / imageWidth;
          imageWidth = maxImageWidth;
          imageHeight = additionalImage.height * scaleFactorImage;
        }

        const logoYPosition = tagYPosition + 10;
        context.drawImage(
          additionalImage,
          (originalCanvasWidth - imageWidth) / 2,
          logoYPosition,
          imageWidth,
          imageHeight
        );

        const pdfImageData = newCanvas.toDataURL('image/png');
        const pdf = new jsPDF('portrait', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvasHeight / scaleFactor) * (pdfWidth / (canvasWidth / scaleFactor));

        pdf.addImage(pdfImageData, 'PNG', 10, 10, pdfWidth - 20, pdfHeight);
        pdf.save(`qrcode_${this.dominio}_${this.tag}.pdf`);
      };
    };
}

  // Função auxiliar para quebrar texto em várias linhas
  private wrapText(text: string, maxWidth: number, font: string): string[] {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) return [text];

    context.font = font;
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = words[0];

    for (let i = 1; i < words.length; i++) {
      const word = words[i];
      const width = context.measureText(currentLine + ' ' + word).width;
      if (width < maxWidth) {
        currentLine += ' ' + word;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }
    lines.push(currentLine);
    return lines;
  }


  recuperarNomeEmpresa() {
    // Recupera o nome da empresa do localStorage
    let nomeEmpresa = localStorage.getItem('empresaNome');
    let hasNomeEmpresa = nomeEmpresa && nomeEmpresa.length > 0;
    // Verifica se o nome da empresa foi recuperado com sucesso, senão chama API para obter o nome
    if (!hasNomeEmpresa) {
      let headers = new HttpHeaders().set('Authorization', 'Bearer ' + localStorage.getItem('token'));
      const cliente_id = localStorage.getItem('cliente_id');
      if(cliente_id){
        headers = headers.set('user-id', cliente_id);
      }
      const baseUrl = this.configService.getBaseUrl();

      this.http.get(baseUrl + '/lubvel/operacoes/dashboard', { headers }).subscribe(
        (response: any) => {
          nomeEmpresa = response.empresaNome;
          // Salva o nome da empresa no localStorage
          if (nomeEmpresa) {
            localStorage.setItem('empresaNome', nomeEmpresa);
          }
        },
        error => {
          console.log(error);
        }
      );
    }

    return nomeEmpresa;

  }






}
