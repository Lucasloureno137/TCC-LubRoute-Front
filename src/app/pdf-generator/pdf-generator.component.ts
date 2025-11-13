import { Component, Input, OnInit } from '@angular/core';
import { jsPDF } from 'jspdf';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-pdf-generator',
  templateUrl: './pdf-generator.component.html',
  styleUrls: ['./pdf-generator.component.css']
})
export class PdfGeneratorComponent implements OnInit {

  @Input() titulo!: string;
  @Input() cabecalho!: string[];
  @Input() dados!: any[];
  @Input() download: boolean = false; // Novo parâmetro para determinar se deve baixar ou exibir

  pdfSrc: SafeResourceUrl | null = null;

  constructor(private sanitizer: DomSanitizer) { }

  ngOnInit(): void {
    this.gerarPDF();
  }

  gerarPDF(): void {
    const doc = new jsPDF('l', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 10;
    const rowHeight = 7; // Reduzido o tamanho da linha
    const lineSpacing = 2; // Espaçamento entre linhas
    const logo = 'assets/logos/logo-simples.jpg';
    const columnSpacing = 2;
    let currentY = 50;

    if (logo) {
      doc.addImage(logo, 'PNG', margin, 10, 10, 10);
    }
    doc.setFontSize(18);
    doc.text(this.titulo, pageWidth / 2, 35, { align: 'center' });
    doc.setFontSize(12);
    doc.text('Lubvel - Sistema De Gerenciamento De Rotinas De Lubrificação', pageWidth / 2, 17, { align: 'center' });

    const drawHeader = () => {
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      this.cabecalho.forEach((header, index) => {
        const columnWidth = (pageWidth - 2 * margin - columnSpacing * (this.cabecalho.length - 1)) / this.cabecalho.length;
        const positionX = margin + index * (columnWidth + columnSpacing);
        doc.text(header, positionX, currentY, { maxWidth: columnWidth });
      });
      currentY += rowHeight + lineSpacing;
      doc.setFont('helvetica', 'normal');
    };

    drawHeader();

    this.dados.forEach((row, rowIndex) => {
      let maxLines = 1;
      const lines: string[][] = [];
      const startY = currentY;

      // Primeiro, calcular as linhas quebradas para cada coluna
      this.cabecalho.forEach((header, index) => {
        const columnWidth = (pageWidth - 2 * margin - columnSpacing * (this.cabecalho.length - 1)) / this.cabecalho.length;
        const text = String(row[header]);
        const splitText = doc.splitTextToSize(text, columnWidth);
        lines[index] = splitText;
        maxLines = Math.max(maxLines, splitText.length);
      });

      // Verificar se precisa adicionar nova página
      if (currentY + (maxLines * rowHeight) > pageHeight - margin) {
        doc.addPage();
        currentY = 20;
        drawHeader();
      }

      // Aplica background cinza em linhas alternadas - Movido para após o cálculo de maxLines
      if (rowIndex % 2 === 1) {
        doc.setFillColor(240, 240, 240); // Cinza bem claro
        // Ajusta a altura do background de acordo com o número de linhas
        const bgHeight = (maxLines * rowHeight) + lineSpacing;
        doc.rect(margin, startY - rowHeight / 2, pageWidth - (2 * margin), bgHeight, 'F');
      }

      // Desenhar todas as linhas de texto
      this.cabecalho.forEach((header, index) => {
        const columnWidth = (pageWidth - 2 * margin - columnSpacing * (this.cabecalho.length - 1)) / this.cabecalho.length;
        const positionX = margin + index * (columnWidth + columnSpacing);
        lines[index].forEach((line, lineIndex) => {
          doc.text(line, positionX, currentY + (lineIndex * rowHeight));
        });
      });

      currentY += maxLines * rowHeight + lineSpacing;
    });

    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.text(`Página ${i} de ${totalPages}`, pageWidth - margin, pageHeight - 10, { align: 'right' });
    }

    if (this.download) {
      // Se o parâmetro for true, faz o download diretamente
      doc.save(`${this.titulo}.pdf`);
    } else {
      // Caso contrário, exibe o PDF no navegador
      const pdfBlob = doc.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      this.pdfSrc = this.sanitizer.bypassSecurityTrustResourceUrl(pdfUrl);
    }
  }
}
